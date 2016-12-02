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
        // It's very important to use {mode: 'no-cors'} if there is any chance that
        // the resources being fetched are served off of a server that doesn't support it
        const request = new Request(new URL(urlToPrefetch, location.href), { mode: 'no-cors' });
        return fetch(request)
          .then(response => cache.put(request, response.clone()))
          .catch(error => console.error(`Not caching ${urlToPrefetch} due to ${error}`));
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
          if(cacheName === DEMO_CACHE) {
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
      return cache.match(event.request).then(response => {
        return response || fetch(event.request).then(response => {
          if (event.request.method !== 'POST') {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    })
  );
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
  if (event.tag !== 'gwMessage') {
    return;
  }
    
  event.waitUntil(
    localforage.getItem('outbox')
      .then(sendEverythingInTheOutbox)
      .then(() => localforage.setItem('outbox', { messages: [] }))
  );
});

self.addEventListener('push', event => {
  event.waitUntil(
    clients
      .matchAll({ includeUncontrolled: true, type: 'window' })
      .then(swClients => {
        const data = event.data.json();

        swClients.forEach(c  => c.postMessage(data));

        // show notifications only if there is no visible client at the moment
        if (swClients.some(c => c.visibilityState && c.visibilityState !== 'hidden')) {
          return;
        }

        const options = {
          body: `${data.author} says: ${data.text}`,
          icon: 'https://cdn.hyperdev.com/b3db0fb8-a317-4384-bb5a-8f7f3d7e608c%2Ficon192.png',
          badge: 'https://cdn.hyperdev.com/b3db0fb8-a317-4384-bb5a-8f7f3d7e608c%2Ficon192.png'
        };
        self.registration.showNotification('Proximity Chat Message', options);
      })
  );
});

self.addEventListener('notificationclick', function(event) {
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
