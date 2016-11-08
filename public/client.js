if (!'serviceWorker' in navigator) {
  throw new Error('does your browser support service workers?');
}

navigator
  .serviceWorker
  .register('service-worker.js')
  .then(registration => {
    console.log(`ServiceWorker registered: ${registration.scope}`);
  }).catch(err => {
    console.error(`ServiceWorker registration failed: ${err}`);
  })
  
navigator
  .serviceWorker
  .ready
  .then(registration => {
      registration.sync.register({
        tag: 'gw-locate',         // default: ''
        minPeriod: 30 * 1000, // default: 0
        powerState: 'auto',   // default: 'auto'
        networkState: 'online'  // default: 'online'
      })
    })
    .then(periodicSyncReg => {
      console.log(`Periodic sync is installed ${periodicSyncReg}`);
    }, () => {
      throw new Error('periodSync registration failed.');
    });

class Container extends React.Component {
  clearServiceWorkers() {
    navigator.serviceWorker
      .getRegistrations()
      .then(registrations => {
        registrations.forEach(registration => {
          console.log(`clearing: ${registration}`);
          registration.unregister();
        });
      })
  }
  
  render() {
    return (
      <div>
        <p>Proximity</p>
        <button onClick={ this.clearServiceWorkers }>Clear Service Workers</button>
      </div>
    );
  }
}

ReactDOM.render(
  <Container />,
  document.getElementById('app')
);