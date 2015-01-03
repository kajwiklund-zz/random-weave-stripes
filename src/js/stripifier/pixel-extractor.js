/** @jsx React.DOM */

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}



var Renderer = React.createClass({
    ctx: null,
    componentDidMount: function () {
        this.renderAndExtract(this.props);
    },

    componentDidUpdate: function () {
        this.renderAndExtract(this.props);
    },

    lastURL: null,
    lastWidth: 0,
    lastHeight: 0,
    renderAndExtract: function (props) {
        if(this.lastURL != props.imageURL || this.lastWidth != props.width || this.lastHeight != props.height){
            this.lastURL = props.imageURL;
            this.lastWidth = props.width;
            this.lastHeight = props.height;
            var canvas = this.getDOMNode();
            var ctx = canvas.getContext('2d');

            ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );

            if(!this.props.imageURL)
                return;

            var imageObj = new Image();

            imageObj.onload = function() {
                ctx.drawImage(imageObj, 0, 0, props.width, props.height);
                this.extract(props.height-1);
            }.bind(this);

            imageObj.src = this.props.imageURL;
        }
    },

    extract: function (y) {
        var canvas = this.getDOMNode();
        var ctx = canvas.getContext('2d');

        var props = this.props;
        var data = ctx.getImageData(0, y, props.width, 1).data;
        var result = [];
        for(var x = 0; x < props.width; x++ ){
            var xo = x*4;
            var hex = rgbToHex(data[xo],data[xo+1],data[xo+2]);
            result.push(hex);
        }
        props.resultChanged(result);

    },

    mouseDown: false,
    onMouseDown: function () {
        this.mouseDown = true;
        console.log('down',this.mouseDown);
    },
    onMouseUp: function () {
        this.mouseDown = false;
        console.log('up',this.mouseDown);
    },

    onMouse: function (e) {
        console.log('mouse',this.mouseDown);
        if(!this.mouseDown)
            return;
        var canvas = this.getDOMNode();

        var top = canvas.offsetTop;

        top = e.pageY - top;
        this.extract(top);
    },



    render: function () {
        return  <canvas width={this.props.width} height={this.props.height} onMouseMove={this.onMouse}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        ></canvas>
    }
});

module.exports = Renderer;