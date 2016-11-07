class Container extends React.Component {
  render() {
    return (
      <div>
        <p>THIS IS MY APP</p>
      </div>
    );
  }
}

ReactDOM.render(
  <Container />,
  document.getElementById('app')
);