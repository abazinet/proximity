self.addEventListener('install', event => {
  console.log('install event', event);
});

// self.addEventListener('fetch', event => {
//   // TODO: ALEX: Keep a cache of participants and of messages to work offline
//   console.log('fetch event', event)
// });

// self.addEventListener('sync',  event => {
//   console.log('background sync');
//   //event.waitUntil();
// });

// self.addEventListener('push', event => {
//   // TODO impl
//   console.log('[Service Worker] Push Received.');
//   console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

//   const title = 'Push Codelab';
//   const options = {
//     body: 'Yay it works.',
//     icon: 'images/icon.png',
//     badge: 'images/badge.png'
//   };

//   event.waitUntil(self.registration.showNotification(title, options));
// });

// self.addEventListener('notificationclick', function(event) {
//   // TODO impl
//   console.log('[Service Worker] Notification click Received.');

//   event.notification.close();

//   event.waitUntil(
//     clients.openWindow('https://google.com')
//   );
// });