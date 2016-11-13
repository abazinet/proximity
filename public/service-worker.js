self.addEventListener('install', event => {
  console.log('install event', event)
});

self.addEventListener('fetch', event => {
  // TODO: ALEX: Keep a cache of participants and of messages to work offline
  console.log('fetch event', event)
});

self.addEventListener('sync',  event => {
  console.log('background sync');
  //event.waitUntil();
});

// TODO: ALEX: Handle push notifications