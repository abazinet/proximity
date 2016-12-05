// Exercice - 1 - Geolocation
navigator.geolocation
  .getCurrentPosition(
    resolve,
    reject,
    { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true }
  );
  
// Exercice - 2 - Service worker registration
navigator
  .serviceWorker
  .register('service-worker.js')
  .then(registration => console.log(`Push ServiceWorker registered: ${registration.scope}`))
  .catch(err => console.error(`ServiceWorker registration failed: ${err}`))

// Exercice - 3 - Service worker simple caching
return cache.match(event.request).then(response => {
  return response || fetch(event.request).then(response => {
      if (event.request.method !== 'POST') {
        cache.put(event.request, response.clone());
      }
      return response;
    });
});

// Exercice - 4 - Service worker prefetch caching
// It's very important to use {mode: 'no-cors'} if there is any chance that
// the resources being fetched are served off of a server that doesn't support it
const request = new Request(new URL(urlToPrefetch, location.href), { mode: 'no-cors' });
return fetch(request)
  .then(response => cache.put(request, response.clone()))
  .catch(error => console.error(`Not caching ${urlToPrefetch} due to ${error}`));

// Exercice - 5 - Service worker background sync
event.waitUntil(
  localforage.getItem('outbox')
    .then(sendEverythingInTheOutbox)
    .then(() => localforage.setItem('outbox', { messages: [] }))
);

// Exercice - 6 - Service worker background sync
event.waitUntil(
  localforage.getItem('outbox')
    .then(sendEverythingInTheOutbox)
    .then(() => localforage.setItem('outbox', { messages: [] }))
);
  
// Exercice - 7 - Service worker push notification & message passing
swClients.forEach(c => c.postMessage(data));

// show notifications only if there is no visible client at the moment
if (swClients.some(c => c.visibilityState && c.visibilityState !== 'hidden')) {
  return;
}

self.registration.showNotification('Proximity Chat Message', options);

