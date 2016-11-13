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

class Messages extends React.Component {
  constructor(props) {
    super(props);
    this.defaultProps = { messages: [] };
  }

  render() {
    const list = this.props.messages.map(message => <li key={ message.msg }>{ `${message.name}: ${message.msg}` }</li>);
    return <ul className="right">{ list }</ul>;
  }
}

class SendMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { msg: '', disabled: false};
  }

  sendMsg() {
    this.setState({ disabled: true });

    fetch('/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.state)
    }).then(() => {
      this.setState({ msg: '', disabled: false });
      ReactDOM.findDOMNode(this.refs.sendMsg).focus();
    });
  }

  onChange(evt) {
    this.setState({
      msg: evt.target.value
    })
  }
  
  handleOnKeyPress(evt) {
    if(evt.key == 'Enter') {
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

class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      myName: Math.random().toString(36).slice(16),
      participantNames: ['proximity_bot'],
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
    return this.getLocation().then(
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
  
  clearServiceWorkers() {
    navigator.serviceWorker
      .getRegistrations()
      .then(registrations => {
        registrations.forEach(registration => {
          console.log(`clearing: ${registration}`);
          registration.unregister();
        });
      });
  }
    
  updateChat(room) {
    console.log('CURRENT ROOM STATE', room);
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
        <p>Proximity</p>
        <button onClick={ this.clearServiceWorkers }>Clear Service Workers</button>
        <br/>
        <div className="container">
          <Participants names={ this.state.participantNames } />
          <Messages messages={ this.state.messages } />
        </div>
        <SendMessage />
      </div>
    );
  }
}

ReactDOM.render(
  <Container />,
  document.getElementById('app')
);