/** @jsx React.DOM */


var In = React.createClass({
    getInitialState: function () {
        return {
            value: null,
            active: false
        };
    },

    onChange: function (e) {
        var v = e.target.value;
        this.setState({value: v, active: true});
    },

    onBlur: function () {
        this.props.onChange && this.props.onChange(this.state.value);
        this.setState({active: false});
    },
    onFocus: function () {
        this.setState({value: this.props.value, active: true});
    },

    render: function () {
        var style = {};

        var value = this.props.value;
        if(this.state.active){
            value = this.state.value;
            if (this.props.value != this.state.value) {
                style.color = 'orange';
            }
        }


        return this.transferPropsTo(<input value={value} onChange={this.onChange} style={style} onBlur={this.onBlur} onFocus={this.onFocus}/>);
    }
});

module.exports = In;