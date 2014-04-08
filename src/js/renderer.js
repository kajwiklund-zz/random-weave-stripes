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
        var result = stripes(props.layers, this.props.size.x);

        var ctx = this.getDOMNode().getContext('2d');

        var size= this.props.size;
        ctx.fillStyle = 'grey';
        ctx.fillRect(0, 0, size.x, size.y);


        for (var i = 0; i < result.length; i++) {
            ctx.fillStyle = result[i];
            ctx.fillRect(i, 0, 1, size.y);
        }
    },

    render: function () {
//        return <div>hello</div>
        return  <canvas width={this.props.size.x} height={this.props.size.y}></canvas>
    }
});

module.exports = Renderer;