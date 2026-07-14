import { base64ToArrayBuffer, encodeWavHeader } from "../utils";

/**
 * Export a list of base64 or HTTP PCM audio chunks as a single WAV file download.
 * Handles both relative/absolute HTTP links and raw base64 data.
 */
export async function exportBriefingAsWav(audioChunks: string[], title: string): Promise<void> {
  const arrayBuffers: ArrayBuffer[] = [];

  for (const chunk of audioChunks) {
    if (chunk.startsWith("http")) {
      try {
        const res = await fetch(chunk);
        const ab = await res.arrayBuffer();
        arrayBuffers.push(ab);
      } catch (fetchErr) {
        console.error("[AudioExport] Fetch chunk error:", fetchErr);
      }
    } else {
      arrayBuffers.push(base64ToArrayBuffer(chunk));
    }
  }

  const totalByteLength = arrayBuffers.reduce((acc, ab) => acc + ab.byteLength, 0);
  const concatenatedPCM = new Uint8Array(totalByteLength);

  let writePos = 0;
  arrayBuffers.forEach((ab) => {
    concatenatedPCM.set(new Uint8Array(ab), writePos);
    writePos += ab.byteLength;
  });

  const wavBlob = encodeWavHeader(concatenatedPCM.buffer, 24000);
  const url = URL.createObjectURL(wavBlob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title || "CommuteSummary"}_Audio_24khz.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}
