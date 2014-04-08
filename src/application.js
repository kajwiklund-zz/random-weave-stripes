/** @jsx React.DOM */

var Rnd = require('./rnd');

var Layer = require('./data/layer');
var Point = require('./data/point');

var Renderer = require('./renderer');
var LayerLinesEditor = require('./layer-lines-editor');
var LayerList = require('./layer-list');

var storage = require('./storage');

var stripes = require('./stripes');


var changed= function (target, changes) {
    return _.extend(_.clone(target), changes);
};


var KindInput = React.createClass({
    getInitialState: function () {
        return {
            value: this.props.value
        };
    },

    onChange: function (e) {
        var v=e.target.value;
        this.setState({value: v});
        this.props.onChange(v);
    },

    onBlur: function () {
        this.setState({value: this.props.value});
    },

    render: function () {
        var style = {};

        if(this.props.value != this.state.value){
            style.color = 'orange';
        }

        return <input value={this.state.value} onChange={this.onChange} style={style} onBlur={this.onBlur}/>
    }
});


var Application = React.createClass({
    mixins: [React.addons.LinkedStateMixin],

    getInitialState: function () {
        return storage.load(this.props.id);
    },

    onChange: function (newLayerData) {
        this.setState({layerData: newLayerData});
    },


    changeSize : function (newSize) {
        var fixedSize = changed(this.state.size, newSize);
        this.setState({size: fixedSize});
    },

    componentDidUpdate: function () {
        storage.save(this.props.id, this.state);
    },

    onWidthChange: function (val) {
        try {
            var fixed = Math.max(10, parseInt(val) || 100);
            this.changeSize({x: fixed});
        } catch (e) {
        }
    },

    onHeightChange: function (val) {
        try {
            var fixed = Math.max(10, parseInt(val) || 100);
            this.changeSize({y: fixed});
        } catch (e) {
        }
    },

    onEditorSizeChange: function (val) {
        var fixed = Math.max(10, parseInt(val) || 100);
        this.setState({editorSize: fixed});
    },

    saveResult: function () {
        function hexToRgb(hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });

            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        var pom = document.createElement('a');

        var result = stripes(this.state.layerData.layers, this.state.size.x);

        var nl = "\r\n";
        var colorsArray = [];
        var data = "[COLORS]"+nl;
        for (var i = 0; i < result.length; i++) {
            var color = result[i];
            var nr = colorsArray.indexOf(color);
            if(nr < 0){
                colorsArray.push(color);
                nr = colorsArray.length - 1;
            }
            data += (i + 1) + "=" + (nr + 1)+ nl;
        }

        var data2 = "[COLOR TABLE]"+nl;



        for (var j = 0; j < colorsArray.length; j++) {
            var c = colorsArray[j];
            var rgb = hexToRgb(c);
            data2 += (j + 1) + "=" + rgb.r +","+ rgb.g +","+ rgb.b  + nl;
        }


        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data2+data));
        pom.setAttribute('download', "result.txt");
        pom.click();
    },

    render: function () {
        var editorSize = {x: this.state.size.x, y: this.state.editorSize || 100};
        return <div>
            <a href="#">[- all projects</a><br/>
            <div className="editors">
                <h1>{this.state.name}</h1>
                <div>
                    <Renderer layers={this.state.layerData.layers} size={this.state.size}></Renderer>
                </div>
                <LayerLinesEditor canSelect={this.state.selectInLayerEditor} layerData={this.state.layerData} onChange={this.onChange} size={editorSize} />
                <br/>
                Allow Select: <input type="checkbox" checkedLink={this.linkState('selectInLayerEditor')}/><br/><br/><br/>
                Project Name <br/><input valueLink={this.linkState('name')}/><br/>
                Size<br/>
                <KindInput value={this.state.size.x} onChange={this.onWidthChange} />
                x
                <KindInput value={this.state.size.y} onChange={this.onHeightChange} />
                E
                <KindInput value={this.state.editorSize} onChange={this.onEditorSizeChange} />
                <br/>
                <span>
                    {this.state.size.x}x{this.state.size.y}
                </span>

            </div>
            <div className="pickers">
                <LayerList layerData={this.state.layerData} size={this.state.size} onChange={this.onChange}/>
                <hr/>
                <a onClick={this.saveResult}>Save result</a>
<br/><br/>
                <div>
                    Hold Shift to add points<br/>
                    Hold Ctrl to remove points
                </div>
            </div>
        </div>
    }
});


module.exports = Application;
