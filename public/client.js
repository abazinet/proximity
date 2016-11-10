if (!'serviceWorker' in navigator) {
  throw new Error('does your browser support service workers?');
}

navigator
  .serviceWorker
  .register('service-worker.js')
  .then(registration => console.log(`ServiceWorker registered: ${registration.scope}`))
  .catch(err => console.error(`ServiceWorker registration failed: ${err}`))

navigator
  .serviceWorker
  .ready
  .then(registration => {
    registration
      .sync
      .register('gw-background')
      .catch(err => console.log(`error ${err}`));
  });

const getLocation = () => {
  navigator.geolocation.getCurrentPosition(
    position => console.log(position), 
    () => console.log('location error'),
    { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true }
  );
};

const everyFiveSeconds = () => {
    getLocation();
    setTimeout(() => {
        everyFiveSeconds();
    }, 5000);
}

everyFiveSeconds();

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