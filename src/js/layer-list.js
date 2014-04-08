/** @jsx React.DOM */

var Rnd = require('./rnd');

var Layer = require('./data/layer');
var Point = require('./data/point');

var IconButton = require('./bootstrap/icon-button');

arrayMove = function(array, from, to) {
    array.splice(to, 0, array.splice(from, 1)[0]);
};

var LayerInspector = React.createClass({
    onColorChange: function (e) {
        this.onNewColorValue(e.target.value);
    },

    onSeedChange: function (e) {
        this.onNewSeedValue(e.target.value);
    },

    onNewColorValue: function (val) {
        var newLayer  =  _.clone(this.props.layer);
        newLayer.color = val;
        this.props.onChange(newLayer);
    },

    onNewSeedValue: function (val) {
        var newLayer  =  _.clone(this.props.layer);
        newLayer.seed = val;
        this.props.onChange(newLayer);
    },

    onRandomColor: function () {
        this.onNewColorValue(Rnd.color());
    },
    onRandomSeed: function () {
        this.onNewSeedValue(Math.floor(Math.random()*90000 +10000));
    },



    render: function () {
        // todo: reusable form componenet

        return <div>
                    <form role="form">
                        <div className="form-group">
                    <label for="layerColor">Color</label>
                    <div className="input-group">
                        <input id="layerColor" type="text" className="form-control input-sm" value={this.props.layer.color} onChange={this.onColorChange}/>
                            <span className="input-group-btn">
                                <button className="btn btn-default input-sm" type="button" onClick={this.onRandomColor}><span className="glyphicon glyphicon glyphicon-fire"></span></button>
                            </span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label for="layerSeed">Seed</label>
                        <div className="input-group">
                            <input id="layerSeed" type="text" className="form-control input-sm" value={this.props.layer.seed} onChange={this.onSeedChange}/>
                                <span className="input-group-btn">
                                    <button className="btn btn-default input-sm" type="button" onClick={this.onRandomSeed}><span className="glyphicon glyphicon glyphicon-fire"></span></button>
                                </span>
                            </div>
                        </div>
                    </form>
                </div>
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
                style.border = "3px dashed #272B30"
            }

            return <div style={style} onClick={this.onClick.bind(this, i)}></div>;
        }.bind(this));
        layers.reverse();
        var inspector;
        var actions = [];

        actions.push(<IconButton icon="plus" className="btn-group-space" onClick={this.addLayer} />);

        if(selectedLayer) {
            inspector = <LayerInspector layer={selectedLayer} onChange={this.onLayerChange.bind(this, this.props.layerData.selected)}/>;

            actions.push(<div className="btn-group btn-group-space">
                <IconButton icon="arrow-up" onClick={this.moveUp} enabled={layerData.selected < layerData.layers.length-1}/>
                <IconButton icon="arrow-down" onClick={this.moveDown} enabled={layerData.selected > 0}/>
            </div>);
            actions.push(<IconButton icon="trash" className="btn-group-space" onClick={this.removeLayer} />);
        }

        return <div className="row">
            <h4>Layers</h4>
            <div className="h-spaced">
                {layers}
            </div>
            <div className="h-spaced">
                {actions}
            </div>
            {inspector}
        </div>
    }
});


module.exports = LayerList;