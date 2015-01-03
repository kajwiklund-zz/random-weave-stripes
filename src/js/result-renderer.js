/** @jsx React.DOM */



var stripes = require('./stripes');


var Renderer = React.createClass({
    ctx: null,
    componentDidMount: function () {
        this.renderPoints(this.props);
    },

//    shouldComponentUpdate: function (props) {
//        this.renderPoints(props);
//        return false;
//    },

    componentDidUpdate: function (props) {
        this.renderPoints(this.props);
    },

    renderPoints: function (props) {
        var result = props.result;

        var canvas = this.getDOMNode();
        var ctx = canvas.getContext('2d');
        if(this.props.hack) {
            window[this.props.hack] = canvas;
        }

        var size= this.props.size;
        ctx.fillStyle = 'pink';
        ctx.fillRect(0, 0, result.length, props.height);

        for (var i = 0; i < result.length; i++) {
            ctx.fillStyle = result[i];
            ctx.fillRect(i, 0, 1, props.height);
        }
    },

    render: function () {
        return  <canvas width={this.props.result.length} height={this.props.height}></canvas>
    }
});

module.exports = Renderer;