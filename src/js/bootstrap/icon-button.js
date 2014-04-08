/** @jsx React.DOM */

var Icon = require('./icon');

module.exports = React.createClass({
    render: function () {

        return this.transferPropsTo(<button type="button" className={"btn btn-default"}><Icon icon={this.props.icon}/>{ this.props.title?" " + this.props.title:''}</button>);
    }
});

