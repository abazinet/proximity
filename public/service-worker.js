// we are using external library cause service workers have access only to indexedDB by design
// while it's just nice to have some high-level API to access the storage
importScripts('https://cdnjs.cloudflare.com/ajax/libs/localforage/1.4.3/localforage.min.js');

const CURRENT_CACHE_VERSION = 2;
const DEMO_CACHE = `proximity-cache_v${CURRENT_CACHE_VERSION}`;
const CACHEABLE_ASSETS = [
  '/',
  '/client.js',
  '/service-worker.js',
  '/manifest.json',
  '/style.css',
  'https://cdn.hyperdev.com/us-east-1%3A7437264b-62c7-4da4-bf79-ee13bbda998d%2Ffoundation.min.css',
  'https://fb.me/react-15.1.0.js',
  'https://fb.me/react-dom-15.1.0.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.0/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.4.3/localforage.min.js'
];

function precache(files) {
  // TODO exercise-2a
  // tip: remember to user Request with { mode: 'no-cors' }
  return Promise.resolve();
}
  
self.addEventListener('install', event => {
  event.waitUntil(precache(CACHEABLE_ASSETS));
});

self.addEventListener('activate', event => {
  // TODO exercise-2b
  // tip: clear only stale caches
});

self.addEventListener('fetch', event => {
  // TODO exercise-2b
  // tip: do not cache POST requests
});

function sendEverythingInTheOutbox(messageQueue) {
  messageQueue.messages.forEach(msg => {
    fetch('/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
  });
  return Promise.resolve();
}

self.addEventListener('sync',  event => {
  // TODO exercise-2c
  // tip: outbox content available through 'localforage.getItem('outbox')'
});

self.addEventListener('push', event => {
  // TODO exercise-3a
  // tip: use 'https://cdn.hyperdev.com/b3db0fb8-a317-4384-bb5a-8f7f3d7e608c%2Ficon192.png' as a badge/icon
});

self.addEventListener('notificationclick', function(event) {
  // TODO exercise-3b
});
