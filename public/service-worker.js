self.addEventListener('install', event => {
  console.log('install event', event);
});

self.addEventListener('fetch', event => {
  // TODO: ALEX: Keep a cache of participants and of messages to work offline
  console.log('fetch event', event)
});

self.addEventListener('sync',  event => {
  console.log('background sync');
  //event.waitUntil();
});

self.addEventListener('push', event => {
  const data = event.data.text();
  const options = {
    body: `${data.author} says: ${data.text}`,
    icon: 'https://cdn.hyperdev.com/b3db0fb8-a317-4384-bb5a-8f7f3d7e608c%2Ficon192.png',
    badge: 'https://cdn.hyperdev.com/b3db0fb8-a317-4384-bb5a-8f7f3d7e608c%2Ficon192.png'
  };
  
  // TODO Tomek: do not open notification when app's window is opened
  event.waitUntil(self.registration.showNotification('Proximity Chat message', options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

	// This looks to see if any windows are open and tries to focus one.
	// Otherwise it just opens a new window.
	event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
  	.then(clientsList => {
      for (const client of clientsList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
  		
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});