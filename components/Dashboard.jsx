var React = require('react/addons');
var ResponsiveGridLayout = require('react-grid-layout').Responsive;
var SockJS = require('sockjs-client');

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
      metrics: {}
    };
  },
  componentDidMount: function() {
    self = this;
    self.socket = new SockJS('/events');

    self.socket.onopen = function() {
      console.log('Subscribing to metrics')

      var message = {
        type: 'subscribe',
        payload: {
          queries: self.state.queries
        }
      };
      var message = JSON.stringify(message);
      console.log('Listen message: ' + message);
      self.socket.send(message);
    };

    self.socket.onmessage = function(e) {
      console.log('Received message', e.data);
      var message = JSON.parse(e.data);

      if (message.type === 'notify') {
        self.setState(function(previousState, currentProps) {
          var previousMetrics = previousState.metrics;
          var nextMetrics = {};
          Object.keys(previousMetrics).forEach(function (key) {
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
    };

    self.socket.onclose = function() {
      // TODO: Something
      // TODO: Reopen socket if it closes.  May need retry logic
      console.log('close');
    };
  },
  componentWillUnmount: function() {

  },
  render: function() {
    var newChildren = [];

    React.Children.forEach(this.props.children, function(child) {
      var metrics = this.state.metrics[child.key];
      console.log('Setting child metrics to', metrics)
      var newChild = React.addons.cloneWithProps(child, {metrics: metrics});
      var div = <div key={child.key} _grid={child.props._grid}>{newChild}</div>;
      newChildren.push(div);
    }, this);

    return (
      <ResponsiveGridLayout
        breakpoints={this.props.breakpoints}
        cols={this.props.cols}
        rowHeight={this.props.rowHeight}>
        {newChildren}
      </ResponsiveGridLayout>
    );
  }
});
