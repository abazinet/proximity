// Participants
class Participants extends React.Component {
  constructor(props) {
    super(props);
    this.defaultProps = { names: [] };
  }

  render() {
    const list = this.props.names.map(name => <li key={ name }>{ name }</li>);
    return <ul className="left">{ list }</ul>;
  }
}

// Messages
class Messages extends React.Component {
  constructor(props) {
    super(props);
    this.defaultProps = { messages: [] };
  }

  render() {
    const list = this.props.messages.map((message, index) => <li key={ index }>{ message.author + ':' + message.text }</li>);
    return <ul className="right">{ list }</ul>;
  }
}

// Send
class SendMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { msg: '', disabled: false};
  }

  sendMsg() { 
    this.setState({ disabled: true });
    this.props.onSend(this.state.msg)
      .then(() => {
        this.setState({ msg: '', disabled: false });
        ReactDOM.findDOMNode(this.refs.sendMsg).focus();
      }).catch(err => {
        console.log(err);
        this.setState({ disabled: false });
      });
  }

  onChange(evt) {
    this.setState({ msg: evt.target.value })
  }
  
  handleOnKeyPress(evt) {
    if(evt.key === 'Enter') {
      this.sendMsg();
    }
  }

  render() {
    return <div>
      <input type="text"
             autoFocus
             value={ this.state.msg }
             disabled={ this.state.disabled }
             ref="sendMsg"
             placeholder="type your message here..."
             onChange={ this.onChange.bind(this) }
             onKeyPress={ this.handleOnKeyPress.bind(this) }>
      </input>
      <button onClick={ this.sendMsg.bind(this) }>Send</button>
    </div>;
  }
}

// Main component
class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      myName: Math.random().toString(36).slice(16),
      lat: 0,
      long: 0,
      participantNames: ['proximity_bot'],
      messages: [
        { author: 'proximity_bot', text: 'welcome to proximity!'},
        { author: 'proximity_bot', text: 'i love coffee, who else does?'},
      ]
    };
  }

  registerSW() {
    if (!'serviceWorker' in navigator) {
      throw new Error('does your browser support service workers?');
    }
    
    navigator
      .serviceWorker
      .register('service-worker.js')
      .then(registration => console.log(`Push ServiceWorker registered: ${registration.scope}`))
      .catch(err => console.error(`ServiceWorker registration failed: ${err}`))
      
    navigator
      .serviceWorker
      .addEventListener('message', event => {
        const msgs = this.state.messages.slice();
        msgs.push(event.data);
        this.setState({ messages: msgs });
    });

    return navigator.serviceWorker.ready;
  }
  
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  
  subscribeSwForNotifications(swRegistration) {
    console.log('subscribeSwForNotifications');
    
    return fetch('/vapid')
      .then(response => response.json())
      .then(({ publicKey }) => this.urlBase64ToUint8Array(publicKey))
      .then(applicationServerKey => {
        console.log('subscribePushManager');
    
        return swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        })
      })
      .catch(err => console.error('Error occured when trying to subscribe SW for push notifications', err));
  }
  
  ensureSubscribedForNotifications(swRegistration) {
    console.log('ensureSubscribedForNotifications');
    return swRegistration.pushManager.getSubscription()
      .then(subscription => subscription ? Promise.resolve(subscription) : this.subscribeSwForNotifications(swRegistration));
  }
  
  updateSubscriptionOnServer(swSubscription) {
    console.log('updateSubscriptionOnServer');

    const data = {
      name: this.state.myName,
      subscription: swSubscription
    };
    
    return fetch('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(() => swSubscription);
  }
  
  subscribeForPushNotifications() {
   const { registrationPromise } = this.state;
   return registrationPromise
      .then(swRegistration => this.ensureSubscribedForNotifications(swRegistration))
      .then(swSubscription => this.updateSubscriptionOnServer(swSubscription))
      .then(swSubscription => console.log('User successfuly subscribed for push notifications', swSubscription))
      .catch(err => console.error('Push notifications error', err));
  }
  
  getLocation() {
    return new Promise((resolve, reject) => {
       navigator.geolocation
        .getCurrentPosition(
          resolve,
          reject,
          { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true }
        );
    });
  }
  
  updateRoom() {
    return this.getLocation().then(position => {
        this.setState({lat: position.coords.latitude, long: position.coords.longitude });
        return position;
      }).then(
        position => {
          const data = {
            name: this.state.myName,
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

  updateChat(room) {
    console.log('room state: ', room);
    if (!room) return;

    const newNames = room.colleagues.map(c => c.name);
    newNames.push('proximity_bot')
    this.setState({
      participantNames: newNames
    });
  }
  
  registerBackgroundSync(tag) {
    console.log('registerBackgroundSync', tag);
    const { registrationPromise } = this.state;
    return registrationPromise.then(
      swRegistration => swRegistration.sync.register(tag),
      err => console.error(`[${tag}] Background sync registration error`, err)
    );
  }
  
  onSend(msg) {
    return localforage.getItem('outbox')
      .then(messageQueue => {
        messageQueue = messageQueue || { messages: [] };
        messageQueue.messages.push({
          name: this.state.myName,
          lat: this.state.lat,
          long: this.state.long,
          msg
        });
        return messageQueue
      })
      .then(messageQueue => localforage.setItem('outbox', messageQueue))
      .then(() => this.registerBackgroundSync('gwMessage'));
  }
  
  componentDidMount() {
    const registrationPromise = this.registerSW();
    this.setState({ registrationPromise });
    
    this.updateRoom()
      .then(this.updateChat.bind(this))
      .then(this.subscribeForPushNotifications.bind(this))
      
    const intervalId = setInterval(
      () => this.updateRoom().then(this.updateChat.bind(this)),
      5000
    );
    this.setState({ intervalId })
  }
  
  componentWillUnmount() {
    clearInterval(this.state.intervalId);
  }

  render() {
    return (
      <div>
        <h1>Proximity</h1>
        <div className="container">
          <Participants names={ this.state.participantNames } />
          <Messages messages={ this.state.messages } />
        </div>
        <SendMessage onSend={ this.onSend.bind(this) }/>
      </div>
    );
  }
}

ReactDOM.render(
  <Container />,
  document.getElementById('app')
);