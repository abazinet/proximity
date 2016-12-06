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
  return caches.open(DEMO_CACHE).then(cache => {
      const cachePromises = files.map(urlToPrefetch => {
        // Exercice - 4 - Service worker prefetch caching - START
        
        // Implement me
        return Promise.resolve({});

        // Exercice - 4 - Service worker prefetch caching - STOP
      });

      return Promise.all(cachePromises).then(() => console.log('Pre-fetching completed.'));
    })
    .catch(error => console.error('Pre-fetching failed:', error));
}

self.addEventListener('install', event => {
  event.waitUntil(precache(CACHEABLE_ASSETS));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName === DEMO_CACHE) {
            return Promise.resolve();
          }
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(DEMO_CACHE).then(cache => {
      
      // Exercice - 3 - Service worker simple caching - START
      
      // Implement service worker caching

      // Exercice - 3 - Service worker simple caching - STOP
    })
  );
});

function sendEverythingInTheOutbox(messageQueue) {
  setTimeout(() => messageQueue.messages.forEach(msg => {
    return fetch('/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
  }), 1000);
  return Promise.resolve();
}

self.addEventListener('sync', event => {
  if (event.tag !== 'gwMessage') {
    return;
  }

  // Exercice - 5 - Service worker background sync - START
 
  // implement me using localforage.getItem(...)

  // Exercice - 5 - Service worker background sync - STOP
});

self.addEventListener('push', event => {
  event.waitUntil(
    clients
      .matchAll({ includeUncontrolled: true, type: 'window' })
      .then(swClients => {
        const data = event.data.json();

        const options = {
          body: `${data.author} says: ${data.text}`,
          icon: 'https://cdn.hyperdev.com/b3db0fb8-a317-4384-bb5a-8f7f3d7e608c%2Ficon192.png',
          badge: 'https://cdn.hyperdev.com/b3db0fb8-a317-4384-bb5a-8f7f3d7e608c%2Ficon192.png'
        };
        // Exercice - 7 - Service worker push notification & message passing - START

        // implement sending the notification to the browser window and 
        // passing the data back to the browser process

        // Exercice - 7 - Service worker push notification & message passing - STOP
      })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ includeUncontrolled: true, type: 'window' })
      .then(swClients => {
        // This looks to see if any client windows are open and tries to focus one
        for (const client of swClients) {
          if ('focus' in client) {
            return client.focus();
          }
        }

        // Anotherwise it just opens a new one
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
