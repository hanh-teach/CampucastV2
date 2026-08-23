// sw.js - Service Worker cấp độ Enterprise cho CommuteCast PWA
const CACHE_NAME = "commutecast-v2.5";
const AUDIO_CACHE_NAME = "commutecast-audio-v2.5";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.jpg",
  "/icon-512.jpg"
];

// Cài đặt Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets with CACHE_NAME:", CACHE_NAME);
        return Promise.allSettled(
          STATIC_ASSETS.map((url) => 
            cache.add(url).catch((err) => console.warn(`[SW] Failed to cache: ${url}`, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Kích hoạt Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
            console.log("[SW] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Xử lý tin nhắn ngầm (postMessage) từ giao diện client / Trình phát âm thanh
self.addEventListener("message", (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  if (type === "BACKGROUND_AUDIO_KEEPALIVE") {
    // Keep service worker active during long commute drive sessions
    console.log("[SW] Background Audio Keep-Alive Ping received:", payload?.title || "Active Driving Mode");
  } else if (type === "CACHE_AUDIO_BUFFER") {
    // Cache generated TTS audio buffer or briefing segment for offline background playback
    if (payload?.url && payload?.data) {
      caches.open(AUDIO_CACHE_NAME).then((cache) => {
        const response = new Response(payload.data, {
          headers: { "Content-Type": payload.contentType || "audio/wav" }
        });
        cache.put(payload.url, response);
        console.log("[SW] Cached audio payload offline:", payload.url);
      });
    }
  }
});

// Xử lý sự kiện Push Notification từ máy chủ / đám mây
self.addEventListener("push", (event) => {
  let data = { 
    title: "CommuteCast - Sẵn sàng phát!", 
    body: "Bản tin phát thanh cá nhân hóa mới của bạn đã hoàn thành!" 
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icon-192.jpg",
    badge: "/icon-192.jpg",
    vibrate: [100, 50, 100],
    data: {
      url: "/"
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Xử lý sự kiện click vào thông báo để dẫn người dùng quay lại ứng dụng
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});

// Xử lý chiến lược Caching linh hoạt cho PWA Offline Audio & Navigation
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip dynamic API proxy calls unless it is a cached audio synthesis asset
  if (url.pathname.startsWith("/api/")) {
    if (url.pathname.includes("/synthesize") || url.pathname.includes("/audio")) {
      event.respondWith(
        caches.open(AUDIO_CACHE_NAME).then((cache) => {
          return cache.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log("[SW] Serving TTS Audio from Offline PWA Cache:", url.pathname);
              return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            }).catch(() => {
              return new Response("Offline audio unavailable", { status: 503 });
            });
          });
        })
      );
      return;
    }
    return;
  }

  // Network-First strategy for HTML navigation pages to avoid the stale cache white-screen trap
  if (event.request.mode === "navigate" || url.pathname === "/" || url.pathname === "/index.html") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match("/index.html") || caches.match("/");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request).then((networkResponse) => {
          if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
            return networkResponse;
          }

          const mime = networkResponse.headers.get("content-type") || "";
          const isStaticAsset = mime.includes("javascript") || mime.includes("css") || mime.includes("image") || mime.includes("font") ||
            event.request.url.includes("fonts.googleapis.com") || event.request.url.includes("fonts.gstatic.com") || event.request.url.includes("lucide");

          if (isStaticAsset && (networkResponse.type === "basic" || networkResponse.type === "cors" || networkResponse.type === "opaque")) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }

          return networkResponse;
        }).catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
      })
  );
});
