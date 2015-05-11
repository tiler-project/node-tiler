'use strict';

var React = require('react/addons');
var ResponsiveGridLayout = require('react-grid-layout').Responsive;
var SockJS = require('sockjs-client');
var Backo = require('backo');

var TWO_SECONDS_IN_MILLISECONDS = 2 * 1000;
var TWO_MINUTES_IN_MILLISECONDS = 2 * 60 * 1000;

module.exports = React.createClass({
  getInitialState: function() {
    var queries = {};

    React.Children.forEach(this.props.children, function(child) {
      var query = child.props.query;

      if (query) {
        var key = child.key;
        queries[key] = query;
      }
    }, this);

    return {
      queries: queries,
      metrics: {},
      lostConnection: false
    };
  },
  componentDidMount: function() {
    var self = this;
    self.reconnectBackoffState = new Backo({
      min: TWO_SECONDS_IN_MILLISECONDS,
      max: TWO_MINUTES_IN_MILLISECONDS,
      jitter: 0.5
    });
    self._connect();
  },
  componentWillUnmount: function() {
    var self = this;
    self._disconnect();
  },
  _connect: function() {
    console.log('Socket connecting');
    var self = this;
    self._setConnectTimeout();
    self.socket = new SockJS('/events');

    self.socket.onopen = function() {
      self._clearConnectTimeout();
      console.log('Socket open');
      self.setState({
        lostConnection: false
      });
      self._subscribe();
    };

    self.socket.onmessage = function(e) {
      self._onMessage(e.data);
    };

    self.socket.onclose = function() {
      console.log('Socket closed');
      self.setState({
        lostConnection: true
      });
      self._reconnect();
    };
  },
  _setConnectTimeout: function() {
    var self = this;
    self.connectTimeoutId = setTimeout(function() {
      self._reconnect();
    }, TWO_MINUTES_IN_MILLISECONDS);
  },
  _clearConnectTimeout: function() {
    var self = this;
    if (self.connectTimeoutId) {
      clearTimeout(self.connectTimeoutId);
      self.connectTimeoutId = null;
    }
  },
  _disconnect: function() {
    var self = this;
    self._clearConnectTimeout();

    if (self.socket) {
      self.socket.close();
      self.socket = null;
    }
  },
  _reconnect: function() {
    var self = this;
    self.socket = null;
    setTimeout(
      function() {
        console.log('Attempting to reconnect');
        self._connect();
      },
      self.reconnectBackoffState.duration());
  },
  _subscribe: function() {
    var self = this;
    console.log('Subscribing to metrics');

    var message = {
      type: 'subscribe',
      payload: {
        queries: self.state.queries
      }
    };
    var message = JSON.stringify(message);
    self.socket.send(message);
  },
  _onMessage: function(message) {
    var self = this;
    message = JSON.parse(message);

    if (message.type === 'notify') {
      self.setState(function(previousState, currentProps) {
        var previousMetrics = previousState.metrics;
        var nextMetrics = {};
        Object.keys(previousMetrics).forEach(function(key) {
          nextMetrics[key] = previousMetrics[key];
        });
        nextMetrics[message.payload.key] = message.payload.metrics;
        var nextState = {
          metrics: nextMetrics
        };
        console.log('Set state', nextState);
        return nextState;
      });
    }
  },
  render: function() {
    var self = this;
    var styles = {
      lostConnectionMessage: {
        color: '#fff',
        backgroundColor: '#1f78b4',
        fontSize: '2em',
        padding: '0.5em',
        textAlign: 'center'
      }
    };

    var lostConnectionMessage = [];

    if (self.state.lostConnection) {
      lostConnectionMessage.push(
        <div style={styles.lostConnectionMessage}>Connection lost. Trying to reconnect</div>
      );
    }

    var newChildren = [];

    React.Children.forEach(this.props.children, function(child) {
      var metrics = this.state.metrics[child.key];
      console.log('Setting child metrics to', metrics);
      var newChild = React.addons.cloneWithProps(child, {metrics: metrics});
      var div = <div key={child.key} _grid={child.props._grid}>{newChild}</div>;
      newChildren.push(div);
    }, this);

    return (
      <div>
        {lostConnectionMessage}
        <ResponsiveGridLayout
          breakpoints={this.props.breakpoints}
          cols={this.props.cols}
          rowHeight={this.props.rowHeight}>
          {newChildren}
        </ResponsiveGridLayout>
      </div>
    );
  }
});
