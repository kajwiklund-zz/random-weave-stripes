/** @jsx React.DOM */

var MathUtils = require('./math-utils');
var Point = require('./data/point');


var IconButton = require('./bootstrap/icon-button');

// todo: reuse?
var changed= function (target, changes) {
    return _.extend(_.clone(target), changes);
};

var MovableCircle = React.createClass({
    onMouseDown: function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            o: {
                ox: this.props.cx,
                oy: this.props.cy,
                x: e.clientX,
                y: e.clientY
            }});
        this.props.onMouseDown(e);

        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);

    },
    onMouseUp: function (e) {
        this.setState({o: null})
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);
    },

    componentWillUnmount: function () {
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);
    },


    onMouseMove: function (e) {
        var o = this.state.o;

        if (o) {
            var newO = Object.create(o);
            newO.x = e.clientX;
            newO.y = e.clientY;
            this.props.onMove((o.ox + e.clientX - this.state.o.x ), (o.oy +e.clientY - this.state.o.y ));
            this.setState(newO);
        }
    },

    render: function () {
        return this.transferPropsTo(<circle onMouseDown={this.onMouseDown}/>);
    }
});



var SingleLineEditor = React.createClass({
    onMoveCircleMove: function (index, x, y) {
        var newPoints = this.props.points.slice();
        var leftPoint = newPoints[index - 1] || {x: 0};
        var rightPoint = newPoints[index + 1] || {x: this.props.size.x};

        newPoints[index] = newPoint = _.clone(newPoints[index]);

        newPoint.x = MathUtils.constrain(x, leftPoint.x, rightPoint.x);
        newPoint.y = MathUtils.constrain(y,  0, this.props.size.y);

        this.props.onChange(newPoints);
    },

    onTouch: function (circleI, e) {
        this.props.onPointTouch(circleI, e);
    },

    render: function () {

        var lineStyle = {
            stroke: this.props.color,
            'stroke-width': 2
        };
        var circleStyle = {
            fill: this.props.markColor,
            cursor: 'move'
        };

        var lines = [];
        var circles = [];

        var circle = function (p, i) {
            return <MovableCircle key={p.id} cx={p.x} cy={p.y} r={this.props.markSize} onMouseDown={this.onTouch.bind(this, i)} onMove={this.onMoveCircleMove.bind(this, i)} style={circleStyle}/>
        }.bind(this);

        for (var i = 1; i < this.props.points.length; i++) {

            var p1 = this.props.points[i - 1];
            var p2 = this.props.points[i];
            if (i == 1) {
                circles.push(circle(p1, i - 1));
            }
            lines.push(<line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} style={lineStyle}/>);
            circles.push(circle(p2, i));
        }

        return <g>
        {lines}
        {circles}
        </g>
    }
});

function scalePoint(point, by){
    return _.extend(_.clone(point), {x: point.x* by.x,y: point.y* by.y });
}

function scalePoints(points, by){
    return points.map(function (p) {
        return scalePoint(p, by);
    });
}


var LayerLinesEditor = React.createClass({
    onLineChange: function (index, points) {
        var s = this.props.size;
        var is =  {x: 1/s.x, y:1/ s.y};
        points = scalePoints(points, is);
        this.onRawLineChange(index, points);
    },

    onRawLineChange: function (index, points) {
        var newLayers = this.props.layerData.layers.slice();
        var newLayer = newLayers[index] = _.clone(newLayers[index]);
        newLayer.points = points;
        this.props.onChange(changed(this.props.layerData, {layers: newLayers}));
    },

    onPointTouch: function (layerI, pointI, e) {
        if (!e.ctrlKey) {
            this.props.onChange(changed(this.props.layerData, {selected: layerI}));
        }
        else {
            var newPoints = this.props.layerData.layers[layerI].points.slice();
            newPoints.splice(pointI, 1);
            this.onRawLineChange(layerI,newPoints);
        }
    },

    getParent: function (target, type) {
        while(target && target.nodeName != type){
            target = target.parentNode;
        }
        return target;
    },

    addPoint: function (e) {
        if (!e.ctrlKey && e.shiftKey) {
            var selected = this.props.layerData.selected;
            if (selected) {
                var newPoints = this.props.layerData.layers[selected].points.slice();
                var canvas = this.getParent(e.target, 'svg');
                var p = new Point(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop)
                var s = this.props.size;
                var is =  {x: 1/s.x, y:1/ s.y};
                p = scalePoint(p,is);
                newPoints.push(p);
                newPoints.sort(function (a, b) {
                    return a.x - b.x;
                });
                this.onRawLineChange(selected, newPoints);
            }
        }
    },


    render: function () {
        var s = this.props.size;
        var editors = this.props.layerData.layers.map(function (layer, i) {

            var selected = this.props.layerData.selected == i;
            var markColor = selected?'white':'grey';
            var markSize = 10;

            if(!this.props.canSelect && !selected){
                markSize = 0;
            }

            var scaledPoints = scalePoints(layer.points, this.props.size);
            return <SingleLineEditor size={s} color={layer.color} markColor={markColor} markSize={markSize}  points={scaledPoints} onChange={this.onLineChange.bind(this, i)} onPointTouch={this.onPointTouch.bind(this, i)}/>;
        }.bind(this));


        return <svg width={s.x} height={s.y} className="lineEditor" onMouseDown={this.addPoint}>{editors}</svg>;
    }
});


module.exports = LayerLinesEditor;