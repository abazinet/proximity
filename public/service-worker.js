self.addEventListener('install', event => {
  console.log('install event', event)
});

self.addEventListener('fetch', event => {
  console.log('fetch event', event)
});

self.addEventListener('sync',  event => {
  console.log('background sync');
  //event.waitUntil();
});