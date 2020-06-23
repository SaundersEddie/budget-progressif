// EXS 22nd june 2020 - Our service worker file to cache our page to allow offline data entry.

const FILES_TO_CACHE = [
    "/",
    "public/index.js",
    "public/styles.css",
    "models/transaction.js",
    "public/icons/icon-192x192.png",
    "public/icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";


console.log("Our Service Worker");

// EXS 22nd June 2020 - Building our indexedDB if need be

//let db;
// create a new db request for a "budget" database.
const request = indexedDB.open("budget", 1);
request.onupgradeneeded = function(event) {
    // create object store called "pending" and set autoIncrement to true
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};
request.onsuccess = function(event) {
    db = event.target.result;
    // check if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};
request.onerror = function(event) {
    console.log("Woops! " + event.target.errorCode);
};

function checkDatabase() {
    // open a transaction on your pending db
    const transaction = db.transaction(["pending"], "readwrite");
    // access your pending object store
    const store = transaction.objectStore("pending");
    // get all records from store and set to a variable
    const getAll = store.getAll();
    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                    method: "POST",
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    }
                })
                .then(response => response.json())
                .then(() => {
                    // if successful, open a transaction on your pending db
                    const transaction = db.transaction(["pending"], "readwrite");
                    // access your pending object store
                    const store = transaction.objectStore("pending");
                    // clear all items in your store
                    store.clear();
                });
        }
    };
}

// EXS End of our indexedDB build

// install
self.addEventListener("install", function(evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", function(evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
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

// fetch
self.addEventListener("fetch", function(evt) {
    // cache successful requests to the API
    if (evt.request.url.includes("/api/")) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request)
                    .then(response => {
                        // If the response was good, clone it and store it in the cache.
                        if (response.status === 200) {
                            cache.put(evt.request.url, response.clone());
                        }

                        return response;
                    })
                    .catch(err => {
                        // Network request failed, try to get it from the cache.
                        return cache.match(evt.request);
                    });
            }).catch(err => console.log(err))
        );

        return;
    }

    // if the request is not for the API, serve static assets using "offline-first" approach.
    // see https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
    evt.respondWith(
        caches.match(evt.request).then(function(response) {
            return response || fetch(evt.request);
        })
    );
});