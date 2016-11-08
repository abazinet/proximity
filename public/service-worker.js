self.addEventListener('install', event => {
  console.log('install event', event)
})

self.addEventListener('fetch', event => {
  console.log('fetch event', event)
})

self.addEventListener('sync', function (event) {
  if (event.tag === 'gw-locate') {
    console.log('locate me');
  }
});