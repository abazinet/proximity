// we are using external library cause service workers have access only to indexedDB by design
// while it's just nice to have some high-level API to access the storage
importScripts('https://cdnjs.cloudflare.com/ajax/libs/localforage/1.4.3/localforage.min.js');

self.addEventListener('install', event => {
  console.log('install event', event);
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open('proximity-cache').then(cache => {
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

        // show notifications only if there is no visible client at the moment
        if (swClients.some(c => c.visibilityState && c.visibilityState !== 'hidden')) {
          swClients.forEach(c  => c.postMessage(data));
          return;
        }

        const options = {
          body: `${data.author} says: ${data.text}`,
          icon: 'https://cdn.hyperdev.com/b3db0fb8-a317-4384-bb5a-8f7f3d7e608c%2Ficon192.png',
          badge: 'https://cdn.hyperdev.com/b3db0fb8-a317-4384-bb5a-8f7f3d7e608c%2Ficon192.png'
        };
        self.registration.showNotification('Proximity Chat message', options);
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