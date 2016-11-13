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
    const list = this.props.messages.map(message => <li key={ message.name + message.msg }>{ message.name + ':' + message.msg }</li>);
    return <ul className="right">{ list }</ul>;
  }
}

// Send
class SendMessage extends React.Component {
  constructor(props) {
    super(props);
    this.defaultProp = { name: 'missing_name', lat: 0, long: 0};
    this.state = { msg: '', disabled: false};
  }

  sendMsg() {
    this.setState({ disabled: true });

    fetch('/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg: this.state.msg, ...this.props})
    }).then(() => {
      this.setState({ msg: '', disabled: false });
      ReactDOM.findDOMNode(this.refs.sendMsg).focus();
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
      myName: Math.random().toString(36).slice(16), // TODO: ALEX: Persist the name in cache, cookie?
      lat: 0,
      long: 0,
      participantNames: ['proximity_bot'], // TODO: ALEX: move to backend default bot + messages
      messages: [
        { name: 'proximity_bot', msg: 'welcome to proximity!'},
        { name: 'proximity_bot', msg: 'i love coffee, who else does?'},
      ]
    };
  }

  registerBackgroundSync() {
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

  componentWillMount() {
    this.registerBackgroundSync();
  }
  
  componentDidMount() {
    setInterval(
      () => this.updateRoom().then(this.updateChat.bind(this)),
      5000
    );
  }

  render() {
    return (
      <div>
        <h1>Proximity</h1>
        <div className="container">
          <Participants names={ this.state.participantNames } />
          <Messages messages={ this.state.messages } />
        </div>
        <SendMessage name={ this.state.myName } lat={ this.state.lat } long={ this.state.long }/>
      </div>
    );
  }
}

ReactDOM.render(
  <Container />,
  document.getElementById('app')
);