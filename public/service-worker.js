// EXS 22nd june 2020 - Our service worker file to cache our page to allow offline data entry.

const FILES_TO_CACHE = [
    "/",
    "/public/index.js",
    "/public/styles.css",
    "/models/transaction.js",
    "/public/icons/icon-192x192.png",
    "/public/icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";


console.log("Our Service Worker");