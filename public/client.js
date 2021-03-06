// Participants
class Participants extends React.Component {
  constructor(props) {
    super(props);
    this.defaultProps = { names: [] };
  }

  render() {
    const list = this.props.names.map(name => {
      const display = name === this.props.myName ? <strong>{ name }</strong> : name;
      return <li key={ name }>{ display }</li>;
    });
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
    const list = this.props.messages.map((message, index) =>
      <li key={ index }>
        <strong>{ message.author + ": " }</strong>
        { message.text }
      </li>);
    return <ul className="right">{ list }</ul>;
  }
}

// Send
class SendMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { msg: '', disabled: false };
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
    if (evt.key === 'Enter') {
      this.sendMsg();
    }
  }

  render() {
    return <div className="sendContainer">
      <input className="sendText"
             type="text"
             autoFocus
             value={ this.state.msg }
             disabled={ this.state.disabled }
             ref="sendMsg"
             placeholder="type your message here..."
             onChange={ this.onChange.bind(this) }
             onKeyPress={ this.handleOnKeyPress.bind(this) }>
      </input>
      <button className="sendButton" onClick={ this.sendMsg.bind(this) }>Send</button>
    </div>;
  }
}

// Main component
class Container extends React.Component {
  constructor(props) {
    super(props);
  }

  registerSW() {
    if (!'serviceWorker' in navigator) {
      throw new Error('does your browser support service workers?');
    }

    // Exercice - 2 - Service worker registration - START 

    // Implement the service worker registration
     
    // Exercice - 2 - Service worker registration - STOP
  
    navigator
      .serviceWorker
      .addEventListener('message', event => {
        const msgs = this.state.messages.slice(-20);
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
      outputArray[ i ] = rawData.charCodeAt(i);
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
      .catch(err => console.log('Push notifications error', err));
  }

  getLocation() {
    return new Promise((resolve, reject) => {
      // Exercice - 1 - Geolocation - START
      // Replace this code with your implementation
      resolve({
        coords: {
          latitude: 0,
          longitude: 0
        }
      });
      // Exercice - 1 - Geolocation - STOP
    });
  }

  updateRoom() {
    return this.getLocation().then(position => {
      this.setState({ lat: position.coords.latitude, long: position.coords.longitude });
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
    newNames.push('proximity')
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

  componentWillMount() {
    const getCookieValue = name => {
      const found = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
      return found ? found.pop() : '';
    }

    let name = getCookieValue('proximity_name');
    if (!name) {
      name = Math.random().toString(36).slice(16);
      document.cookie = `proximity_name=${name}`;
    }

    const registrationPromise = this.registerSW();

    this.state = {
      registrationPromise,
      myName: name,
      lat: 0,
      long: 0,
      participantNames: [ 'proximity' ],
      messages: [
        { author: 'proximity', text: 'welcome to proximity!' },
        { author: 'proximity', text: 'i love coffee, who else does?' },
      ]
    };

  }

  componentDidMount() {
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
        <h1>proximity</h1>
        <div className="container">
          <Participants names={ this.state.participantNames } myName={ this.state.myName }/>
          <Messages messages={ this.state.messages }/>
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
