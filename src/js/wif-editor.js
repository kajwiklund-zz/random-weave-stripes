/** @jsx React.DOM */

var storage = require('./storage');


module.exports = React.createClass({
    getInitialState: function () {
        return {wifData:{}};
    },
    componentDidMount: function () {
        this.setState({wifData: storage.loadWif(this.props.id)});
    },
    onNameChange: function (e) {
        var copy = _.clone(this.state.wifData);
        copy.name = e.target.value;
        storage.saveWifDesc(copy);
        this.setState({wifData: copy});
    },
    render: function () {
        return <div className="container-fluid"><h1>{this.state.wifData.name}</h1>
            <input value={this.state.wifData.name} className="form-control input-sm" onChange={this.onNameChange} /><br/> <pre>{this.state.wifData.data}</pre></div>;
    }
});
