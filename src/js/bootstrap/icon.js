/** @jsx React.DOM */

var Icon = React.createClass({
    render: function () {
        var icon = "glyphicon glyphicon-" + this.props.icon;
        return <span className={icon}></span>;
    }
});

module.exports = Icon;