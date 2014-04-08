/** @jsx React.DOM */

var Rnd = require('./rnd');

var Layer = require('./data/layer');
var Point = require('./data/point');

arrayMove = function(array, from, to) {
    array.splice(to, 0, array.splice(from, 1)[0]);
};

var LayerInspector = React.createClass({
    onChange: function (e) {
        var newLayer  =  _.clone(this.props.layer);
        newLayer.color = e.target.value;
        this.props.onChange(newLayer);
    },

    onSeedChange: function (e) {
        var newLayer  =  _.clone(this.props.layer);
        newLayer.seed = e.target.value;
        this.props.onChange(newLayer);
    },

    render: function () {
        return <div>
            <div>Color: <input value={this.props.layer.color} onChange={this.onChange}/></div>
            <div>Seed: <input value={this.props.layer.seed} onChange={this.onSeedChange}/></div>
        </div>;
    }
});

var changed= function (target, changes) {
    return _.extend(_.clone(target), changes);
};

var LayerList = React.createClass({

    onClick: function (index) {
        this.props.onChange(changed(this.props.layerData, {
            selected: index
        }));
    },

    addLayer: function () {
        var rndPoint = function () {
            return new Point(Math.random(), Math.random());
        };

        var newLayers = this.props.layerData.layers.slice();

        // todo: reuse sort (move to Layer?)
        var layer = new Layer(Rnd.color(), [rndPoint(), rndPoint()]);
        layer.points.sort(function (a, b) {
            return a.x - b.x;
        });
        newLayers.push(layer);

        this.props.onChange(changed(this.props.layerData, {
            layers: newLayers,
            selected: newLayers.length-1
        }));
    },
    removeLayer: function () {
        var newLayers = this.props.layerData.layers.slice();
        newLayers.splice(this.props.layerData.selected,1);
        this.props.onChange(changed(this.props.layerData, {
            layers: newLayers
        }));
    },


    onLayerChange: function (layerIndex, newLayer) {

        var newLayers = this.props.layerData.layers.slice();
        newLayers[layerIndex] = newLayer;
        this.props.onChange(changed(this.props.layerData, {
            layers: newLayers
        }));
    },

    moveUp: function () {
        this.move(1);
    },

    moveDown: function () {
        this.move(-1);
    },

    move: function (delta) {
        var layerData = this.props.layerData;
        var selected = layerData.selected;
        var newLayers = layerData.layers.slice();
        arrayMove(newLayers, selected, selected+delta);
        this.props.onChange(changed(layerData, {
            layers: newLayers,
            selected: selected+delta
        }));
    },

    render: function () {
        var layerData = this.props.layerData;
        var selectedLayer;

        var layers = layerData.layers.map(function (layer, i) {

            var style = {
                'background-color': layer.color,
                'height': '30px'

            };

            if(i == layerData.selected){
                selectedLayer = layer;
                style.border = "2px dashed white"
            }

            return <div style={style} onClick={this.onClick.bind(this, i)}></div>;
        }.bind(this));
        layers.reverse();
        var inspector;
        var actions = [];
        if(selectedLayer) {
            inspector = <LayerInspector layer={selectedLayer} onChange={this.onLayerChange.bind(this, this.props.layerData.selected)}/>;

            actions.push(['Up',this.moveUp, layerData.selected < layerData.layers.length-1]);
            actions.push(['Down',this.moveDown, layerData.selected > 0]);
        }

        actions = actions.map(function (action) {
            if(action[2])
                return <div onClick={action[1]}>{action[0]}</div>
            else
                return <div>-{action[0]}-</div>
        });

        return <div>
            <h1>Layers</h1>
            {layers}

            {inspector}
            <hr/>
            {actions}
            <div onClick={this.addLayer}>Add Layer</div>
            <div onClick={this.removeLayer}>Remove Layer</div>
        </div>
    }
});


module.exports = LayerList;