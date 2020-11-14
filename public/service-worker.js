// File to cache
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/assets/js/index.js",
  "/assets/js/db.js",
  "/assets/css/styles.css",
  "/assets/images/icons/icon-192x192.png",
  "/assets/images/icons/icon-512x512.png",
  "/manifest.webmanifest",
];

// Static and Dynamic Cache
const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

// Install
self.addEventListener("install", function (evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Your files were pre-caches successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// Activate
self.addEventListener("activate", function (evt) {
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          console.log(key);
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", function (evt) {
  const { method } = evt.request;
  const { url } = evt.request;
  if (url.includes("/api/") && method === "GET") {
    evt.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then((cache) => {
          return fetch(evt.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache
              if (response.status === 200) {
                cache.put(evt.request, response.clone());
              }

              return response;
            })
            .catch((err) => {
              // Network request failed, try to get it from the cache
              return cache.match(evt.request);
            });
        })
        .catch((err) => console.log(err))
    );
  } else {
    // Respond from static cache, request is not for /api/*
    evt.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(evt.request).then((response) => {
          return response || fetch(evt.request);
        });
      })
    );
  }
});
