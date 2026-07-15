import express from "express";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as xml2js from "xml2js";
import { 
  LOCAL_AUDIO_DIR, 
  getGcsClient, 
  getSupabaseClient, 
  encodeWavHeaderNode,
  SUPABASE_BUCKET_NAME
} from "../shared";

const router = express.Router();
const PODCASTS_JSON_PATH = path.join(process.cwd(), "published-podcasts.json");

interface PublishedEpisode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  audioUrl: string;
  duration: number;
}

// Global state moved from server.ts
let cachedEpisodesInMem: PublishedEpisode[] | null = null;
let lastCacheSyncTime = 0;
let cachedRssXml: string | null = null;
let lastRssXmlTimestamp = 0;

async function loadPublishedEpisodesFromSupabaseAsync(): Promise<PublishedEpisode[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    let rawData: any = null;
    let downloadErr: any = null;
    let loadedFilename = "";

    try {
      const { data, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).list("audio");
      if (!error && data && data.length > 0) {
        const jsonFiles = data.filter((f: any) => f.name.startsWith("metadata_v_") && f.name.endsWith(".json"));
        if (jsonFiles.length > 0) {
          jsonFiles.sort((a: any, b: any) => b.name.localeCompare(a.name));
          const latestFile = jsonFiles[0];
          loadedFilename = `audio/${latestFile.name}`;
          console.log(`[Podcast - Supabase] Found latest versioned metadata file: ${loadedFilename}`);
          const { data: fileData, error: downloadError } = await supabase.storage.from(SUPABASE_BUCKET_NAME).download(loadedFilename);
          if (!downloadError && fileData) {
            rawData = fileData;
          } else if (downloadError) {
            downloadErr = downloadError;
          }
        }
      }
    } catch (listErr: any) {
      console.log("[Podcast - Supabase] Versioned metadata folder query completed (uninitialized or empty).");
    }

    if (!rawData) {
      console.log("[Podcast - Supabase] Versioned metadata not found. Trying primary static metadata/published-podcasts.json path...");
      try {
        const { data, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).download("metadata/published-podcasts.json");
        if (!error && data) {
          rawData = data;
          loadedFilename = "metadata/published-podcasts.json";
        } else {
          downloadErr = error;
        }
      } catch (err: any) {
        downloadErr = err;
      }
    }

    if (!rawData) {
      console.log("[Podcast - Supabase] Static primary path not found. Checking fallback static audio/published-podcasts.json path...");
      try {
        const { data, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).download("audio/published-podcasts.json");
        if (!error && data) {
          rawData = data;
          loadedFilename = "audio/published-podcasts.json";
        } else if (error) {
          downloadErr = error;
        }
      } catch (err: any) {
        downloadErr = err;
      }
    }

    if (rawData) {
      const text = await rawData.text();
      const eps = JSON.parse(text);
      if (Array.isArray(eps)) {
        console.log(`[Podcast - Supabase] Successfully fetched published episodes from Supabase Storage (${loadedFilename}).`);
        try {
          fs.writeFileSync(PODCASTS_JSON_PATH, JSON.stringify(eps, null, 2), "utf8");
        } catch (localWriteErr) { /* ignore */ }
        cachedEpisodesInMem = eps;
        lastCacheSyncTime = Date.now();
        return eps;
      }
    } else {
      const errMsg = downloadErr?.message || String(downloadErr || "");
      if (errMsg.includes("fetch failed") || errMsg.includes("Failed to fetch")) {
        console.log("[Podcast - Supabase] Supabase service offline or network unreachable. Proceeding with local caching database.");
      } else {
        console.log("[Podcast - Supabase] Metadata not initialized in cloud storage bucket yet (first run/cold start). Proceeding with local cache.");
      }
    }
  } catch (err: any) {
    const errMsg = err.message || String(err || "");
    if (errMsg.includes("fetch failed") || errMsg.includes("Failed to fetch")) {
      console.log("[Podcast - Supabase] Supabase service is offline/unreachable.");
    } else {
      console.log("[Podcast - Supabase] Supabase metadata download deferred:", errMsg);
    }
  }
  return [];
}

async function savePublishedEpisodesToSupabaseAsync(episodes: PublishedEpisode[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const jsonStr = JSON.stringify(episodes, null, 2);
    const fileBuffer = Buffer.from(jsonStr, "utf8");

    console.log("[Podcast - Supabase] Syncing metadata to Supabase Cloud Storage...");

    const timestamp = Date.now();
    const newFilename = `audio/metadata_v_${timestamp}.json`;
    console.log(`[Podcast - Supabase] Strategy 1: Uploading brand new versioned metadata: ${newFilename}`);

    let uploadResult = await supabase.storage.from(SUPABASE_BUCKET_NAME).upload(newFilename, fileBuffer, {
      contentType: "application/json",
      upsert: false,
    });

    if (uploadResult.error) {
      console.warn(`[Podcast - Supabase] Strategy 1 (Versioned Upload) failed: ${uploadResult.error.message}. Trying standard static paths...`);
      uploadResult = await supabase.storage.from(SUPABASE_BUCKET_NAME).upload("metadata/published-podcasts.json", fileBuffer, {
        contentType: "application/json",
        upsert: true,
      });
      if (uploadResult.error) {
        console.log("[Podcast - Supabase] metadata/ upload with upsert failed. Attempting remove then insert...");
        try { await supabase.storage.from(SUPABASE_BUCKET_NAME).remove(["metadata/published-podcasts.json"]); } catch (re) { }
        uploadResult = await supabase.storage.from(SUPABASE_BUCKET_NAME).upload("metadata/published-podcasts.json", fileBuffer, {
          contentType: "application/json",
          upsert: false,
        });
      }
      if (uploadResult.error) {
        console.warn("[Podcast - Supabase] Primary path metadata/ failed (RLS folder check). Trying audio/ folder fallback...");
        let fallbackResult = await supabase.storage.from(SUPABASE_BUCKET_NAME).upload("audio/published-podcasts.json", fileBuffer, {
          contentType: "application/json",
          upsert: true,
        });
        if (fallbackResult.error) {
          console.log("[Podcast - Supabase] audio/ fallback upload with upsert failed. Attempting remove then insert...");
          try { await supabase.storage.from(SUPABASE_BUCKET_NAME).remove(["audio/published-podcasts.json"]); } catch (re) { }
          fallbackResult = await supabase.storage.from(SUPABASE_BUCKET_NAME).upload("audio/published-podcasts.json", fileBuffer, {
            contentType: "application/json",
            upsert: false,
          });
        }
        if (fallbackResult.error) {
          console.error("[Podcast - Supabase] All metadata sync strategies failed:", fallbackResult.error.message || fallbackResult.error);
        } else {
          console.log("[Podcast - Supabase] Metadata synchronized to Cloud Storage successfully via fallback path: audio/published-podcasts.json");
        }
      } else {
        console.log("[Podcast - Supabase] Metadata synchronized to Cloud Storage successfully via primary path: metadata/published-podcasts.json");
      }
    } else {
      console.log(`[Podcast - Supabase] Metadata synchronized to Cloud Storage successfully via versioned path: ${newFilename}`);
      try {
        const { data } = await supabase.storage.from(SUPABASE_BUCKET_NAME).list("audio");
        if (data) {
          const oldFiles = data
            .filter((f: any) => f.name.startsWith("metadata_v_") && f.name.endsWith(".json"))
            .map((f: any) => `audio/${f.name}`)
            .filter((name: string) => name !== newFilename);
          if (oldFiles.length > 0) {
            supabase.storage.from(SUPABASE_BUCKET_NAME).remove(oldFiles).catch(() => { });
          }
        }
      } catch (e) { /* ignore */ }
    }
  } catch (err: any) {
    console.error("[Podcast - Supabase] Unexpected error uploading metadata:", err.message || err);
  }
}

async function loadPublishedEpisodes(forceRefresh: boolean = false): Promise<PublishedEpisode[]> {
  const cacheAge = Date.now() - lastCacheSyncTime;
  if (cachedEpisodesInMem && cacheAge < 15000 && !forceRefresh) {
    return cachedEpisodesInMem;
  }

  let localEps: PublishedEpisode[] = [];
  try {
    if (fs.existsSync(PODCASTS_JSON_PATH)) {
      const data = fs.readFileSync(PODCASTS_JSON_PATH, "utf8");
      localEps = JSON.parse(data);
    }
  } catch (err) { /* ignore */ }

  try {
    const cloudEps = await loadPublishedEpisodesFromSupabaseAsync();
    if (cloudEps && cloudEps.length > 0) {
      cachedEpisodesInMem = cloudEps;
      lastCacheSyncTime = Date.now();
      return cloudEps;
    }
  } catch (err) { /* ignore */ }

  return localEps.length > 0 ? localEps : (cachedEpisodesInMem || []);
}

async function savePublishedEpisodes(episodes: PublishedEpisode[]) {
  cachedEpisodesInMem = episodes;
  lastCacheSyncTime = Date.now();
  cachedRssXml = null;
  try {
    fs.writeFileSync(PODCASTS_JSON_PATH, JSON.stringify(episodes, null, 2), "utf8");
  } catch (err) {
    console.error("[Podcast] Failed to write local file:", err);
  }
  await savePublishedEpisodesToSupabaseAsync(episodes);
}

function isMp3Buffer(buffer: Buffer): boolean {
  if (buffer.length < 3) return false;
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
  if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) return true;
  return false;
}

function getMp3Duration(buffer: Buffer): number {
  let offset = 0;
  if (buffer.length >= 10 && buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    const size = ((buffer[6] & 0x7F) << 21) | ((buffer[7] & 0x7F) << 14) | ((buffer[8] & 0x7F) << 7) | (buffer[9] & 0x7F);
    offset = 10 + size;
    const flags = buffer[5];
    if ((flags & 0x10) !== 0) offset += 10;
  }

  const bitratesMpeg1L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
  const bitratesMpeg2L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
  const sampleRatesMpeg1 = [44100, 48000, 32000, 0];
  const sampleRatesMpeg2 = [22050, 24000, 16000, 0];
  const sampleRatesMpeg25 = [11025, 12000, 8000, 0];

  let frameCount = 0;
  let totalSamplesCount = 0;
  let sumSampleRates = 0;

  while (offset < buffer.length - 4) {
    if (buffer[offset] === 0xFF && (buffer[offset + 1] & 0xE0) === 0xE0) {
      const b1 = buffer[offset + 1];
      const b2 = buffer[offset + 2];

      const versionID = (b1 >> 3) & 0x03;
      const layer = (b1 >> 1) & 0x03;

      if (layer === 1) {
        const bitrateIdx = (b2 >> 4) & 0x0F;
        const srIdx = (b2 >> 2) & 0x03;
        const padding = (b2 >> 1) & 0x01;

        let bitrate = 0;
        let sampleRate = 0;
        let samplesPerFrame = 1152;

        if (versionID === 3) {
          bitrate = bitratesMpeg1L3[bitrateIdx] * 1000;
          sampleRate = sampleRatesMpeg1[srIdx];
        } else if (versionID === 2) {
          bitrate = bitratesMpeg2L3[bitrateIdx] * 1000;
          sampleRate = sampleRatesMpeg2[srIdx];
          samplesPerFrame = 576;
        } else if (versionID === 0) {
          bitrate = bitratesMpeg2L3[bitrateIdx] * 1000;
          sampleRate = sampleRatesMpeg25[srIdx];
          samplesPerFrame = 576;
        }

        if (bitrate > 0 && sampleRate > 0) {
          const frameLength = Math.floor((samplesPerFrame / 8 * bitrate) / sampleRate) + padding;
          if (frameLength > 0) {
            frameCount++;
            totalSamplesCount += samplesPerFrame;
            sumSampleRates += sampleRate;
            offset += frameLength;
            continue;
          }
        }
      }
    }
    offset++;
  }

  if (frameCount > 0 && totalSamplesCount > 0) {
    const avgSampleRate = sumSampleRates / frameCount;
    return totalSamplesCount / avgSampleRate;
  }
  const remainingSize = buffer.length - offset;
  return Math.max(30, Math.floor(remainingSize / 16000));
}

async function uploadAudioToSupabase(audioBuffer: Buffer, fileName: string, contentType: string = "audio/mpeg"): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not configured or initialized.");

  const fileExt = contentType === "audio/wav" ? "wav" : "mp3";
  const uniqueFileName = `audio/${uuidv4()}-${fileName}.${fileExt}`;
  console.log(`[Supabase] Uploading audio binary to bucket "${SUPABASE_BUCKET_NAME}" (Type: ${contentType}): ${uniqueFileName}`);

  const { data, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).upload(uniqueFileName, audioBuffer, {
    contentType: contentType,
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    console.error("[Supabase] Upload error detail:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl(uniqueFileName);
  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error("Failed to capture public URL from Supabase Storage.");
  }

  console.log(`[Supabase] Success! Public url generated: ${publicUrlData.publicUrl}`);
  return publicUrlData.publicUrl;
}

function safeToUTCString(dateStr: string): string {
  if (!dateStr) return new Date().toUTCString();
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toUTCString();

  try {
    const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})([,\s]+(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const hour = match[5] ? parseInt(match[5], 10) : 0;
      const minute = match[6] ? parseInt(match[6], 10) : 0;
      const second = match[8] ? parseInt(match[8], 10) : 0;
      const customDate = new Date(Date.UTC(year, month, day, hour, minute, second));
      if (!isNaN(customDate.getTime())) return customDate.toUTCString();
    }
  } catch (err) { /* fallback */ }

  return new Date().toUTCString();
}

// Router Endpoints

router.get("/local-podcasts/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(LOCAL_AUDIO_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Local podcast audio file not found.");
  }

  try {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = filename.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
    const isDownload = req.query.download === "true";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).set({ "Content-Range": `bytes */${fileSize}` }).send("Requested range not satisfiable\n");
        return;
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head: Record<string, any> = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
      };
      if (isDownload) head["Content-Disposition"] = `attachment; filename="${filename}"`;
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head: Record<string, any> = {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      };
      if (isDownload) head["Content-Disposition"] = `attachment; filename="${filename}"`;
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err: any) {
    console.error("Error streaming local podcast:", err);
    if (!res.headersSent) res.status(500).send("Internal server error during media stream.");
  }
});

router.get("/podcast/episodes", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const episodes = await loadPublishedEpisodes(forceRefresh);
    res.json(episodes);
  } catch (err: any) {
    console.error("Failed to fetch published episodes:", err);
    res.status(500).json({ error: err.message || "Failed to load episodes" });
  }
});

router.post("/podcast/publish", async (req, res): Promise<any> => {
  try {
    const { briefId, briefing } = req.body;
    if (!briefing || !briefing.audioChunks || briefing.audioChunks.length === 0) {
      return res.status(400).json({ error: "No compiled briefing audio chunks provided for publishing." });
    }

    const episodes = await loadPublishedEpisodes(true);
    const existing = episodes.find(ep => ep.id === briefId);
    if (existing) {
      return res.json({ success: true, audioUrl: existing.audioUrl, message: "This episode is already published!" });
    }

    const rawBuffers = briefing.audioChunks.map((chunk: string) => Buffer.from(chunk, "base64"));
    const isMp3 = isMp3Buffer(rawBuffers[0] || Buffer.alloc(0));
    const contentType = isMp3 ? "audio/mpeg" : "audio/wav";
    const fileExt = isMp3 ? "mp3" : "wav";

    let rawAudioBuffer: Buffer;
    if (!isMp3) {
      const silenceBuffer = Buffer.alloc(48000);
      const segmentsWithSilence: Buffer[] = [];
      rawBuffers.forEach((buf, idx) => {
        segmentsWithSilence.push(buf);
        if (idx < rawBuffers.length - 1) {
          segmentsWithSilence.push(silenceBuffer);
        }
      });
      rawAudioBuffer = Buffer.concat(segmentsWithSilence);
    } else {
      rawAudioBuffer = Buffer.concat(rawBuffers);
    }

    let finalAudioBuffer = rawAudioBuffer;
    if (!isMp3) {
      console.log(`[Podcast] Detected raw 16-bit PCM stream. Prepending 44-byte WAV header for 24000Hz playability...`);
      finalAudioBuffer = encodeWavHeaderNode(rawAudioBuffer, 24000);
    }

    const sanitizedTitle = briefing.payload?.title ? briefing.payload.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() : "podcast";
    const uniqueId = uuidv4();
    const filename = `${uniqueId}_${sanitizedTitle}.${fileExt}`;

    let finalAudioUrl = "";
    let uploadedToSupabase = false;
    let supabaseErrorMsg = "";

    try {
      finalAudioUrl = await uploadAudioToSupabase(finalAudioBuffer, sanitizedTitle, contentType);
      uploadedToSupabase = true;
    } catch (sbErr: any) {
      supabaseErrorMsg = sbErr.message || String(sbErr);
      console.warn("[Podcast - Supabase] Supabase upload failed, trying GCS fallback:", sbErr.message || sbErr);
    }

    if (!uploadedToSupabase) {
      const gcs = getGcsClient();
      const bucketName = process.env.GCS_BUCKET_NAME;
      if (gcs && bucketName) {
        try {
          console.log(`[Podcast - GCS] Fallback active. Uploading to GCS: ${filename}...`);
          const bucket = gcs.bucket(bucketName);
          const file = bucket.file(`audio/${filename}`);
          await file.save(finalAudioBuffer, { metadata: { contentType: contentType } });
          const publicUrlPrefix = process.env.CLOUD_STORAGE_PUBLIC_URL || "https://storage.googleapis.com";
          finalAudioUrl = `${publicUrlPrefix}/${bucketName}/audio/${filename}`;
          console.log(`[Podcast - GCS] Fallback uploaded! Public URL: ${finalAudioUrl}`);
          uploadedToSupabase = true;
        } catch (gcsErr) {
          console.error("[Podcast - GCS] GCS fallback failed as well:", gcsErr);
        }
      }
    }

    if (!finalAudioUrl) {
      console.log(`[Podcast] GCS & Supabase offline. Writing file locally as emergency backup...`);
      const localPath = path.join(LOCAL_AUDIO_DIR, filename);
      fs.writeFileSync(localPath, finalAudioBuffer);
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      finalAudioUrl = `${appUrl}/api/local-podcasts/${filename}`;
    }

    let calculatedDuration = 120;
    if (isMp3) {
      calculatedDuration = Math.round(getMp3Duration(rawAudioBuffer));
    } else {
      calculatedDuration = Math.round(rawAudioBuffer.length / 48000);
    }
    if (!calculatedDuration || calculatedDuration < 5) calculatedDuration = 120;

    const newEpisode: PublishedEpisode = {
      id: briefId,
      title: briefing.payload?.title || "Bản tin không tên",
      description: (briefing.payload?.introduction || "Bản tin phát thanh CommuteCast").substring(0, 400) + "...",
      pubDate: briefing.timestamp || new Date().toISOString(),
      audioUrl: finalAudioUrl,
      duration: calculatedDuration
    };

    episodes.unshift(newEpisode);
    await savePublishedEpisodes(episodes);
    cachedEpisodesInMem = episodes; 
    lastCacheSyncTime = Date.now();
    cachedRssXml = null;
    lastRssXmlTimestamp = 0;
    console.log("[Podcast] RSS feed cache invalidated after publishing new episode.");

    return res.json({
      success: true,
      audioUrl: finalAudioUrl,
      storageType: uploadedToSupabase ? "supabase" : "local",
      supabaseError: supabaseErrorMsg || undefined,
      message: "Podcast published successfully!"
    });
  } catch (err: any) {
    console.error("Publish podcast error:", err);
    res.status(500).json({ error: err.message || "Failed to publish podcast episode" });
  }
});

router.delete("/podcast/episodes/:id", async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const episodes = await loadPublishedEpisodes(true);
    const index = episodes.findIndex(ep => ep.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Podcast episode not found." });
    }

    const targetEpisode = episodes[index];
    const urlParts = targetEpisode.audioUrl.split("/");
    const filename = urlParts[urlParts.length - 1];

    if (targetEpisode.audioUrl.includes("/api/local-podcasts/")) {
      const localPath = path.join(LOCAL_AUDIO_DIR, filename);
      if (fs.existsSync(localPath)) {
        try { fs.unlinkSync(localPath); } catch (fErr) { console.error("Error deleting local file:", fErr); }
      }
    } else if (targetEpisode.audioUrl.includes("supabase.co") || targetEpisode.audioUrl.includes(SUPABASE_BUCKET_NAME) || targetEpisode.audioUrl.includes("podcast-audio")) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          console.log(`[Podcast - Supabase] Attempting file removal from storage bucket: audio/${filename}`);
          let storagePath = `audio/${filename}`;
          const splitKey = targetEpisode.audioUrl.includes(`/${SUPABASE_BUCKET_NAME}/`) 
            ? `/${SUPABASE_BUCKET_NAME}/` 
            : "/podcast-audio/";
          if (targetEpisode.audioUrl.includes(splitKey)) {
            const remaining = targetEpisode.audioUrl.substring(targetEpisode.audioUrl.indexOf(splitKey) + splitKey.length);
            if (remaining) {
              storagePath = decodeURIComponent(remaining);
            }
          }
          const { error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).remove([storagePath]);
          if (error) {
            // Try fallback old bucket if it fails
            if (SUPABASE_BUCKET_NAME !== "podcast-audio") {
              await supabase.storage.from("podcast-audio").remove([storagePath]).catch(() => {});
            }
            console.warn("[Supabase] Delete warning:", error.message || error);
          }
          else console.log(`[Podcast - Supabase] Successfully removed file from buckets: ${storagePath}`);
        } catch (sbDelErr) {
          console.error("Error deleting file from Supabase storage:", sbDelErr);
        }
      }
    } else {
      const gcs = getGcsClient();
      const bucketName = process.env.GCS_BUCKET_NAME;
      if (gcs && bucketName) {
        try {
          const bucket = gcs.bucket(bucketName);
          const file = bucket.file(`audio/${filename}`);
          const [exists] = await file.exists();
          if (exists) { await file.delete(); console.log(`[Podcast - GCS] Deleted GCS object: audio/${filename}`); }
        } catch (gcsDelErr) {
          console.error("Error deleting file from GCS:", gcsDelErr);
        }
      }
    }

    episodes.splice(index, 1);
    await savePublishedEpisodes(episodes);
    cachedRssXml = null;
    lastRssXmlTimestamp = 0;
    console.log(`[Podcast] RSS feed cache invalidated after deleting episode ${id}.`);

    return res.json({ success: true, message: "Episode deleted successfully" });
  } catch (err: any) {
    console.error("Failed to delete episode:", err);
    res.status(500).json({ error: err.message || "Failed to delete episode" });
  }
});

router.get("/podcast/feed", async (req, res): Promise<any> => {
  try {
    const now = Date.now();
    if (cachedRssXml && (now - lastRssXmlTimestamp < 60000)) {
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("X-Cache", "HIT");
      return res.send(cachedRssXml);
    }

    const episodes = await loadPublishedEpisodes(true);
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

    const recentEpisodes = episodes.slice(0, 100);

    const rssItems = recentEpisodes.map((ep) => {
      return {
        title: [ep.title],
        description: [ep.description],
        pubDate: [safeToUTCString(ep.pubDate)],
        enclosure: { $: { url: ep.audioUrl, length: "0", type: "audio/mpeg" } },
        guid: [ep.audioUrl],
        "itunes:duration": [String(ep.duration)],
        "itunes:image": { $: { href: `${appUrl}/icon-512.jpg` } },
        "itunes:explicit": ["false"]
      };
    });

    const feedObj = {
      rss: {
        $: {
          version: "2.0",
          "xmlns:itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd",
          "xmlns:content": "http://purl.org/rss/1.0/modules/content/"
        },
        channel: {
          title: ["CommuteCast - Bản tin phát thanh cá nhân"],
          description: ["Tạo và nghe bản tin phát thanh cá nhân hóa, đồng bộ hóa lộ trình thông tin thông minh mỗi ngày."],
          link: [appUrl],
          language: ["vi"],
          copyright: [`© ${new Date().getFullYear()} CommuteCast`],
          "itunes:author": ["CommuteCast Anchor"],
          "itunes:summary": ["Tạo và nghe bản tin phát thanh cá nhân hóa song ngữ Anh/Việt được dệt tự động từ tin tức của bạn."],
          "itunes:explicit": ["false"],
          "itunes:image": { $: { href: `${appUrl}/icon-512.jpg` } },
          "itunes:category": { $: { text: "Technology" } },
          item: rssItems
        }
      }
    };

    const builder = new xml2js.Builder({ xmldec: { version: "1.0", encoding: "UTF-8" } });
    let xml = builder.buildObject(feedObj);

    const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
    if (xml.startsWith(xmlDeclaration)) {
      xml = xmlDeclaration + '\n<?xml-stylesheet type="text/xsl" href="/rss-style.xsl"?>' + xml.substring(xmlDeclaration.length);
    } else {
      xml = '<?xml-stylesheet type="text/xsl" href="/rss-style.xsl"?>\n' + xml;
    }

    cachedRssXml = xml;
    lastRssXmlTimestamp = now;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("X-Cache", "MISS");
    return res.send(xml);
  } catch (err: any) {
    console.error("RSS feed generation failed:", err);
    res.status(500).send("<error>Failed to generate RSS feed</error>");
  }
});

export default router;
