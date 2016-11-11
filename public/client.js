function registerBackgroundSync() {
  if (!'serviceWorker' in navigator) {
    throw new Error('does your browser support service workers?');
  }

  navigator
    .serviceWorker
    .register('service-worker.js')
    .then(registration => console.log(`ServiceWorker registered: ${registration.scope}`))
    .catch(err => console.error(`ServiceWorker registration failed: ${err}`));
  
  navigator
    .serviceWorker
    .ready
    .then(registration => {
      registration
        .sync
        .register('gw-background')
        .catch(err => console.log(`error ${err}`));
    });
}

function getLocation() {
  return new Promise((resolve, reject) => {
     navigator.geolocation
      .getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true }
      );
  });
}

function updateRoom() {
  return getLocation().then(
    position => {
      const data = {
        name: 'proximity_chatter',
        lat: position.coords.latitude,
        long: position.coords.longitude,
      };

      return fetch('/locate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(res => res.json());
    },
    error => console.log('Error while getting current position: ', error)
  );
}

function clearServiceWorkers() {
  navigator.serviceWorker
    .getRegistrations()
    .then(registrations => {
      registrations.forEach(registration => {
        console.log(`clearing: ${registration}`);
        registration.unregister();
      });
    });
}
  
function sendMsg() {
  // TODO impl
  fetch('/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
}

class Container extends React.Component {
  updateChat(room) {
    console.log('CURRENT ROOM STATE', room);
    // TODO impl: this.setState, etc.
  }

  componentWillMount() {
    registerBackgroundSync();
  }
  
  componentDidMount() {
    setInterval(
      () => updateRoom().then(this.updateChat), 
      5000
    );
  }
  
  render() {
    return (
      <div>
        <p>Proximity</p>
        <button onClick={ clearServiceWorkers }>Clear Service Workers</button>
        <br/>
        <button onClick={ sendMsg }>Send msg</button>
      </div>
    );
  }
}

ReactDOM.render(
  <Container />,
  document.getElementById('app')
);