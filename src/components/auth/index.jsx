const React = require('react');

const session = require('../wowser/session');

class AuthScreen extends React.Component {

  static id = 'auth';
  static title = 'Authentication';

  constructor() {
    super();

    this.state = {
      host: window.location.hostname,
      port: session.auth.constructor.PORT,
      username: '',
      password: ''
    };

    this._onAuthenticate = this._onAuthenticate.bind(this);
    this._onChange = this._onChange.bind(this);
    this._onSubmit = this._onSubmit.bind(this);
    this._onConnect = this._onConnect.bind(this);

    session.auth.on('connect', this._onConnect);
    session.auth.on('reject', session.auth.disconnect);
    session.auth.on('authenticate', this._onAuthenticate);
  }

  componentWillUnmount() {
    session.auth.removeListener('connect', this._onConnect);
    session.auth.removeListener('reject', session.auth.disconnect);
    session.auth.removeListener('authenticate', this._onAuthenticate);
  }

  connect(host, port) {
    session.auth.connect(host, port);
  }

  authenticate(username, password) {
    session.auth.authenticate(username, password);
  }

  _onAuthenticate() {
    session.screen = 'realms';
  }

  _onChange(event) {
    const target = event.target;
    const state = {};
    state[target.name] = target.value;
    this.setState(state);
  }

  _onConnect() {
    this.authenticate(this.state.username, this.state.password);
  }

  _onSubmit(event) {
    event.preventDefault();
    this.connect(this.state.host, this.state.port);
  }

  render() {
    return (
      <auth className="auth screen">
        <div className="panel">
          <h1>Authentication</h1>

          <div className="divider"></div>

          <p>
            <strong>Note:</strong> Wowser requires a WebSocket proxy, see the README on GitHub.
          </p>

          <form onSubmit={ this._onSubmit }>
            <fieldset>
              <label>Host</label>
              <input type="text" onChange={ this._onChange }
                     name="host" value={ this.state.host } />

              <label>Port</label>
              <input type="text" onChange={ this._onChange }
                     name="port" value={ this.state.port } />
            </fieldset>

            <fieldset>
              <label>Username</label>
              <input type="text" onChange={ this._onChange }
                     name="username" value={ this.state.username } autoFocus />

              <label>Password</label>
              <input type="password" onChange={ this._onChange }
                     name="password" value={ this.state.password } />
            </fieldset>

            <div className="divider"></div>

            <input type="submit" defaultValue="Connect" />
          </form>
        </div>
      </auth>
    );
  }

}

module.exports = AuthScreen;