(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @jsx React.DOM */

var Rnd = require('./rnd');

var Layer = require('./data/layer');
var Point = require('./data/point');

var Icon = require('./bootstrap/icon');

var Renderer = require('./renderer');
var LayerLinesEditor = require('./layer-lines-editor');
var LayerList = require('./layer-list');
var IconButton = require('./bootstrap/icon-button');

var storage = require('./storage');

var stripes = require('./stripes');



var changed = function (target, changes) {
    return _.extend(_.clone(target), changes);
};


var KindInput = React.createClass({displayName: 'KindInput',
    getInitialState: function () {
        return {
            value: this.props.value
        };
    },

    onChange: function (e) {
        var v = e.target.value;
        this.setState({value: v});
        this.props.onChange(v);
    },

    onBlur: function () {
        this.setState({value: this.props.value});
    },

    render: function () {
        var style = {};

        if (this.props.value != this.state.value) {
            style.color = 'orange';
        }

        return this.transferPropsTo(React.DOM.input( {value:this.state.value, onChange:this.onChange, style:style, onBlur:this.onBlur}));
    }
});

var ProjectDownloads = React.createClass({displayName: 'ProjectDownloads',
    getFileName: function () {
        var name = this.props.appState.name || "noname";
        var filename = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return filename;
    },

    saveImage: function () {
        var pom = document.createElement('a');
        pom.setAttribute('href', window._hack.canvas.toDataURL('image/png'));
        pom.setAttribute('download', this.getFileName() +"_image.png");
        pom.click();

    },
    saveProject: function () {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.props.appState)));
        pom.setAttribute('download', this.getFileName() +"_project.json");
        pom.click();

    },
    saveModifiedWif: function (id) {
        function hexToRgb(hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function (m, r, g, b) {
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
        var loadWif = storage.loadWif(id);

        var result = stripes(this.props.appState.layerData.layers, this.props.appState.size.x, this.props.appState.backgroundColor);

        var nl = "\r\n";
        var colorsArray = [];
        var data = "";
        for (var i = 0; i < result.length; i++) {
            var color = result[i];
            var nr = colorsArray.indexOf(color);
            if (nr < 0) {
                colorsArray.push(color);
                nr = colorsArray.length - 1;
            }
            data += (i + 1) + "=" + (nr + 1) + nl;
        }

        var data2 = "[COLOR TABLE]" + nl;

        for (var j = 0; j < colorsArray.length; j++) {
            var c = colorsArray[j];
            var rgb = hexToRgb(c);
            data2 += (j + 1) + "=" + rgb.r + "," + rgb.g + "," + rgb.b + nl;
        }

        var sectionSplit = loadWif.data.split("[");
        var res;

        sectionSplit.forEach(function (sec) {
            if(sec.indexOf('COLOR PALETTE]') == 0){
                res += '[COLOR PALETTE]' + nl;
                res += 'Entries=' + colorsArray.length + nl;
                res += 'Form=RGB' + nl;
                res += 'Range=0,255' + nl;
            }
            else if(sec.indexOf('COLOR TABLE]')== 0){
                res += data2;
            }
            else if(sec.indexOf('WARP COLORS]')== 0){
                res += '[WARP COLORS]' + nl;
                res+= data;
            }
            else if(sec.indexOf('WARP]')== 0){

                res += ('[' + sec).replace(/Threads=\d*/,'Threads=' + result.length);
            }
            else {
                res += '[' + sec;
            }
        });


        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(res));
        pom.setAttribute('download', this.getFileName()+ "_modified_wif_"+loadWif.name+".wif");
        pom.click();

    },
    changeWif: function (e) {
        this.setState({selectedWif: e.target.value})
    },
    getInitialState: function () {
        return {};
    },
    render: function () {
        var wifs = this.props.appState.wifs || [];
        var first = null;
        var wifOpts = wifs.map(function (wif) {
            first = first || wif.id;
            return React.DOM.option( {value:wif.id}, wif.name)
        });
        var selected = this.state.selectedWif || first;

        return React.DOM.div(null, 
            React.DOM.div( {className:"row"}, 
                    React.DOM.h4(null, "Downloads")
            ),
            React.DOM.div( {className:"row"}, 
                IconButton( {icon:"floppy-save", title:"Project", className:"download-button", onClick:this.saveProject}),
                IconButton( {icon:"picture", title:"Image", className:"download-button", onClick:this.saveImage}),
                React.DOM.h4(null, "Select wif"),
                React.DOM.select( {value:selected, className:"form-control h-spaced", onChange:this.changeWif}, 
                    wifOpts
                ),
                IconButton( {icon:"random", title:"Modify and Download", className:"download-button", onClick:this.saveModifiedWif.bind(this, selected)} )
            )
        );
    }
});


var ProjectSizes = React.createClass({displayName: 'ProjectSizes',
    onWidthChange: function (val) {
        try {
            var fixed = Math.max(10, parseInt(val) || 100);
            this.props.onSizeChanged({x: fixed});
        } catch (e) {
        }
    },

    onHeightChange: function (val) {
        try {
            var fixed = Math.max(10, parseInt(val) || 100);
            this.props.onSizeChanged({y: fixed});
        } catch (e) {
        }
    },

    render: function () {
            var id = "" + Math.random();
        return  React.DOM.div( {className:"row"}, React.DOM.div( {className:"form-group h-spaced"}, 
                    React.DOM.h4(null, "Sizes"),
                    React.DOM.div( {className:"input-group"}, 
                        KindInput( {id:id, type:"text", className:"form-control input-sm",  value:this.props.size.x, onChange:this.onWidthChange} ),
                        React.DOM.span( {className:"input-group-addon"}, "x"),
                        KindInput( {type:"text", className:"form-control input-sm", value:this.props.size.y, onChange:this.onHeightChange} ),
                        React.DOM.span( {className:"input-group-addon"}, "edit"),
                        KindInput( {type:"text", className:"form-control input-sm",  value:this.props.editorSize, onChange:this.props.onEditorSizeChange} )
                    )
                )
        );

    }
});


var InspectorBox = React.createClass({displayName: 'InspectorBox',
    onRandomColor: function () {
        this.onNewColor(Rnd.color());
    },

    onColorChange: function (e) {
        this.onNewColor(e.target.value);
    },

    onNewColor: function (v) {
        this.props.onBackgroundColorChange(v);
    },

    getInitialState: function () {
        return {tab: storage.getOpenTab()};
    },

    changeTab: function (tab) {
        storage.setOpenTab(tab);
        this.setState({tab: tab});
    },

    render: function () {
        var appState = this.props.appState;
        var tab = this.state.tab||'project';
        var tabData;
        if(tab == 'colors'){
            tabData = React.DOM.div(null, 
                React.DOM.div( {className:"row"}, 
                React.DOM.form( {role:"form"}, 
                    React.DOM.div( {className:"form-group"}, 
                        React.DOM.h4( {for:"layerColor"}, "Background color"),
                        React.DOM.div( {className:"input-group"}, 
                            React.DOM.input( {id:"layerColor", type:"text", className:"form-control input-sm", value:this.props.appState.backgroundColor, onChange:this.onColorChange}),
                            React.DOM.span( {className:"input-group-btn"}, 
                                React.DOM.button( {className:"btn btn-default input-sm", type:"button", onClick:this.onRandomColor}, React.DOM.span( {className:"glyphicon glyphicon glyphicon-fire"}))
                            )
                        )
                    )
                )
            ),
            LayerList( {layerData:appState.layerData, size:appState.size, onChange:this.props.onLayerDataChange})
            )

        }
        else{
            tabData = React.DOM.div(null, 
                ProjectSizes( {size:appState.size,
                editorSize:appState.editorSize,
                onSizeChanged:this.props.onSizeChanged,
                onEditorSizeChange:this.props.onEditorSizeChange}),
                ProjectDownloads( {appState:appState})
            );
        }


        return React.DOM.div( {className:"inspectorBox container-fluid"}, 
            React.DOM.div( {className:"row"}, 
            React.DOM.ul( {className:"nav nav-tabs"}, 
                React.DOM.li( {className:tab=='project' && 'active'}, React.DOM.a( {onClick:this.changeTab.bind(this, 'project')}, "Project")),
                React.DOM.li( {className:tab=='colors' && 'active'}, React.DOM.a( {onClick:this.changeTab.bind(this, 'colors')}, "Colors"))

            )
            ),
            tabData
        )
    }
});


var Application = React.createClass({displayName: 'Application',
    mixins: [React.addons.LinkedStateMixin],

    getInitialState: function () {
        return storage.load(this.props.id);
    },

    onLayerDataChange: function (newLayerData) {
        this.setState({layerData: newLayerData});
    },


    changeSize: function (newSize) {
        var fixedSize = changed(this.state.size, newSize);
        this.setState({size: fixedSize});
    },

    componentDidUpdate: function () {
        var copy = _.clone(this.state);
        delete copy.wifs;
        storage.save(this.props.id, this.state);
        if(this.state.editName){
            var nameEditor = this.refs.nameEditor;
            if (nameEditor) {
                var domNode = nameEditor.getDOMNode();
                if (domNode) {
                    domNode.focus()
                }
            }
        }
    },

    onBackgroundColorChange: function (val) {
        this.setState({backgroundColor: val});
    },

    onEditorSizeChange: function (val) {
        var fixed = Math.max(10, parseInt(val) || 100);
        this.setState({editorSize: fixed});
    },

    showNameEditor: function (show) {
        this.setState({editName: show });
    },
    componentDidMount: function () {
        this.setState({wifs: storage.listWifs()});
    },

    render: function () {
        var editorSize = {x: this.state.size.x, y: this.state.editorSize || 100};
        var nameComponent = React.DOM.span( {onClick:this.showNameEditor.bind(this, true)}, this.state.name)
        if(this.state.editName){
            nameComponent = React.DOM.input( {className:"form-control input-sm", valueLink:this.linkState('name'), ref:"nameEditor", onBlur:this.showNameEditor.bind(this, false)} )
        }

        return React.DOM.div( {className:"container-fluid"}, 
            React.DOM.h1( {className:"page-header page-header-main"}, nameComponent),

            InspectorBox( {appState:this.state,
            onLayerDataChange:this.onLayerDataChange,
            onSizeChanged:this.changeSize,
            onEditorSizeChange:this.onEditorSizeChange,
            onBackgroundColorChange:this.onBackgroundColorChange}
            ),

            React.DOM.div( {className:"stripesAreaBox"}, 
                React.DOM.div(null, 
                    Renderer( {layers:this.state.layerData.layers, size:this.state.size, backgroundColor:this.state.backgroundColor})
                ),
                LayerLinesEditor( {canSelect:this.state.selectInLayerEditor, layerData:this.state.layerData, onChange:this.onLayerDataChange, size:editorSize} ),
                React.DOM.br(null),
                React.DOM.input( {type:"checkbox", checkedLink:this.linkState('selectInLayerEditor')}),
                " Allow Select ",
                React.DOM.br(null),React.DOM.br(null),
                React.DOM.div( {className:"well"}, 
                    " Shift+Click to add points ",
                    React.DOM.br(null),
                    " Ctrl+Click to remove points "
                )
            ),
            React.DOM.div( {className:"clear-fix alert alert-warning"}, React.DOM.strong(null, "Warning!"), " This is a work in progress thing. Don't expect anything to work and your data might disapear at any moment!")
        )
    }
});


module.exports = Application;

},{"./bootstrap/icon":3,"./bootstrap/icon-button":2,"./data/layer":4,"./data/point":5,"./layer-lines-editor":7,"./layer-list":8,"./renderer":12,"./rnd":14,"./storage":15,"./stripes":16}],2:[function(require,module,exports){
/** @jsx React.DOM */

var Icon = require('./icon');

module.exports = React.createClass({
    render: function () {

        return this.transferPropsTo(React.DOM.button( {type:"button", className:"btn btn-default"}, Icon( {icon:this.props.icon}), this.props.title?" " + this.props.title:''));
    }
});


},{"./icon":3}],3:[function(require,module,exports){
/** @jsx React.DOM */

var Icon = React.createClass({displayName: 'Icon',
    render: function () {
        var icon = "glyphicon glyphicon-" + this.props.icon;
        return React.DOM.span( {className:icon});
    }
});

module.exports = Icon;
},{}],4:[function(require,module,exports){
module.exports = function (color, points) {
    this.id = Math.floor(Math.random() * 1000000000);
    this.seed = Math.floor(Math.random() * 1000)+10;
    this.color = color;
    this.points = points;
    points.sort(function (a, b) {
        return a.x - b.x;
    });
};
},{}],5:[function(require,module,exports){
module.exports  =  function (x, y) {
    this.id = Math.floor(Math.random() * 1000000000);
    this.x = x;
    this.y = y;
};


},{}],6:[function(require,module,exports){
/** @jsx React.DOM */

var ProjectPicker = require('./project-picker');

React.renderComponent(
    ProjectPicker(null ),
    document.getElementById('application')
);

},{"./project-picker":11}],7:[function(require,module,exports){
/** @jsx React.DOM */

var MathUtils = require('./math-utils');
var Point = require('./data/point');


var IconButton = require('./bootstrap/icon-button');

// todo: reuse?
var changed= function (target, changes) {
    return _.extend(_.clone(target), changes);
};

var MovableCircle = React.createClass({displayName: 'MovableCircle',
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
        return this.transferPropsTo(React.DOM.circle( {onMouseDown:this.onMouseDown}));
    }
});



var SingleLineEditor = React.createClass({displayName: 'SingleLineEditor',
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
            return MovableCircle( {key:p.id, cx:p.x, cy:p.y, r:this.props.markSize, onMouseDown:this.onTouch.bind(this, i), onMove:this.onMoveCircleMove.bind(this, i), style:circleStyle})
        }.bind(this);

        for (var i = 1; i < this.props.points.length; i++) {

            var p1 = this.props.points[i - 1];
            var p2 = this.props.points[i];
            if (i == 1) {
                circles.push(circle(p1, i - 1));
            }
            lines.push(React.DOM.line( {x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y, style:lineStyle}));
            circles.push(circle(p2, i));
        }

        return React.DOM.g(null, 
        lines,
        circles
        )
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


var LayerLinesEditor = React.createClass({displayName: 'LayerLinesEditor',
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
            return SingleLineEditor(  {size:s, color:layer.color, markColor:markColor, markSize:markSize,  points:scaledPoints, onChange:this.onLineChange.bind(this, i), onPointTouch:this.onPointTouch.bind(this, i)});
        }.bind(this));


        return React.DOM.svg( {width:s.x, height:s.y, className:"lineEditor", onMouseDown:this.addPoint}, editors);
    }
});


module.exports = LayerLinesEditor;
},{"./bootstrap/icon-button":2,"./data/point":5,"./math-utils":9}],8:[function(require,module,exports){
/** @jsx React.DOM */

var Rnd = require('./rnd');

var Layer = require('./data/layer');
var Point = require('./data/point');

var IconButton = require('./bootstrap/icon-button');

arrayMove = function(array, from, to) {
    array.splice(to, 0, array.splice(from, 1)[0]);
};

var LayerInspector = React.createClass({displayName: 'LayerInspector',
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

        return React.DOM.div(null, 
                    React.DOM.form( {role:"form"}, 
                        React.DOM.div( {className:"form-group"}, 
                    React.DOM.label( {for:"layerColor"}, "Color"),
                    React.DOM.div( {className:"input-group"}, 
                        React.DOM.input( {id:"layerColor", type:"text", className:"form-control input-sm", value:this.props.layer.color, onChange:this.onColorChange}),
                            React.DOM.span( {className:"input-group-btn"}, 
                                React.DOM.button( {className:"btn btn-default input-sm", type:"button", onClick:this.onRandomColor}, React.DOM.span( {className:"glyphicon glyphicon glyphicon-fire"}))
                            )
                        )
                    ),
                    React.DOM.div( {className:"form-group"}, 
                        React.DOM.label( {for:"layerSeed"}, "Seed"),
                        React.DOM.div( {className:"input-group"}, 
                            React.DOM.input( {id:"layerSeed", type:"text", className:"form-control input-sm", value:this.props.layer.seed, onChange:this.onSeedChange}),
                                React.DOM.span( {className:"input-group-btn"}, 
                                    React.DOM.button( {className:"btn btn-default input-sm", type:"button", onClick:this.onRandomSeed}, React.DOM.span( {className:"glyphicon glyphicon glyphicon-fire"}))
                                )
                            )
                        )
                    )
                )
    }
});

var changed= function (target, changes) {
    return _.extend(_.clone(target), changes);
};

var LayerList = React.createClass({displayName: 'LayerList',

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

            return React.DOM.div( {style:style, onClick:this.onClick.bind(this, i)});
        }.bind(this));
        layers.reverse();
        var inspector;
        var actions = [];

        actions.push(IconButton( {icon:"plus", className:"btn-group-space", onClick:this.addLayer} ));

        if(selectedLayer) {
            inspector = LayerInspector( {layer:selectedLayer, onChange:this.onLayerChange.bind(this, this.props.layerData.selected)});

            actions.push(React.DOM.div( {className:"btn-group btn-group-space"}, 
                IconButton( {icon:"arrow-up", onClick:this.moveUp, enabled:layerData.selected < layerData.layers.length-1}),
                IconButton( {icon:"arrow-down", onClick:this.moveDown, enabled:layerData.selected > 0})
            ));
            actions.push(IconButton( {icon:"trash", className:"btn-group-space", onClick:this.removeLayer} ));
        }

        return React.DOM.div( {className:"row"}, 
            React.DOM.h4(null, "Layers"),
            React.DOM.div( {className:"h-spaced"}, 
                layers
            ),
            React.DOM.div( {className:"h-spaced"}, 
                actions
            ),
            inspector
        )
    }
});


module.exports = LayerList;
},{"./bootstrap/icon-button":2,"./data/layer":4,"./data/point":5,"./rnd":14}],9:[function(require,module,exports){
var MathUtil = MathUtil || {};
MathUtil.constrain = function (v, min, max) {
    return Math.max(min, Math.min(max, v));
};

MathUtil.constrainPoint = function (p, min, max) {
    p.x = MathUtil.constrain(p.x, min.x, max.x);
    p.y = MathUtil.constrain(p.y, min.y, max.y);
    return p;
};

module.exports = MathUtil;
},{}],10:[function(require,module,exports){
var data = {};
data.animals = ['Aardvark',
    'Albatross',
    'Alligator',
    'Alpaca',
    'Ant',
    'Anteater',
    'Antelope',
    'Ape',
    'Armadillo',
    'Ass/Donkey',
    'Baboon',
    'Badger',
    'Barracuda',
    'Bat',
    'Bear',
    'Beaver',
    'Bee',
    'Bison',
    'Boar',
    'Buffalo',
    'Butterfly',
    'Camel',
    'Capybara',
    'Caribou',
    'Cassowary',
    'Cat',
    'Caterpillar',
    'Cattle',
    'Chamois',
    'Cheetah',
    'Chicken',
    'Chimpanzee',
    'Chinchilla',
    'Chough',
    'Clam',
    'Cobra',
    'Cockroach',
    'Cod',
    'Cormorant',
    'Coyote',
    'Crab',
    'Crane',
    'Crocodile',
    'Crow',
    'Curlew',
    'Deer',
    'Dinosaur',
    'Dog',
    'Dogfish',
    'Dolphin',
    'Donkey',
    'Dotterel',
    'Dove',
    'Dragonfly',
    'Duck',
    'Dugong',
    'Dunlin',
    'Eagle',
    'Echidna',
    'Eel',
    'Eland',
    'Elephant',
    'Elephant seal',
    'Elk',
    'Emu',
    'Falcon',
    'Ferret',
    'Finch',
    'Fish',
    'Flamingo',
    'Fly',
    'Fox',
    'Frog',
    'Gaur',
    'Gazelle',
    'Gerbil',
    'Giant Panda',
    'Giraffe',
    'Gnat',
    'Gnu',
    'Goat',
    'Goose',
    'Goldfinch',
    'Goldfish',
    'Gorilla',
    'Goshawk',
    'Grasshopper',
    'Grouse',
    'Guanaco',
    'Guinea fowl',
    'Guinea pig',
    'Gull',
    'Hare',
    'Hawk',
    'Hedgehog',
    'Heron',
    'Herring',
    'Hippopotamus',
    'Hornet',
    'Horse',
    'Human',
    'Hummingbird',
    'Hyena',
    'Ibex',
    'Ibis',
    'Jackal',
    'Jaguar',
    'Jay',
    'Jellyfish',
    'Kangaroo',
    'Kingfisher',
    'Koala',
    'Komodo dragon',
    'Kookabura',
    'Kouprey',
    'Kudu',
    'Lapwing',
    'Lark',
    'Lemur',
    'Leopard',
    'Lion',
    'Llama',
    'Lobster',
    'Locust',
    'Loris',
    'Louse',
    'Lyrebird',
    'Magpie',
    'Mallard',
    'Manatee',
    'Mandrill',
    'Mantis',
    'Marten',
    'Meerkat',
    'Mink',
    'Mole',
    'Mongoose',
    'Monkey',
    'Moose',
    'Mouse',
    'Mosquito',
    'Mule',
    'Narwhal',
    'Newt',
    'Nightingale',
    'Octopus',
    'Okapi',
    'Opossum',
    'Oryx',
    'Ostrich',
    'Otter',
    'Owl',
    'Ox',
    'Oyster',
    'Parrot',
    'Partridge',
    'Peafowl',
    'Pelican',
    'Penguin',
    'Pheasant',
    'Pig',
    'Pigeon',
    'Polar Bear',
    'Pony- See Horse',
    'Porcupine',
    'Porpoise',
    'Prairie Dog',
    'Quail',
    'Quelea',
    'Quetzal',
    'Rabbit',
    'Raccoon',
    'Rail',
    'Ram',
    'Rat',
    'Raven',
    'Red deer',
    'Red panda',
    'Reindeer',
    'Rhinoceros',
    'Rook',
    'Salamander',
    'Salmon',
    'Sand Dollar',
    'Sandpiper',
    'Sardine',
    'Scorpion',
    'Sea lion',
    'Sea Urchin',
    'Seahorse',
    'Seal',
    'Shark',
    'Sheep',
    'Shrew',
    'Skunk',
    'Snail',
    'Snake',
    'Sparrow',
    'Spider',
    'Spoonbill',
    'Squid',
    'Squirrel',
    'Starling',
    'Stingray',
    'Stinkbug',
    'Stork',
    'Swallow',
    'Swan',
    'Tapir',
    'Tarsier',
    'Termite',
    'Tiger',
    'Toad',
    'Trout',
    'Turkey',
    'Turtle',
    'Viper',
    'Vulture',
    'Wallaby',
    'Walrus',
    'Wasp',
    'Water buffalo',
    'Weasel',
    'Whale',
    'Wolf',
    'Wolverine',
    'Wombat',
    'Woodcock',
    'Woodpecker',
    'Worm',
    'Wren',
    'Yak',
    'Zebra',
];



data.colors = ['Acid Green',
    'Aero',
    'Aero Blue',
    'African Violet',
    'Alabama Crimson',
    'Alice Blue',
    'Alizarin Crimson',
    'Alloy Orange',
    'Almond',
    'Amaranth',
    'Amaranth Pink',
    'Amaranth Purple',
    'Amazon',
    'Amber',
    'American Rose',
    'Amethyst',
    'Android Green',
    'Anti-Flash White',
    'Antique Brass',
    'Antique Bronze',
    'Antique Fuchsia',
    'Antique Ruby',
    'Antique White',
    'Apple Green',
    'Apricot',
    'Aqua',
    'Aquamarine',
    'Army Green',
    'Arsenic',
    'Artichoke',
    'Arylide Yellow',
    'Ash Grey',
    'Asparagus',
    'Atomic Tangerine',
    'Aureolin',
    'AuroMetalSaurus',
    'Avocado',
    'Azure',
    'Azure Mist',
    'Dazzled Blue',
    'Baby Blue',
    'Baby Blue Eyes',
    'Baby Pink',
    'Baby Powder',
    'Baker-Miller Pink',
    'Ball Blue',
    'Banana Mania',
    'Banana Yellow',
    'Bangladesh Green',
    'Barbie Pink',
    'Barn Red',
    'Battleship Grey',
    'Bazaar',
    'Beau Blue',
    'Beaver',
    'Beige',
    'Bisque',
    'Bitter Lemon',
    'Bitter Lime',
    'Bittersweet',
    'Bittersweet Shimmer',
    'Black',
    'Black Bean',
    'Black Leather Jacket',
    'Black Olive',
    'Blanched Almond',
    'Blast-Off Bronze',
    'Bleu De France',
    'Blizzard Blue',
    'Blond',
    'Blue',
    'Blue Bell',
    'Blue Sapphire',
    'Blue Yonder',
    'Blue-Gray',
    'Blue-Green',
    'Blue-Violet',
    'Blueberry',
    'Bluebonnet',
    'Blush',
    'Bole',
    'Bondi Blue',
    'Bone',
    'Boston University Red',
    'Bottle Green',
    'Boysenberry',
    'Brandeis Blue',
    'Brass',
    'Brick Red',
    'Bright Cerulean',
    'Bright Green',
    'Bright Lavender',
    'Bright Lilac',
    'Bright Maroon',
    'Bright Navy Blue',
    'Bright Pink',
    'Bright Turquoise',
    'Bright Ube',
    'Brilliant Lavender',
    'Brilliant Rose',
    'Brink Pink',
    'British Racing Green',
    'Bronze',
    'Bronze Yellow',
    'Brown-Nose',
    'Brunswick Green',
    'Bubble Gum',
    'Bubbles',
    'Bud Green',
    'Buff',
    'Bulgarian Rose',
    'Burgundy',
    'Burlywood',
    'Burnt Orange',
    'Burnt Sienna',
    'Burnt Umber',
    'Byzantine',
    'Byzantium',
    'Cadet',
    'Cadet Blue',
    'Cadet Grey',
    'Cadmium Green',
    'Cadmium Orange',
    'Cadmium Red',
    'Cadmium Yellow',
    'Café Au Lait',
    'Café Noir',
    'Cal Poly Pomona Green',
    'Cambridge Blue',
    'Camel',
    'Cameo Pink',
    'Camouflage Green',
    'Canary Yellow',
    'Candy Apple Red',
    'Candy Pink',
    'Capri',
    'Caput Mortuum',
    'Cardinal',
    'Caribbean Green',
    'Carmine',
    'Carmine Pink',
    'Carmine Red',
    'Carnation Pink',
    'Carnelian',
    'Carolina Blue',
    'Carrot Orange',
    'Castleton Green',
    'Catalina Blue',
    'Catawba',
    'Cedar Chest',
    'Ceil',
    'Celadon',
    'Celadon Blue',
    'Celadon Green',
    'Celeste',
    'Celestial Blue',
    'Cerise',
    'Cerise Pink',
    'Cerulean',
    'Cerulean Blue',
    'Cerulean Frost',
    'CG Blue',
    'CG Red',
    'Chamoisee',
    'Champagne',
    'Charcoal',
    'Charleston Green',
    'Charm Pink',
    'Cherry',
    'Cherry Blossom Pink',
    'Chestnut',
    'China Pink',
    'China Rose',
    'Chinese Red',
    'Chinese Violet',
    'Chrome Yellow',
    'Cinereous',
    'Cinnabar',
    'Cinnamon[Citation Needed]',
    'Citrine',
    'Citron',
    'Claret',
    'Classic Rose',
    'Cobalt',
    'Cocoa Brown',
    'Coconut',
    'Coffee',
    'Columbia Blue',
    'Congo Pink',
    'Cool Black',
    'Cool Grey',
    'Copper',
    'Copper Penny',
    'Copper Red',
    'Copper Rose',
    'Coquelicot',
    'Coral',
    'Coral Pink',
    'Coral Red',
    'Cordovan',
    'Corn',
    'Cornell Red',
    'Cornflower Blue',
    'Cornsilk',
    'Cosmic Latte',
    'Cotton Candy',
    'Cream',
    'Crimson',
    'Crimson Glory',
    'Cyan',
    'Cyber Grape',
    'Cyber Yellow',
    'Daffodil',
    'Dandelion',
    'Dark Blue',
    'Dark Blue-Gray',
    'Dark Brown',
    'Dark Byzantium',
    'Dark Candy Apple Red',
    'Dark Cerulean',
    'Dark Chestnut',
    'Dark Coral',
    'Dark Cyan',
    'Dark Electric Blue',
    'Dark Goldenrod',
    'Dark Green',
    'Dark Imperial Blue',
    'Dark Jungle Green',
    'Dark Khaki',
    'Dark Lava',
    'Dark Lavender',
    'Dark Liver',
    'Dark Magenta',
    'Dark Medium Gray',
    'Dark Midnight Blue',
    'Dark Moss Green',
    'Dark Olive Green',
    'Dark Orange',
    'Dark Orchid',
    'Dark Pastel Blue',
    'Dark Pastel Green',
    'Dark Pastel Purple',
    'Dark Pastel Red',
    'Dark Pink',
    'Dark Powder Blue',
    'Dark Puce',
    'Dark Raspberry',
    'Dark Red',
    'Dark Salmon',
    'Dark Scarlet',
    'Dark Sea Green',
    'Dark Sienna',
    'Dark Sky Blue',
    'Dark Slate Blue',
    'Dark Slate Gray',
    'Dark Spring Green',
    'Dark Tan',
    'Dark Tangerine',
    'Dark Taupe',
    'Dark Terra Cotta',
    'Dark Turquoise',
    'Dark Vanilla',
    'Dark Violet',
    'Dark Yellow',
    'Dartmouth Green',
    'Debian Red',
    'Deep Carmine',
    'Deep Carmine Pink',
    'Deep Carrot Orange',
    'Deep Cerise',
    'Deep Champagne',
    'Deep Chestnut',
    'Deep Coffee',
    'Deep Fuchsia',
    'Deep Jungle Green',
    'Deep Lemon',
    'Deep Lilac',
    'Deep Magenta',
    'Deep Mauve',
    'Deep Moss Green',
    'Deep Peach',
    'Deep Pink',
    'Deep Puce',
    'Deep Ruby',
    'Deep Saffron',
    'Deep Sky Blue',
    'Deep Space Sparkle',
    'Deep Taupe',
    'Deep Tuscan Red',
    'Deer',
    'Denim',
    'Desert',
    'Desert Sand',
    'Desire',
    'Diamond',
    'Dim Gray',
    'Dirt',
    'Dodger Blue',
    'Dogwood Rose',
    'Dollar Bill',
    'Donkey Brown',
    'Drab',
    'Duke Blue',
    'Dust Storm',
    'Dutch White',
    'Earth Yellow',
    'Ebony',
    'Ecru',
    'Eerie Black',
    'Eggplant',
    'Eggshell',
    'Egyptian Blue',
    'Electric Blue',
    'Electric Crimson',
    'Electric Cyan',
    'Electric Green',
    'Electric Indigo',
    'Electric Lavender',
    'Electric Lime',
    'Electric Purple',
    'Electric Ultramarine',
    'Electric Violet',
    'Electric Yellow',
    'Emerald',
    'Eminence',
    'English Green',
    'English Lavender',
    'English Red',
    'English Violet',
    'Eton Blue',
    'Eucalyptus',
    'Fallow',
    'Falu Red',
    'Fandango',
    'Fandango Pink',
    'Fashion Fuchsia',
    'Fawn',
    'Feldgrau',
    'Feldspar',
    'Fern Green',
    'Ferrari Red',
    'Field Drab',
    'Fire Engine Red',
    'Firebrick',
    'Flame',
    'Flamingo Pink',
    'Flattery',
    'Flavescent',
    'Flax',
    'Flirt',
    'Floral White',
    'Fluorescent Orange',
    'Fluorescent Pink',
    'Fluorescent Yellow',
    'Folly',
    'French Beige',
    'French Bistre',
    'French Blue',
    'French Fuchsia',
    'French Lilac',
    'French Lime',
    'French Mauve',
    'French Pink',
    'French Plum',
    'French Puce',
    'French Raspberry',
    'French Rose',
    'French Sky Blue',
    'French Violet',
    'French Wine',
    'Fresh Air',
    'Fuchsia',
    'Fuchsia Pink',
    'Fuchsia Purple',
    'Fuchsia Rose',
    'Fulvous',
    'Fuzzy Wuzzy',
];

function random(list){
    return list[Math.floor(Math.random()*list.length)];
}

exports.color = function () {
    return random(data.colors);
};

exports.animal = function () {
    return random(data.animals);
};

exports.colorAnimal = function () {
    return this.color() + " " + this.animal();
};
},{}],11:[function(require,module,exports){
/** @jsx React.DOM */


var Application = require('./application');
var ResultRenderer = require('./result-renderer');
var WifEditor = require('./wif-editor');
var WifList = require('./wif-list');
var Icon = require('./bootstrap/icon');
var storage = require('./storage');


var NavBar =React.createClass({displayName: 'NavBar',
    render: function () {
        var proActive = this.props.page == 'projects'?'active':'';
        var wifActive = this.props.page == 'wifs'?'active':'';
        return React.DOM.nav( {className:"navbar navbar-default", role:"navigation"}, 
            React.DOM.div( {className:"container-fluid"}, 
                React.DOM.div( {className:"navbar-header"}, 
                    React.DOM.a( {className:"navbar-brand", href:"#"}, Icon( {icon:"fire"}),
                    " Random Weave Stripes")
                ),

                React.DOM.ul( {className:"nav navbar-nav"}, 
                    React.DOM.li( {className:proActive}, React.DOM.a( {href:"#projects"}, "Projects"))
                ),
                React.DOM.ul( {className:"nav navbar-nav"}, 
                    React.DOM.li( {className:wifActive}, React.DOM.a( {href:"#wifs"}, "Wifs"))
                )
            )
        )
    }
});


var UploadForm = React.createClass({displayName: 'UploadForm',
    onSubmit: function () {
        var reader = new FileReader();

        reader.onload = function(evt) {
            if(evt.target.readyState != 2) return;
            if(evt.target.error) {
                alert('Error while reading file');
                return;
            }

            filecontent = evt.target.result;

            var newId = "" + Math.floor(Math.random() * 1000000000);
            var data = JSON.parse(evt.target.result);
            data.name = data.name + " [Imported]";
            storage.save(newId, data);
            routie(routie.lookup('project', {id: newId}));
        };

        reader.readAsText(this.refs.file.getDOMNode().files[0]);
    },

    clickFile: function () {
        this.refs.file.getDOMNode().click();
    },

    render: function () {
        var style={color:'white'};
        return React.DOM.form( {onSubmit:this.onSubmit}, 
                    React.DOM.h4(null, "Import Project"),

                    React.DOM.input( {type:"file", ref:"file", className:"white-file", style:style} ),React.DOM.br(null),
                    React.DOM.button( {className:"btn btn-default"}, Icon( {icon:"floppy-open"}), " Import")
               )
    }
});




/**
 * Created by kajwi_000 on 2014-04-07.
 */
var ProjectPicker = React.createClass({displayName: 'ProjectPicker',


    getInitialState: function () {
        return {
            projects: []
            };
    },

    componentDidMount: function () {
        routie('wif wif/:id', function (id) {
            this.setState({pageGroup: 'wifs', page: 'wif', id: id});
        }.bind(this));

        routie('wifs wifs', function () {
            this.setState({pageGroup: 'wifs', page: 'wifs'});
        }.bind(this));

        routie('project project/:id', function (id) {
            this.setState({pageGroup: 'projects', page: 'project', id: id});
        }.bind(this));

        routie('*', function () {
            this.setState({pageGroup: 'projects',  page: 'projects'});
            this.setState({currentId: null,  projects: storage.listProjects()});
        }.bind(this));
    },



    createNew: function () {
        var newId = "" + Math.floor(Math.random() * 1000000000);
        routie(routie.lookup('project', {id: newId}));
    },

    render: function () {
        var page;

        if (this.state.page == 'project') {
            page = Application( {id:this.state.id})
        }
        else if (this.state.page == 'wif') {
            page = WifEditor( {id:this.state.id})
        }
        else if (this.state.page == 'wifs') {
            page = WifList(null)
        }
        else {

            var projects = this.state.projects.slice();
            projects.sort(function (a, b) {
                var one = (b.lastChange || 0) - (a.lastChange || 0) ;

                if(one == 0)
                    return a.name.localeCompare(b.name);
                else
                    return one;
            });

            var projectViews = projects.map(function (project) {
                var preview;
                if(project.result){
                    preview = ResultRenderer( {result:project.result, height:"20"});
                }

                function makeLink(inner){
                    return React.DOM.a( {href:'#' + routie.lookup('project', {id: project.id})}, inner)
                }

                return (React.DOM.div(null, 
                    React.DOM.h4(null, makeLink(project.name)),
                        makeLink(preview)
                )
                    );
            }.bind(this));





            page = React.DOM.div( {className:"container-fluid"}, 
                React.DOM.h1( {className:"page-header page-header-main"}, "Saved projects"),
                projectViews,
                React.DOM.hr(null),
                    React.DOM.a( {className:"btn btn-default", onClick:this.createNew}, Icon( {icon:"plus"}), " New Project"),
                    React.DOM.br(null),React.DOM.br(null),
                    UploadForm(null)
            )
        }

        return React.DOM.div(null, NavBar( {page:this.state.pageGroup}),page)
    }
});

module.exports = ProjectPicker;
},{"./application":1,"./bootstrap/icon":3,"./result-renderer":13,"./storage":15,"./wif-editor":17,"./wif-list":18}],12:[function(require,module,exports){
/** @jsx React.DOM */



var stripes = require('./stripes');


var Renderer = React.createClass({displayName: 'Renderer',
    ctx: null,
    componentDidMount: function () {
        this.renderPoints(this.props);
    },

//    shouldComponentUpdate: function (props) {
//        this.renderPoints(props);
//        return false;
//    },

    componentDidUpdate: function (props) {
        window._hack = window._hack||{};
        window._hack.canvas = this.getDOMNode();
        this.renderPoints(this.props);
    },

    renderPoints: function (props) {
        var result = stripes(props.layers, this.props.size.x, this.props.backgroundColor);

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
        return  React.DOM.canvas( {width:this.props.size.x, height:this.props.size.y})
    }
});

module.exports = Renderer;
},{"./stripes":16}],13:[function(require,module,exports){
/** @jsx React.DOM */



var stripes = require('./stripes');


var Renderer = React.createClass({displayName: 'Renderer',
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

        var ctx = this.getDOMNode().getContext('2d');

        var size= this.props.size;
        ctx.fillStyle = 'pink';
        ctx.fillRect(0, 0, result.length, props.height);

        for (var i = 0; i < result.length; i++) {
            ctx.fillStyle = result[i];
            ctx.fillRect(i, 0, 1, props.height);
        }
    },

    render: function () {

        return  React.DOM.canvas( {width:this.props.result.length, height:this.props.height})
    }
});

module.exports = Renderer;
},{"./stripes":16}],14:[function(require,module,exports){
var Rnd = {};

Rnd.color = function () {
    var color = Math.floor(Math.random() * 16777216).toString(16);
    return '#000000'.slice(0, -color.length) + color;
};

module.exports = Rnd;

},{}],15:[function(require,module,exports){
var Rnd = require('./rnd');
var NameGen = require('./name-gen');
var Layer = require('./data/layer');
var Point = require('./data/point');

var stripes = require('./stripes');

var dummy = function () {
    return {
        name: NameGen.colorAnimal(),
        size: {
            x: 800,
            y: 200
        },
        editorSize: 300,
        selectInLayerEditor: true,
        backgroundColor: Rnd.color(),
        layerData: {
            selected:1,
            layers: [
                new Layer(Rnd.color(), [
                    new Point(Math.random(), Math.random()),
                    new Point(Math.random(), Math.random()),
                    new Point(Math.random(), Math.random())
                ]),
                new Layer(Rnd.color(), [
                    new Point(Math.random(), Math.random()),
                    new Point(Math.random(), Math.random())
                ])]
        }
    };
};


var projectPrefix = "random-weave-";
var storage = {
    save: function (id, data) {
        var result = stripes(data.layerData.layers, data.size.x, data.backgroundColor);
        var desc = {
                id: id,
                name: data.name,
                result: result,
                lastChange: Date.now()
        };
        localStorage.setItem(projectPrefix + "-data-" + id, JSON.stringify(data));
        localStorage.setItem(projectPrefix + "-desc-" + id, JSON.stringify(desc));
    },
    load: function (id) {
        try {
            var item = localStorage.getItem(projectPrefix + "-data-" + id);
            if (item) {
                var data = JSON.parse(item);
                data.backgroundColor = data.backgroundColor || '#fcfcfc';
                return data;
            }
        } catch (e) {
        }

        var data = dummy();
        this.save(id, data);
        return  data;
    },
    saveWif: function (desc, data) {
        var id = desc.id;

        localStorage.setItem(projectPrefix + "-wif-data-" + id, data);
        localStorage.setItem(projectPrefix + "-wif-desc-" + id, JSON.stringify(desc));

    },
    saveWifDesc: function (desc) {
        var id = desc.id;
        var copy = _.clone(desc);
        delete copy.data;

        localStorage.setItem(projectPrefix + "-wif-desc-" + id, JSON.stringify(desc));

    },
    loadWif: function (id) {
        var data = localStorage.getItem(projectPrefix + "-wif-data-" + id);
        var desc = JSON.parse(localStorage.getItem(projectPrefix + "-wif-desc-" + id));
        desc.data = data;
        return desc;
    },
    remove: function (id) {
        localStorage.setItem(projectPrefix + "-data-" + id, JSON.stringify(data));
        localStorage.setItem(projectPrefix + "-desc-" + id, JSON.stringify(desc));
    },
    listProjects: function () {
        var projects = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if(key.indexOf(projectPrefix + "-desc-") === 0){
                var desc = JSON.parse(localStorage.getItem(key))
                projects.push(desc);
            }
        }

        return projects;
    },
    listWifs: function () {
        var wifs = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if(key.indexOf(projectPrefix + "-wif-desc-") === 0){
                var desc = JSON.parse(localStorage.getItem(key))
                wifs.push(desc);
            }
        }

        return wifs;
    },

    getOpenTab: function () {
        return localStorage.getItem(projectPrefix + "-open-tab");
    },
    setOpenTab: function (tab) {
        localStorage.setItem(projectPrefix + "-open-tab", tab);
    }
};

module.exports= storage;

},{"./data/layer":4,"./data/point":5,"./name-gen":10,"./rnd":14,"./stripes":16}],16:[function(require,module,exports){
var MathUtils = require('./math-utils');

var seedRandom = function (seed) {
    return function () {
        var x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
};

module.exports = function (layers, size, background) {
    var result = [];
    for (var f = 0; f < size; f++) {
        result.push(background || "#fcfcfc");
    }

    var scale = function (p) {
        return {
            x: p.x * size,
            y: 1 - p.y
        };
    };

    for (var li = 0; li < layers.length; li++) {
        var layer = layers[li];

        rnd = seedRandom(layer.seed || li+1);
        var points = layer.points;

        var zero = {x:0, y:0};
        var max = {x: size-1, y:1};
        for (var i = 1; i < points.length; i++) {
            var p1 = scale(points[i - 1]);
            var p2 = scale(points[i]);
            MathUtils.constrainPoint(p1, zero, max);
            MathUtils.constrainPoint(p2, zero, max);
            p1.x = Math.floor(p1.x);
            p2.x = Math.floor(p2.x);

            var m = (p2.y - p1.y) / (p2.x - p1.x);
            var b = p1.y - m * p1.x;

            for (var j = p1.x; j <= p2.x; j++) {
                var rndVal = rnd();
                var y = m * j + b;

                if (rndVal <= y) {
                    result[j] = layer.color;
                }
            }
        }
    }
    return result;
};
},{"./math-utils":9}],17:[function(require,module,exports){
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
        return React.DOM.div( {className:"container-fluid"}, React.DOM.h1(null, this.state.wifData.name),
            React.DOM.input( {value:this.state.wifData.name, className:"form-control input-sm", onChange:this.onNameChange} ),React.DOM.br(null), React.DOM.pre(null, this.state.wifData.data));
    }
});

},{"./storage":15}],18:[function(require,module,exports){
/** @jsx React.DOM */

var Icon = require('./bootstrap/icon');
var storage = require('./storage');


var UploadWifForm = React.createClass({displayName: 'UploadWifForm',
    onSubmit: function () {
        var reader = new FileReader();
        var name;

        reader.onload = function(evt) {
            if(evt.target.readyState != 2) return;
            if(evt.target.error) {
                alert('Error while reading file');
                return;
            }

            filecontent = evt.target.result;
            var newId = "" + Math.floor(Math.random() * 1000000000);

            storage.saveWif({id: newId, name: name}, filecontent);
            this.props.onUpload();
        }.bind(this);

        var file = this.refs.file.getDOMNode().files[0];
        name = file.name.replace(".wif","");
        reader.readAsText(file);
    },

    clickFile: function () {
        this.refs.file.getDOMNode().click();
    },

    render: function () {
        var style={color:'white'};
        return React.DOM.form( {onSubmit:this.onSubmit}, 
            React.DOM.h4(null, "Import Wif"),

            React.DOM.input( {type:"file", ref:"file", className:"white-file", style:style} ),React.DOM.br(null),
            React.DOM.button( {className:"btn btn-default"}, Icon( {icon:"book"}), " Import")
        )
    }
});


module.exports = React.createClass({
    getInitialState: function () {
        return {            wifs: []
        }
    },
    refreshWif: function () {
        this.setState({wifs: storage.listWifs()});
    },
    componentDidMount: function () {
       this.refreshWif();
    },

    render: function () {
        var wifs = this.state.wifs;

        var wifViews = wifs.map(function (wif) {


            function makeLink(inner){
                return React.DOM.a( {href:'#' + routie.lookup('wif', {id: wif.id})}, inner)
            }

            return (React.DOM.div(null, 
                React.DOM.h4(null, makeLink(wif.name))
            )
                );
        }.bind(this));
        return React.DOM.div( {className:"container-fluid"}, 
            React.DOM.h1( {className:"page-header page-header-main"}, "Imported Wifs"),
            wifViews,
            React.DOM.hr(null),
            UploadWifForm( {onUpload:this.refreshWif})
        )

    }


});

},{"./bootstrap/icon":3,"./storage":15}]},{},[6])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJlOlxccHJvamVjdHNcXGhvbWVcXHdlYXZlXFxyYW5kb20td2VhdmUtc3RyaXBlc1xcbm9kZV9tb2R1bGVzXFxncnVudC1icm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvYm9vdHN0cmFwL2ljb24tYnV0dG9uLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvYm9vdHN0cmFwL2ljb24uanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9kYXRhL2xheWVyLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvZGF0YS9wb2ludC5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL2luZGV4LmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvbGF5ZXItbGluZXMtZWRpdG9yLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvbGF5ZXItbGlzdC5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL21hdGgtdXRpbHMuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9uYW1lLWdlbi5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL3Byb2plY3QtcGlja2VyLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvcmVuZGVyZXIuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9yZXN1bHQtcmVuZGVyZXIuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9ybmQuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9zdG9yYWdlLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvc3RyaXBlcy5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL3dpZi1lZGl0b3IuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy93aWYtbGlzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxudmFyIFJuZCA9IHJlcXVpcmUoJy4vcm5kJyk7XHJcblxyXG52YXIgTGF5ZXIgPSByZXF1aXJlKCcuL2RhdGEvbGF5ZXInKTtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9kYXRhL3BvaW50Jyk7XHJcblxyXG52YXIgSWNvbiA9IHJlcXVpcmUoJy4vYm9vdHN0cmFwL2ljb24nKTtcclxuXHJcbnZhciBSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKTtcclxudmFyIExheWVyTGluZXNFZGl0b3IgPSByZXF1aXJlKCcuL2xheWVyLWxpbmVzLWVkaXRvcicpO1xyXG52YXIgTGF5ZXJMaXN0ID0gcmVxdWlyZSgnLi9sYXllci1saXN0Jyk7XHJcbnZhciBJY29uQnV0dG9uID0gcmVxdWlyZSgnLi9ib290c3RyYXAvaWNvbi1idXR0b24nKTtcclxuXHJcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XHJcblxyXG52YXIgc3RyaXBlcyA9IHJlcXVpcmUoJy4vc3RyaXBlcycpO1xyXG5cclxuXHJcblxyXG52YXIgY2hhbmdlZCA9IGZ1bmN0aW9uICh0YXJnZXQsIGNoYW5nZXMpIHtcclxuICAgIHJldHVybiBfLmV4dGVuZChfLmNsb25lKHRhcmdldCksIGNoYW5nZXMpO1xyXG59O1xyXG5cclxuXHJcbnZhciBLaW5kSW5wdXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdLaW5kSW5wdXQnLFxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdmFsdWU6IHRoaXMucHJvcHMudmFsdWVcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBvbkNoYW5nZTogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB2YXIgdiA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiB2fSk7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZSh2KTtcclxuICAgIH0sXHJcblxyXG4gICAgb25CbHVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dmFsdWU6IHRoaXMucHJvcHMudmFsdWV9KTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHN0eWxlID0ge307XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnByb3BzLnZhbHVlICE9IHRoaXMuc3RhdGUudmFsdWUpIHtcclxuICAgICAgICAgICAgc3R5bGUuY29sb3IgPSAnb3JhbmdlJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhSZWFjdC5ET00uaW5wdXQoIHt2YWx1ZTp0aGlzLnN0YXRlLnZhbHVlLCBvbkNoYW5nZTp0aGlzLm9uQ2hhbmdlLCBzdHlsZTpzdHlsZSwgb25CbHVyOnRoaXMub25CbHVyfSkpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbnZhciBQcm9qZWN0RG93bmxvYWRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUHJvamVjdERvd25sb2FkcycsXHJcbiAgICBnZXRGaWxlTmFtZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBuYW1lID0gdGhpcy5wcm9wcy5hcHBTdGF0ZS5uYW1lIHx8IFwibm9uYW1lXCI7XHJcbiAgICAgICAgdmFyIGZpbGVuYW1lID0gbmFtZS5yZXBsYWNlKC9bXmEtejAtOV0vZ2ksICdfJykudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICByZXR1cm4gZmlsZW5hbWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHNhdmVJbWFnZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgcG9tLnNldEF0dHJpYnV0ZSgnaHJlZicsIHdpbmRvdy5faGFjay5jYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKSk7XHJcbiAgICAgICAgcG9tLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCB0aGlzLmdldEZpbGVOYW1lKCkgK1wiX2ltYWdlLnBuZ1wiKTtcclxuICAgICAgICBwb20uY2xpY2soKTtcclxuXHJcbiAgICB9LFxyXG4gICAgc2F2ZVByb2plY3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgIHBvbS5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeSh0aGlzLnByb3BzLmFwcFN0YXRlKSkpO1xyXG4gICAgICAgIHBvbS5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgdGhpcy5nZXRGaWxlTmFtZSgpICtcIl9wcm9qZWN0Lmpzb25cIik7XHJcbiAgICAgICAgcG9tLmNsaWNrKCk7XHJcblxyXG4gICAgfSxcclxuICAgIHNhdmVNb2RpZmllZFdpZjogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gaGV4VG9SZ2IoaGV4KSB7XHJcbiAgICAgICAgICAgIC8vIEV4cGFuZCBzaG9ydGhhbmQgZm9ybSAoZS5nLiBcIjAzRlwiKSB0byBmdWxsIGZvcm0gKGUuZy4gXCIwMDMzRkZcIilcclxuICAgICAgICAgICAgdmFyIHNob3J0aGFuZFJlZ2V4ID0gL14jPyhbYS1mXFxkXSkoW2EtZlxcZF0pKFthLWZcXGRdKSQvaTtcclxuICAgICAgICAgICAgaGV4ID0gaGV4LnJlcGxhY2Uoc2hvcnRoYW5kUmVnZXgsIGZ1bmN0aW9uIChtLCByLCBnLCBiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gciArIHIgKyBnICsgZyArIGIgKyBiO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSAvXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLmV4ZWMoaGV4KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdCA/IHtcclxuICAgICAgICAgICAgICAgIHI6IHBhcnNlSW50KHJlc3VsdFsxXSwgMTYpLFxyXG4gICAgICAgICAgICAgICAgZzogcGFyc2VJbnQocmVzdWx0WzJdLCAxNiksXHJcbiAgICAgICAgICAgICAgICBiOiBwYXJzZUludChyZXN1bHRbM10sIDE2KVxyXG4gICAgICAgICAgICB9IDogbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBwb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgdmFyIGxvYWRXaWYgPSBzdG9yYWdlLmxvYWRXaWYoaWQpO1xyXG5cclxuICAgICAgICB2YXIgcmVzdWx0ID0gc3RyaXBlcyh0aGlzLnByb3BzLmFwcFN0YXRlLmxheWVyRGF0YS5sYXllcnMsIHRoaXMucHJvcHMuYXBwU3RhdGUuc2l6ZS54LCB0aGlzLnByb3BzLmFwcFN0YXRlLmJhY2tncm91bmRDb2xvcik7XHJcblxyXG4gICAgICAgIHZhciBubCA9IFwiXFxyXFxuXCI7XHJcbiAgICAgICAgdmFyIGNvbG9yc0FycmF5ID0gW107XHJcbiAgICAgICAgdmFyIGRhdGEgPSBcIlwiO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjb2xvciA9IHJlc3VsdFtpXTtcclxuICAgICAgICAgICAgdmFyIG5yID0gY29sb3JzQXJyYXkuaW5kZXhPZihjb2xvcik7XHJcbiAgICAgICAgICAgIGlmIChuciA8IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbG9yc0FycmF5LnB1c2goY29sb3IpO1xyXG4gICAgICAgICAgICAgICAgbnIgPSBjb2xvcnNBcnJheS5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRhdGEgKz0gKGkgKyAxKSArIFwiPVwiICsgKG5yICsgMSkgKyBubDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkYXRhMiA9IFwiW0NPTE9SIFRBQkxFXVwiICsgbmw7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY29sb3JzQXJyYXkubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdmFyIGMgPSBjb2xvcnNBcnJheVtqXTtcclxuICAgICAgICAgICAgdmFyIHJnYiA9IGhleFRvUmdiKGMpO1xyXG4gICAgICAgICAgICBkYXRhMiArPSAoaiArIDEpICsgXCI9XCIgKyByZ2IuciArIFwiLFwiICsgcmdiLmcgKyBcIixcIiArIHJnYi5iICsgbmw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2VjdGlvblNwbGl0ID0gbG9hZFdpZi5kYXRhLnNwbGl0KFwiW1wiKTtcclxuICAgICAgICB2YXIgcmVzO1xyXG5cclxuICAgICAgICBzZWN0aW9uU3BsaXQuZm9yRWFjaChmdW5jdGlvbiAoc2VjKSB7XHJcbiAgICAgICAgICAgIGlmKHNlYy5pbmRleE9mKCdDT0xPUiBQQUxFVFRFXScpID09IDApe1xyXG4gICAgICAgICAgICAgICAgcmVzICs9ICdbQ09MT1IgUEFMRVRURV0nICsgbmw7XHJcbiAgICAgICAgICAgICAgICByZXMgKz0gJ0VudHJpZXM9JyArIGNvbG9yc0FycmF5Lmxlbmd0aCArIG5sO1xyXG4gICAgICAgICAgICAgICAgcmVzICs9ICdGb3JtPVJHQicgKyBubDtcclxuICAgICAgICAgICAgICAgIHJlcyArPSAnUmFuZ2U9MCwyNTUnICsgbmw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZihzZWMuaW5kZXhPZignQ09MT1IgVEFCTEVdJyk9PSAwKXtcclxuICAgICAgICAgICAgICAgIHJlcyArPSBkYXRhMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKHNlYy5pbmRleE9mKCdXQVJQIENPTE9SU10nKT09IDApe1xyXG4gICAgICAgICAgICAgICAgcmVzICs9ICdbV0FSUCBDT0xPUlNdJyArIG5sO1xyXG4gICAgICAgICAgICAgICAgcmVzKz0gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKHNlYy5pbmRleE9mKCdXQVJQXScpPT0gMCl7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzICs9ICgnWycgKyBzZWMpLnJlcGxhY2UoL1RocmVhZHM9XFxkKi8sJ1RocmVhZHM9JyArIHJlc3VsdC5sZW5ndGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzICs9ICdbJyArIHNlYztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgcG9tLnNldEF0dHJpYnV0ZSgnaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlcykpO1xyXG4gICAgICAgIHBvbS5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgdGhpcy5nZXRGaWxlTmFtZSgpKyBcIl9tb2RpZmllZF93aWZfXCIrbG9hZFdpZi5uYW1lK1wiLndpZlwiKTtcclxuICAgICAgICBwb20uY2xpY2soKTtcclxuXHJcbiAgICB9LFxyXG4gICAgY2hhbmdlV2lmOiBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkV2lmOiBlLnRhcmdldC52YWx1ZX0pXHJcbiAgICB9LFxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHt9O1xyXG4gICAgfSxcclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB3aWZzID0gdGhpcy5wcm9wcy5hcHBTdGF0ZS53aWZzIHx8IFtdO1xyXG4gICAgICAgIHZhciBmaXJzdCA9IG51bGw7XHJcbiAgICAgICAgdmFyIHdpZk9wdHMgPSB3aWZzLm1hcChmdW5jdGlvbiAod2lmKSB7XHJcbiAgICAgICAgICAgIGZpcnN0ID0gZmlyc3QgfHwgd2lmLmlkO1xyXG4gICAgICAgICAgICByZXR1cm4gUmVhY3QuRE9NLm9wdGlvbigge3ZhbHVlOndpZi5pZH0sIHdpZi5uYW1lKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRXaWYgfHwgZmlyc3Q7XHJcblxyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaDQobnVsbCwgXCJEb3dubG9hZHNcIilcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgICAgICBJY29uQnV0dG9uKCB7aWNvbjpcImZsb3BweS1zYXZlXCIsIHRpdGxlOlwiUHJvamVjdFwiLCBjbGFzc05hbWU6XCJkb3dubG9hZC1idXR0b25cIiwgb25DbGljazp0aGlzLnNhdmVQcm9qZWN0fSksXHJcbiAgICAgICAgICAgICAgICBJY29uQnV0dG9uKCB7aWNvbjpcInBpY3R1cmVcIiwgdGl0bGU6XCJJbWFnZVwiLCBjbGFzc05hbWU6XCJkb3dubG9hZC1idXR0b25cIiwgb25DbGljazp0aGlzLnNhdmVJbWFnZX0pLFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIFwiU2VsZWN0IHdpZlwiKSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zZWxlY3QoIHt2YWx1ZTpzZWxlY3RlZCwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGgtc3BhY2VkXCIsIG9uQ2hhbmdlOnRoaXMuY2hhbmdlV2lmfSwgXHJcbiAgICAgICAgICAgICAgICAgICAgd2lmT3B0c1xyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgIEljb25CdXR0b24oIHtpY29uOlwicmFuZG9tXCIsIHRpdGxlOlwiTW9kaWZ5IGFuZCBEb3dubG9hZFwiLCBjbGFzc05hbWU6XCJkb3dubG9hZC1idXR0b25cIiwgb25DbGljazp0aGlzLnNhdmVNb2RpZmllZFdpZi5iaW5kKHRoaXMsIHNlbGVjdGVkKX0gKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxudmFyIFByb2plY3RTaXplcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Byb2plY3RTaXplcycsXHJcbiAgICBvbldpZHRoQ2hhbmdlOiBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIGZpeGVkID0gTWF0aC5tYXgoMTAsIHBhcnNlSW50KHZhbCkgfHwgMTAwKTtcclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vblNpemVDaGFuZ2VkKHt4OiBmaXhlZH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIG9uSGVpZ2h0Q2hhbmdlOiBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIGZpeGVkID0gTWF0aC5tYXgoMTAsIHBhcnNlSW50KHZhbCkgfHwgMTAwKTtcclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vblNpemVDaGFuZ2VkKHt5OiBmaXhlZH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgaWQgPSBcIlwiICsgTWF0aC5yYW5kb20oKTtcclxuICAgICAgICByZXR1cm4gIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwIGgtc3BhY2VkXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaDQobnVsbCwgXCJTaXplc1wiKSxcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXBcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBLaW5kSW5wdXQoIHtpZDppZCwgdHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsICB2YWx1ZTp0aGlzLnByb3BzLnNpemUueCwgb25DaGFuZ2U6dGhpcy5vbldpZHRoQ2hhbmdlfSApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwLWFkZG9uXCJ9LCBcInhcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEtpbmRJbnB1dCgge3R5cGU6XCJ0ZXh0XCIsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1zbVwiLCB2YWx1ZTp0aGlzLnByb3BzLnNpemUueSwgb25DaGFuZ2U6dGhpcy5vbkhlaWdodENoYW5nZX0gKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1hZGRvblwifSwgXCJlZGl0XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBLaW5kSW5wdXQoIHt0eXBlOlwidGV4dFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgIHZhbHVlOnRoaXMucHJvcHMuZWRpdG9yU2l6ZSwgb25DaGFuZ2U6dGhpcy5wcm9wcy5vbkVkaXRvclNpemVDaGFuZ2V9IClcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbnZhciBJbnNwZWN0b3JCb3ggPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdJbnNwZWN0b3JCb3gnLFxyXG4gICAgb25SYW5kb21Db2xvcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMub25OZXdDb2xvcihSbmQuY29sb3IoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uQ29sb3JDaGFuZ2U6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdGhpcy5vbk5ld0NvbG9yKGUudGFyZ2V0LnZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgb25OZXdDb2xvcjogZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQmFja2dyb3VuZENvbG9yQ2hhbmdlKHYpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge3RhYjogc3RvcmFnZS5nZXRPcGVuVGFiKCl9O1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGFuZ2VUYWI6IGZ1bmN0aW9uICh0YWIpIHtcclxuICAgICAgICBzdG9yYWdlLnNldE9wZW5UYWIodGFiKTtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHt0YWI6IHRhYn0pO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYXBwU3RhdGUgPSB0aGlzLnByb3BzLmFwcFN0YXRlO1xyXG4gICAgICAgIHZhciB0YWIgPSB0aGlzLnN0YXRlLnRhYnx8J3Byb2plY3QnO1xyXG4gICAgICAgIHZhciB0YWJEYXRhO1xyXG4gICAgICAgIGlmKHRhYiA9PSAnY29sb3JzJyl7XHJcbiAgICAgICAgICAgIHRhYkRhdGEgPSBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uZm9ybSgge3JvbGU6XCJmb3JtXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cFwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5oNCgge2ZvcjpcImxheWVyQ29sb3JcIn0sIFwiQmFja2dyb3VuZCBjb2xvclwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge2lkOlwibGF5ZXJDb2xvclwiLCB0eXBlOlwidGV4dFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgdmFsdWU6dGhpcy5wcm9wcy5hcHBTdGF0ZS5iYWNrZ3JvdW5kQ29sb3IsIG9uQ2hhbmdlOnRoaXMub25Db2xvckNoYW5nZX0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1idG5cIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHQgaW5wdXQtc21cIiwgdHlwZTpcImJ1dHRvblwiLCBvbkNsaWNrOnRoaXMub25SYW5kb21Db2xvcn0sIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbiBnbHlwaGljb24tZmlyZVwifSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIExheWVyTGlzdCgge2xheWVyRGF0YTphcHBTdGF0ZS5sYXllckRhdGEsIHNpemU6YXBwU3RhdGUuc2l6ZSwgb25DaGFuZ2U6dGhpcy5wcm9wcy5vbkxheWVyRGF0YUNoYW5nZX0pXHJcbiAgICAgICAgICAgIClcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHRhYkRhdGEgPSBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICAgICAgUHJvamVjdFNpemVzKCB7c2l6ZTphcHBTdGF0ZS5zaXplLFxyXG4gICAgICAgICAgICAgICAgZWRpdG9yU2l6ZTphcHBTdGF0ZS5lZGl0b3JTaXplLFxyXG4gICAgICAgICAgICAgICAgb25TaXplQ2hhbmdlZDp0aGlzLnByb3BzLm9uU2l6ZUNoYW5nZWQsXHJcbiAgICAgICAgICAgICAgICBvbkVkaXRvclNpemVDaGFuZ2U6dGhpcy5wcm9wcy5vbkVkaXRvclNpemVDaGFuZ2V9KSxcclxuICAgICAgICAgICAgICAgIFByb2plY3REb3dubG9hZHMoIHthcHBTdGF0ZTphcHBTdGF0ZX0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJpbnNwZWN0b3JCb3ggY29udGFpbmVyLWZsdWlkXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS51bCgge2NsYXNzTmFtZTpcIm5hdiBuYXYtdGFic1wifSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6dGFiPT0ncHJvamVjdCcgJiYgJ2FjdGl2ZSd9LCBSZWFjdC5ET00uYSgge29uQ2xpY2s6dGhpcy5jaGFuZ2VUYWIuYmluZCh0aGlzLCAncHJvamVjdCcpfSwgXCJQcm9qZWN0XCIpKSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5saSgge2NsYXNzTmFtZTp0YWI9PSdjb2xvcnMnICYmICdhY3RpdmUnfSwgUmVhY3QuRE9NLmEoIHtvbkNsaWNrOnRoaXMuY2hhbmdlVGFiLmJpbmQodGhpcywgJ2NvbG9ycycpfSwgXCJDb2xvcnNcIikpXHJcblxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIHRhYkRhdGFcclxuICAgICAgICApXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbnZhciBBcHBsaWNhdGlvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FwcGxpY2F0aW9uJyxcclxuICAgIG1peGluczogW1JlYWN0LmFkZG9ucy5MaW5rZWRTdGF0ZU1peGluXSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gc3RvcmFnZS5sb2FkKHRoaXMucHJvcHMuaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvbkxheWVyRGF0YUNoYW5nZTogZnVuY3Rpb24gKG5ld0xheWVyRGF0YSkge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2xheWVyRGF0YTogbmV3TGF5ZXJEYXRhfSk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICBjaGFuZ2VTaXplOiBmdW5jdGlvbiAobmV3U2l6ZSkge1xyXG4gICAgICAgIHZhciBmaXhlZFNpemUgPSBjaGFuZ2VkKHRoaXMuc3RhdGUuc2l6ZSwgbmV3U2l6ZSk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2l6ZTogZml4ZWRTaXplfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjb3B5ID0gXy5jbG9uZSh0aGlzLnN0YXRlKTtcclxuICAgICAgICBkZWxldGUgY29weS53aWZzO1xyXG4gICAgICAgIHN0b3JhZ2Uuc2F2ZSh0aGlzLnByb3BzLmlkLCB0aGlzLnN0YXRlKTtcclxuICAgICAgICBpZih0aGlzLnN0YXRlLmVkaXROYW1lKXtcclxuICAgICAgICAgICAgdmFyIG5hbWVFZGl0b3IgPSB0aGlzLnJlZnMubmFtZUVkaXRvcjtcclxuICAgICAgICAgICAgaWYgKG5hbWVFZGl0b3IpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkb21Ob2RlID0gbmFtZUVkaXRvci5nZXRET01Ob2RlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZG9tTm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRvbU5vZGUuZm9jdXMoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBvbkJhY2tncm91bmRDb2xvckNoYW5nZTogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2JhY2tncm91bmRDb2xvcjogdmFsfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uRWRpdG9yU2l6ZUNoYW5nZTogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgIHZhciBmaXhlZCA9IE1hdGgubWF4KDEwLCBwYXJzZUludCh2YWwpIHx8IDEwMCk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZWRpdG9yU2l6ZTogZml4ZWR9KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2hvd05hbWVFZGl0b3I6IGZ1bmN0aW9uIChzaG93KSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7ZWRpdE5hbWU6IHNob3cgfSk7XHJcbiAgICB9LFxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHt3aWZzOiBzdG9yYWdlLmxpc3RXaWZzKCl9KTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVkaXRvclNpemUgPSB7eDogdGhpcy5zdGF0ZS5zaXplLngsIHk6IHRoaXMuc3RhdGUuZWRpdG9yU2l6ZSB8fCAxMDB9O1xyXG4gICAgICAgIHZhciBuYW1lQ29tcG9uZW50ID0gUmVhY3QuRE9NLnNwYW4oIHtvbkNsaWNrOnRoaXMuc2hvd05hbWVFZGl0b3IuYmluZCh0aGlzLCB0cnVlKX0sIHRoaXMuc3RhdGUubmFtZSlcclxuICAgICAgICBpZih0aGlzLnN0YXRlLmVkaXROYW1lKXtcclxuICAgICAgICAgICAgbmFtZUNvbXBvbmVudCA9IFJlYWN0LkRPTS5pbnB1dCgge2NsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1zbVwiLCB2YWx1ZUxpbms6dGhpcy5saW5rU3RhdGUoJ25hbWUnKSwgcmVmOlwibmFtZUVkaXRvclwiLCBvbkJsdXI6dGhpcy5zaG93TmFtZUVkaXRvci5iaW5kKHRoaXMsIGZhbHNlKX0gKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb250YWluZXItZmx1aWRcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaDEoIHtjbGFzc05hbWU6XCJwYWdlLWhlYWRlciBwYWdlLWhlYWRlci1tYWluXCJ9LCBuYW1lQ29tcG9uZW50KSxcclxuXHJcbiAgICAgICAgICAgIEluc3BlY3RvckJveCgge2FwcFN0YXRlOnRoaXMuc3RhdGUsXHJcbiAgICAgICAgICAgIG9uTGF5ZXJEYXRhQ2hhbmdlOnRoaXMub25MYXllckRhdGFDaGFuZ2UsXHJcbiAgICAgICAgICAgIG9uU2l6ZUNoYW5nZWQ6dGhpcy5jaGFuZ2VTaXplLFxyXG4gICAgICAgICAgICBvbkVkaXRvclNpemVDaGFuZ2U6dGhpcy5vbkVkaXRvclNpemVDaGFuZ2UsXHJcbiAgICAgICAgICAgIG9uQmFja2dyb3VuZENvbG9yQ2hhbmdlOnRoaXMub25CYWNrZ3JvdW5kQ29sb3JDaGFuZ2V9XHJcbiAgICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwic3RyaXBlc0FyZWFCb3hcIn0sIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgICAgICAgICBSZW5kZXJlcigge2xheWVyczp0aGlzLnN0YXRlLmxheWVyRGF0YS5sYXllcnMsIHNpemU6dGhpcy5zdGF0ZS5zaXplLCBiYWNrZ3JvdW5kQ29sb3I6dGhpcy5zdGF0ZS5iYWNrZ3JvdW5kQ29sb3J9KVxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgIExheWVyTGluZXNFZGl0b3IoIHtjYW5TZWxlY3Q6dGhpcy5zdGF0ZS5zZWxlY3RJbkxheWVyRWRpdG9yLCBsYXllckRhdGE6dGhpcy5zdGF0ZS5sYXllckRhdGEsIG9uQ2hhbmdlOnRoaXMub25MYXllckRhdGFDaGFuZ2UsIHNpemU6ZWRpdG9yU2l6ZX0gKSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5icihudWxsKSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3R5cGU6XCJjaGVja2JveFwiLCBjaGVja2VkTGluazp0aGlzLmxpbmtTdGF0ZSgnc2VsZWN0SW5MYXllckVkaXRvcicpfSksXG4gICAgICAgICAgICAgICAgXCIgQWxsb3cgU2VsZWN0IFwiLFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5icihudWxsKSxSZWFjdC5ET00uYnIobnVsbCksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwid2VsbFwifSwgXG4gICAgICAgICAgICAgICAgICAgIFwiIFNoaWZ0K0NsaWNrIHRvIGFkZCBwb2ludHMgXCIsXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5icihudWxsKSxcbiAgICAgICAgICAgICAgICAgICAgXCIgQ3RybCtDbGljayB0byByZW1vdmUgcG9pbnRzIFwiXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY2xlYXItZml4IGFsZXJ0IGFsZXJ0LXdhcm5pbmdcIn0sIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJXYXJuaW5nIVwiKSwgXCIgVGhpcyBpcyBhIHdvcmsgaW4gcHJvZ3Jlc3MgdGhpbmcuIERvbid0IGV4cGVjdCBhbnl0aGluZyB0byB3b3JrIGFuZCB5b3VyIGRhdGEgbWlnaHQgZGlzYXBlYXIgYXQgYW55IG1vbWVudCFcIilcclxuICAgICAgICApXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb247XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxudmFyIEljb24gPSByZXF1aXJlKCcuL2ljb24nKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhSZWFjdC5ET00uYnV0dG9uKCB7dHlwZTpcImJ1dHRvblwiLCBjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIn0sIEljb24oIHtpY29uOnRoaXMucHJvcHMuaWNvbn0pLCB0aGlzLnByb3BzLnRpdGxlP1wiIFwiICsgdGhpcy5wcm9wcy50aXRsZTonJykpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxudmFyIEljb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdJY29uJyxcclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBpY29uID0gXCJnbHlwaGljb24gZ2x5cGhpY29uLVwiICsgdGhpcy5wcm9wcy5pY29uO1xyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTppY29ufSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJY29uOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbG9yLCBwb2ludHMpIHtcclxuICAgIHRoaXMuaWQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMDAwKTtcclxuICAgIHRoaXMuc2VlZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDApKzEwO1xyXG4gICAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gICAgdGhpcy5wb2ludHMgPSBwb2ludHM7XHJcbiAgICBwb2ludHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgIHJldHVybiBhLnggLSBiLng7XHJcbiAgICB9KTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyAgPSAgZnVuY3Rpb24gKHgsIHkpIHtcclxuICAgIHRoaXMuaWQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMDAwKTtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG59O1xyXG5cclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblxyXG52YXIgUHJvamVjdFBpY2tlciA9IHJlcXVpcmUoJy4vcHJvamVjdC1waWNrZXInKTtcclxuXHJcblJlYWN0LnJlbmRlckNvbXBvbmVudChcclxuICAgIFByb2plY3RQaWNrZXIobnVsbCApLFxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcGxpY2F0aW9uJylcclxuKTtcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblxyXG52YXIgTWF0aFV0aWxzID0gcmVxdWlyZSgnLi9tYXRoLXV0aWxzJyk7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vZGF0YS9wb2ludCcpO1xyXG5cclxuXHJcbnZhciBJY29uQnV0dG9uID0gcmVxdWlyZSgnLi9ib290c3RyYXAvaWNvbi1idXR0b24nKTtcclxuXHJcbi8vIHRvZG86IHJldXNlP1xyXG52YXIgY2hhbmdlZD0gZnVuY3Rpb24gKHRhcmdldCwgY2hhbmdlcykge1xyXG4gICAgcmV0dXJuIF8uZXh0ZW5kKF8uY2xvbmUodGFyZ2V0KSwgY2hhbmdlcyk7XHJcbn07XHJcblxyXG52YXIgTW92YWJsZUNpcmNsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01vdmFibGVDaXJjbGUnLFxyXG4gICAgb25Nb3VzZURvd246IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgIG86IHtcclxuICAgICAgICAgICAgICAgIG94OiB0aGlzLnByb3BzLmN4LFxyXG4gICAgICAgICAgICAgICAgb3k6IHRoaXMucHJvcHMuY3ksXHJcbiAgICAgICAgICAgICAgICB4OiBlLmNsaWVudFgsXHJcbiAgICAgICAgICAgICAgICB5OiBlLmNsaWVudFlcclxuICAgICAgICAgICAgfX0pO1xyXG4gICAgICAgIHRoaXMucHJvcHMub25Nb3VzZURvd24oZSk7XHJcblxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMub25Nb3VzZU1vdmUpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLm9uTW91c2VVcCk7XHJcblxyXG4gICAgfSxcclxuICAgIG9uTW91c2VVcDogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtvOiBudWxsfSlcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VNb3ZlKTtcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgdGhpcy5vbk1vdXNlVXApO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMub25Nb3VzZU1vdmUpO1xyXG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLm9uTW91c2VVcCk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICBvbk1vdXNlTW92ZTogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB2YXIgbyA9IHRoaXMuc3RhdGUubztcclxuXHJcbiAgICAgICAgaWYgKG8pIHtcclxuICAgICAgICAgICAgdmFyIG5ld08gPSBPYmplY3QuY3JlYXRlKG8pO1xyXG4gICAgICAgICAgICBuZXdPLnggPSBlLmNsaWVudFg7XHJcbiAgICAgICAgICAgIG5ld08ueSA9IGUuY2xpZW50WTtcclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbk1vdmUoKG8ub3ggKyBlLmNsaWVudFggLSB0aGlzLnN0YXRlLm8ueCApLCAoby5veSArZS5jbGllbnRZIC0gdGhpcy5zdGF0ZS5vLnkgKSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUobmV3Tyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oUmVhY3QuRE9NLmNpcmNsZSgge29uTW91c2VEb3duOnRoaXMub25Nb3VzZURvd259KSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcblxyXG52YXIgU2luZ2xlTGluZUVkaXRvciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1NpbmdsZUxpbmVFZGl0b3InLFxyXG4gICAgb25Nb3ZlQ2lyY2xlTW92ZTogZnVuY3Rpb24gKGluZGV4LCB4LCB5KSB7XHJcbiAgICAgICAgdmFyIG5ld1BvaW50cyA9IHRoaXMucHJvcHMucG9pbnRzLnNsaWNlKCk7XHJcbiAgICAgICAgdmFyIGxlZnRQb2ludCA9IG5ld1BvaW50c1tpbmRleCAtIDFdIHx8IHt4OiAwfTtcclxuICAgICAgICB2YXIgcmlnaHRQb2ludCA9IG5ld1BvaW50c1tpbmRleCArIDFdIHx8IHt4OiB0aGlzLnByb3BzLnNpemUueH07XHJcblxyXG4gICAgICAgIG5ld1BvaW50c1tpbmRleF0gPSBuZXdQb2ludCA9IF8uY2xvbmUobmV3UG9pbnRzW2luZGV4XSk7XHJcblxyXG4gICAgICAgIG5ld1BvaW50LnggPSBNYXRoVXRpbHMuY29uc3RyYWluKHgsIGxlZnRQb2ludC54LCByaWdodFBvaW50LngpO1xyXG4gICAgICAgIG5ld1BvaW50LnkgPSBNYXRoVXRpbHMuY29uc3RyYWluKHksICAwLCB0aGlzLnByb3BzLnNpemUueSk7XHJcblxyXG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UobmV3UG9pbnRzKTtcclxuICAgIH0sXHJcblxyXG4gICAgb25Ub3VjaDogZnVuY3Rpb24gKGNpcmNsZUksIGUpIHtcclxuICAgICAgICB0aGlzLnByb3BzLm9uUG9pbnRUb3VjaChjaXJjbGVJLCBlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciBsaW5lU3R5bGUgPSB7XHJcbiAgICAgICAgICAgIHN0cm9rZTogdGhpcy5wcm9wcy5jb2xvcixcclxuICAgICAgICAgICAgJ3N0cm9rZS13aWR0aCc6IDJcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBjaXJjbGVTdHlsZSA9IHtcclxuICAgICAgICAgICAgZmlsbDogdGhpcy5wcm9wcy5tYXJrQ29sb3IsXHJcbiAgICAgICAgICAgIGN1cnNvcjogJ21vdmUnXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGxpbmVzID0gW107XHJcbiAgICAgICAgdmFyIGNpcmNsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgdmFyIGNpcmNsZSA9IGZ1bmN0aW9uIChwLCBpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNb3ZhYmxlQ2lyY2xlKCB7a2V5OnAuaWQsIGN4OnAueCwgY3k6cC55LCByOnRoaXMucHJvcHMubWFya1NpemUsIG9uTW91c2VEb3duOnRoaXMub25Ub3VjaC5iaW5kKHRoaXMsIGkpLCBvbk1vdmU6dGhpcy5vbk1vdmVDaXJjbGVNb3ZlLmJpbmQodGhpcywgaSksIHN0eWxlOmNpcmNsZVN0eWxlfSlcclxuICAgICAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5wcm9wcy5wb2ludHMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBwMSA9IHRoaXMucHJvcHMucG9pbnRzW2kgLSAxXTtcclxuICAgICAgICAgICAgdmFyIHAyID0gdGhpcy5wcm9wcy5wb2ludHNbaV07XHJcbiAgICAgICAgICAgIGlmIChpID09IDEpIHtcclxuICAgICAgICAgICAgICAgIGNpcmNsZXMucHVzaChjaXJjbGUocDEsIGkgLSAxKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGluZXMucHVzaChSZWFjdC5ET00ubGluZSgge3gxOnAxLngsIHkxOnAxLnksIHgyOnAyLngsIHkyOnAyLnksIHN0eWxlOmxpbmVTdHlsZX0pKTtcclxuICAgICAgICAgICAgY2lyY2xlcy5wdXNoKGNpcmNsZShwMiwgaSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5nKG51bGwsIFxyXG4gICAgICAgIGxpbmVzLFxyXG4gICAgICAgIGNpcmNsZXNcclxuICAgICAgICApXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gc2NhbGVQb2ludChwb2ludCwgYnkpe1xyXG4gICAgcmV0dXJuIF8uZXh0ZW5kKF8uY2xvbmUocG9pbnQpLCB7eDogcG9pbnQueCogYnkueCx5OiBwb2ludC55KiBieS55IH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzY2FsZVBvaW50cyhwb2ludHMsIGJ5KXtcclxuICAgIHJldHVybiBwb2ludHMubWFwKGZ1bmN0aW9uIChwKSB7XHJcbiAgICAgICAgcmV0dXJuIHNjYWxlUG9pbnQocCwgYnkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG52YXIgTGF5ZXJMaW5lc0VkaXRvciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0xheWVyTGluZXNFZGl0b3InLFxyXG4gICAgb25MaW5lQ2hhbmdlOiBmdW5jdGlvbiAoaW5kZXgsIHBvaW50cykge1xyXG4gICAgICAgIHZhciBzID0gdGhpcy5wcm9wcy5zaXplO1xyXG4gICAgICAgIHZhciBpcyA9ICB7eDogMS9zLngsIHk6MS8gcy55fTtcclxuICAgICAgICBwb2ludHMgPSBzY2FsZVBvaW50cyhwb2ludHMsIGlzKTtcclxuICAgICAgICB0aGlzLm9uUmF3TGluZUNoYW5nZShpbmRleCwgcG9pbnRzKTtcclxuICAgIH0sXHJcblxyXG4gICAgb25SYXdMaW5lQ2hhbmdlOiBmdW5jdGlvbiAoaW5kZXgsIHBvaW50cykge1xyXG4gICAgICAgIHZhciBuZXdMYXllcnMgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5sYXllcnMuc2xpY2UoKTtcclxuICAgICAgICB2YXIgbmV3TGF5ZXIgPSBuZXdMYXllcnNbaW5kZXhdID0gXy5jbG9uZShuZXdMYXllcnNbaW5kZXhdKTtcclxuICAgICAgICBuZXdMYXllci5wb2ludHMgPSBwb2ludHM7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShjaGFuZ2VkKHRoaXMucHJvcHMubGF5ZXJEYXRhLCB7bGF5ZXJzOiBuZXdMYXllcnN9KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uUG9pbnRUb3VjaDogZnVuY3Rpb24gKGxheWVySSwgcG9pbnRJLCBlKSB7XHJcbiAgICAgICAgaWYgKCFlLmN0cmxLZXkpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShjaGFuZ2VkKHRoaXMucHJvcHMubGF5ZXJEYXRhLCB7c2VsZWN0ZWQ6IGxheWVySX0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdQb2ludHMgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5sYXllcnNbbGF5ZXJJXS5wb2ludHMuc2xpY2UoKTtcclxuICAgICAgICAgICAgbmV3UG9pbnRzLnNwbGljZShwb2ludEksIDEpO1xyXG4gICAgICAgICAgICB0aGlzLm9uUmF3TGluZUNoYW5nZShsYXllckksbmV3UG9pbnRzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudDogZnVuY3Rpb24gKHRhcmdldCwgdHlwZSkge1xyXG4gICAgICAgIHdoaWxlKHRhcmdldCAmJiB0YXJnZXQubm9kZU5hbWUgIT0gdHlwZSl7XHJcbiAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGRQb2ludDogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBpZiAoIWUuY3RybEtleSAmJiBlLnNoaWZ0S2V5KSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMucHJvcHMubGF5ZXJEYXRhLnNlbGVjdGVkO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdQb2ludHMgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5sYXllcnNbc2VsZWN0ZWRdLnBvaW50cy5zbGljZSgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMuZ2V0UGFyZW50KGUudGFyZ2V0LCAnc3ZnJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcCA9IG5ldyBQb2ludChlLnBhZ2VYIC0gY2FudmFzLm9mZnNldExlZnQsIGUucGFnZVkgLSBjYW52YXMub2Zmc2V0VG9wKVxyXG4gICAgICAgICAgICAgICAgdmFyIHMgPSB0aGlzLnByb3BzLnNpemU7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXMgPSAge3g6IDEvcy54LCB5OjEvIHMueX07XHJcbiAgICAgICAgICAgICAgICBwID0gc2NhbGVQb2ludChwLGlzKTtcclxuICAgICAgICAgICAgICAgIG5ld1BvaW50cy5wdXNoKHApO1xyXG4gICAgICAgICAgICAgICAgbmV3UG9pbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS54IC0gYi54O1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uUmF3TGluZUNoYW5nZShzZWxlY3RlZCwgbmV3UG9pbnRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBzID0gdGhpcy5wcm9wcy5zaXplO1xyXG4gICAgICAgIHZhciBlZGl0b3JzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzLm1hcChmdW5jdGlvbiAobGF5ZXIsIGkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMucHJvcHMubGF5ZXJEYXRhLnNlbGVjdGVkID09IGk7XHJcbiAgICAgICAgICAgIHZhciBtYXJrQ29sb3IgPSBzZWxlY3RlZD8nd2hpdGUnOidncmV5JztcclxuICAgICAgICAgICAgdmFyIG1hcmtTaXplID0gMTA7XHJcblxyXG4gICAgICAgICAgICBpZighdGhpcy5wcm9wcy5jYW5TZWxlY3QgJiYgIXNlbGVjdGVkKXtcclxuICAgICAgICAgICAgICAgIG1hcmtTaXplID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHNjYWxlZFBvaW50cyA9IHNjYWxlUG9pbnRzKGxheWVyLnBvaW50cywgdGhpcy5wcm9wcy5zaXplKTtcclxuICAgICAgICAgICAgcmV0dXJuIFNpbmdsZUxpbmVFZGl0b3IoICB7c2l6ZTpzLCBjb2xvcjpsYXllci5jb2xvciwgbWFya0NvbG9yOm1hcmtDb2xvciwgbWFya1NpemU6bWFya1NpemUsICBwb2ludHM6c2NhbGVkUG9pbnRzLCBvbkNoYW5nZTp0aGlzLm9uTGluZUNoYW5nZS5iaW5kKHRoaXMsIGkpLCBvblBvaW50VG91Y2g6dGhpcy5vblBvaW50VG91Y2guYmluZCh0aGlzLCBpKX0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG5cclxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLnN2Zygge3dpZHRoOnMueCwgaGVpZ2h0OnMueSwgY2xhc3NOYW1lOlwibGluZUVkaXRvclwiLCBvbk1vdXNlRG93bjp0aGlzLmFkZFBvaW50fSwgZWRpdG9ycyk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGF5ZXJMaW5lc0VkaXRvcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXHJcbnZhciBSbmQgPSByZXF1aXJlKCcuL3JuZCcpO1xyXG5cclxudmFyIExheWVyID0gcmVxdWlyZSgnLi9kYXRhL2xheWVyJyk7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vZGF0YS9wb2ludCcpO1xyXG5cclxudmFyIEljb25CdXR0b24gPSByZXF1aXJlKCcuL2Jvb3RzdHJhcC9pY29uLWJ1dHRvbicpO1xyXG5cclxuYXJyYXlNb3ZlID0gZnVuY3Rpb24oYXJyYXksIGZyb20sIHRvKSB7XHJcbiAgICBhcnJheS5zcGxpY2UodG8sIDAsIGFycmF5LnNwbGljZShmcm9tLCAxKVswXSk7XHJcbn07XHJcblxyXG52YXIgTGF5ZXJJbnNwZWN0b3IgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdMYXllckluc3BlY3RvcicsXHJcbiAgICBvbkNvbG9yQ2hhbmdlOiBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHRoaXMub25OZXdDb2xvclZhbHVlKGUudGFyZ2V0LnZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgb25TZWVkQ2hhbmdlOiBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHRoaXMub25OZXdTZWVkVmFsdWUoZS50YXJnZXQudmFsdWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvbk5ld0NvbG9yVmFsdWU6IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICB2YXIgbmV3TGF5ZXIgID0gIF8uY2xvbmUodGhpcy5wcm9wcy5sYXllcik7XHJcbiAgICAgICAgbmV3TGF5ZXIuY29sb3IgPSB2YWw7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShuZXdMYXllcik7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uTmV3U2VlZFZhbHVlOiBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgdmFyIG5ld0xheWVyICA9ICBfLmNsb25lKHRoaXMucHJvcHMubGF5ZXIpO1xyXG4gICAgICAgIG5ld0xheWVyLnNlZWQgPSB2YWw7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShuZXdMYXllcik7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uUmFuZG9tQ29sb3I6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLm9uTmV3Q29sb3JWYWx1ZShSbmQuY29sb3IoKSk7XHJcbiAgICB9LFxyXG4gICAgb25SYW5kb21TZWVkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5vbk5ld1NlZWRWYWx1ZShNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqOTAwMDAgKzEwMDAwKSk7XHJcbiAgICB9LFxyXG5cclxuXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gdG9kbzogcmV1c2FibGUgZm9ybSBjb21wb25lbmV0XHJcblxyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5mb3JtKCB7cm9sZTpcImZvcm1cIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cFwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKCB7Zm9yOlwibGF5ZXJDb2xvclwifSwgXCJDb2xvclwiKSxcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXBcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtpZDpcImxheWVyQ29sb3JcIiwgdHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsIHZhbHVlOnRoaXMucHJvcHMubGF5ZXIuY29sb3IsIG9uQ2hhbmdlOnRoaXMub25Db2xvckNoYW5nZX0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1idG5cIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHQgaW5wdXQtc21cIiwgdHlwZTpcImJ1dHRvblwiLCBvbkNsaWNrOnRoaXMub25SYW5kb21Db2xvcn0sIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbiBnbHlwaGljb24tZmlyZVwifSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKCB7Zm9yOlwibGF5ZXJTZWVkXCJ9LCBcIlNlZWRcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cFwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtpZDpcImxheWVyU2VlZFwiLCB0eXBlOlwidGV4dFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgdmFsdWU6dGhpcy5wcm9wcy5sYXllci5zZWVkLCBvbkNoYW5nZTp0aGlzLm9uU2VlZENoYW5nZX0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXAtYnRuXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcImJ0biBidG4tZGVmYXVsdCBpbnB1dC1zbVwiLCB0eXBlOlwiYnV0dG9uXCIsIG9uQ2xpY2s6dGhpcy5vblJhbmRvbVNlZWR9LCBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24gZ2x5cGhpY29uLWZpcmVcIn0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIClcclxuICAgIH1cclxufSk7XHJcblxyXG52YXIgY2hhbmdlZD0gZnVuY3Rpb24gKHRhcmdldCwgY2hhbmdlcykge1xyXG4gICAgcmV0dXJuIF8uZXh0ZW5kKF8uY2xvbmUodGFyZ2V0KSwgY2hhbmdlcyk7XHJcbn07XHJcblxyXG52YXIgTGF5ZXJMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTGF5ZXJMaXN0JyxcclxuXHJcbiAgICBvbkNsaWNrOiBmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKGNoYW5nZWQodGhpcy5wcm9wcy5sYXllckRhdGEsIHtcclxuICAgICAgICAgICAgc2VsZWN0ZWQ6IGluZGV4XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGRMYXllcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBybmRQb2ludCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludChNYXRoLnJhbmRvbSgpLCBNYXRoLnJhbmRvbSgpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgbmV3TGF5ZXJzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzLnNsaWNlKCk7XHJcblxyXG4gICAgICAgIC8vIHRvZG86IHJldXNlIHNvcnQgKG1vdmUgdG8gTGF5ZXI/KVxyXG4gICAgICAgIHZhciBsYXllciA9IG5ldyBMYXllcihSbmQuY29sb3IoKSwgW3JuZFBvaW50KCksIHJuZFBvaW50KCldKTtcclxuICAgICAgICBsYXllci5wb2ludHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgICAgICByZXR1cm4gYS54IC0gYi54O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG5ld0xheWVycy5wdXNoKGxheWVyKTtcclxuXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShjaGFuZ2VkKHRoaXMucHJvcHMubGF5ZXJEYXRhLCB7XHJcbiAgICAgICAgICAgIGxheWVyczogbmV3TGF5ZXJzLFxyXG4gICAgICAgICAgICBzZWxlY3RlZDogbmV3TGF5ZXJzLmxlbmd0aC0xXHJcbiAgICAgICAgfSkpO1xyXG4gICAgfSxcclxuICAgIHJlbW92ZUxheWVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIG5ld0xheWVycyA9IHRoaXMucHJvcHMubGF5ZXJEYXRhLmxheWVycy5zbGljZSgpO1xyXG4gICAgICAgIG5ld0xheWVycy5zcGxpY2UodGhpcy5wcm9wcy5sYXllckRhdGEuc2VsZWN0ZWQsMSk7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShjaGFuZ2VkKHRoaXMucHJvcHMubGF5ZXJEYXRhLCB7XHJcbiAgICAgICAgICAgIGxheWVyczogbmV3TGF5ZXJzXHJcbiAgICAgICAgfSkpO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgb25MYXllckNoYW5nZTogZnVuY3Rpb24gKGxheWVySW5kZXgsIG5ld0xheWVyKSB7XHJcblxyXG4gICAgICAgIHZhciBuZXdMYXllcnMgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5sYXllcnMuc2xpY2UoKTtcclxuICAgICAgICBuZXdMYXllcnNbbGF5ZXJJbmRleF0gPSBuZXdMYXllcjtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKGNoYW5nZWQodGhpcy5wcm9wcy5sYXllckRhdGEsIHtcclxuICAgICAgICAgICAgbGF5ZXJzOiBuZXdMYXllcnNcclxuICAgICAgICB9KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG1vdmVVcDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMubW92ZSgxKTtcclxuICAgIH0sXHJcblxyXG4gICAgbW92ZURvd246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLm1vdmUoLTEpO1xyXG4gICAgfSxcclxuXHJcbiAgICBtb3ZlOiBmdW5jdGlvbiAoZGVsdGEpIHtcclxuICAgICAgICB2YXIgbGF5ZXJEYXRhID0gdGhpcy5wcm9wcy5sYXllckRhdGE7XHJcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gbGF5ZXJEYXRhLnNlbGVjdGVkO1xyXG4gICAgICAgIHZhciBuZXdMYXllcnMgPSBsYXllckRhdGEubGF5ZXJzLnNsaWNlKCk7XHJcbiAgICAgICAgYXJyYXlNb3ZlKG5ld0xheWVycywgc2VsZWN0ZWQsIHNlbGVjdGVkK2RlbHRhKTtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKGNoYW5nZWQobGF5ZXJEYXRhLCB7XHJcbiAgICAgICAgICAgIGxheWVyczogbmV3TGF5ZXJzLFxyXG4gICAgICAgICAgICBzZWxlY3RlZDogc2VsZWN0ZWQrZGVsdGFcclxuICAgICAgICB9KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBsYXllckRhdGEgPSB0aGlzLnByb3BzLmxheWVyRGF0YTtcclxuICAgICAgICB2YXIgc2VsZWN0ZWRMYXllcjtcclxuXHJcbiAgICAgICAgdmFyIGxheWVycyA9IGxheWVyRGF0YS5sYXllcnMubWFwKGZ1bmN0aW9uIChsYXllciwgaSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHN0eWxlID0ge1xyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiBsYXllci5jb2xvcixcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMzBweCdcclxuXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZihpID09IGxheWVyRGF0YS5zZWxlY3RlZCl7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZExheWVyID0gbGF5ZXI7XHJcbiAgICAgICAgICAgICAgICBzdHlsZS5ib3JkZXIgPSBcIjNweCBkYXNoZWQgIzI3MkIzMFwiXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7c3R5bGU6c3R5bGUsIG9uQ2xpY2s6dGhpcy5vbkNsaWNrLmJpbmQodGhpcywgaSl9KTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgIGxheWVycy5yZXZlcnNlKCk7XHJcbiAgICAgICAgdmFyIGluc3BlY3RvcjtcclxuICAgICAgICB2YXIgYWN0aW9ucyA9IFtdO1xyXG5cclxuICAgICAgICBhY3Rpb25zLnB1c2goSWNvbkJ1dHRvbigge2ljb246XCJwbHVzXCIsIGNsYXNzTmFtZTpcImJ0bi1ncm91cC1zcGFjZVwiLCBvbkNsaWNrOnRoaXMuYWRkTGF5ZXJ9ICkpO1xyXG5cclxuICAgICAgICBpZihzZWxlY3RlZExheWVyKSB7XHJcbiAgICAgICAgICAgIGluc3BlY3RvciA9IExheWVySW5zcGVjdG9yKCB7bGF5ZXI6c2VsZWN0ZWRMYXllciwgb25DaGFuZ2U6dGhpcy5vbkxheWVyQ2hhbmdlLmJpbmQodGhpcywgdGhpcy5wcm9wcy5sYXllckRhdGEuc2VsZWN0ZWQpfSk7XHJcblxyXG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImJ0bi1ncm91cCBidG4tZ3JvdXAtc3BhY2VcIn0sIFxyXG4gICAgICAgICAgICAgICAgSWNvbkJ1dHRvbigge2ljb246XCJhcnJvdy11cFwiLCBvbkNsaWNrOnRoaXMubW92ZVVwLCBlbmFibGVkOmxheWVyRGF0YS5zZWxlY3RlZCA8IGxheWVyRGF0YS5sYXllcnMubGVuZ3RoLTF9KSxcclxuICAgICAgICAgICAgICAgIEljb25CdXR0b24oIHtpY29uOlwiYXJyb3ctZG93blwiLCBvbkNsaWNrOnRoaXMubW92ZURvd24sIGVuYWJsZWQ6bGF5ZXJEYXRhLnNlbGVjdGVkID4gMH0pXHJcbiAgICAgICAgICAgICkpO1xyXG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goSWNvbkJ1dHRvbigge2ljb246XCJ0cmFzaFwiLCBjbGFzc05hbWU6XCJidG4tZ3JvdXAtc3BhY2VcIiwgb25DbGljazp0aGlzLnJlbW92ZUxheWVyfSApKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIFwiTGF5ZXJzXCIpLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaC1zcGFjZWRcIn0sIFxyXG4gICAgICAgICAgICAgICAgbGF5ZXJzXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJoLXNwYWNlZFwifSwgXHJcbiAgICAgICAgICAgICAgICBhY3Rpb25zXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIGluc3BlY3RvclxyXG4gICAgICAgIClcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMYXllckxpc3Q7IiwidmFyIE1hdGhVdGlsID0gTWF0aFV0aWwgfHwge307XHJcbk1hdGhVdGlsLmNvbnN0cmFpbiA9IGZ1bmN0aW9uICh2LCBtaW4sIG1heCkge1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCB2KSk7XHJcbn07XHJcblxyXG5NYXRoVXRpbC5jb25zdHJhaW5Qb2ludCA9IGZ1bmN0aW9uIChwLCBtaW4sIG1heCkge1xyXG4gICAgcC54ID0gTWF0aFV0aWwuY29uc3RyYWluKHAueCwgbWluLngsIG1heC54KTtcclxuICAgIHAueSA9IE1hdGhVdGlsLmNvbnN0cmFpbihwLnksIG1pbi55LCBtYXgueSk7XHJcbiAgICByZXR1cm4gcDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWF0aFV0aWw7IiwidmFyIGRhdGEgPSB7fTtcclxuZGF0YS5hbmltYWxzID0gWydBYXJkdmFyaycsXHJcbiAgICAnQWxiYXRyb3NzJyxcclxuICAgICdBbGxpZ2F0b3InLFxyXG4gICAgJ0FscGFjYScsXHJcbiAgICAnQW50JyxcclxuICAgICdBbnRlYXRlcicsXHJcbiAgICAnQW50ZWxvcGUnLFxyXG4gICAgJ0FwZScsXHJcbiAgICAnQXJtYWRpbGxvJyxcclxuICAgICdBc3MvRG9ua2V5JyxcclxuICAgICdCYWJvb24nLFxyXG4gICAgJ0JhZGdlcicsXHJcbiAgICAnQmFycmFjdWRhJyxcclxuICAgICdCYXQnLFxyXG4gICAgJ0JlYXInLFxyXG4gICAgJ0JlYXZlcicsXHJcbiAgICAnQmVlJyxcclxuICAgICdCaXNvbicsXHJcbiAgICAnQm9hcicsXHJcbiAgICAnQnVmZmFsbycsXHJcbiAgICAnQnV0dGVyZmx5JyxcclxuICAgICdDYW1lbCcsXHJcbiAgICAnQ2FweWJhcmEnLFxyXG4gICAgJ0Nhcmlib3UnLFxyXG4gICAgJ0Nhc3Nvd2FyeScsXHJcbiAgICAnQ2F0JyxcclxuICAgICdDYXRlcnBpbGxhcicsXHJcbiAgICAnQ2F0dGxlJyxcclxuICAgICdDaGFtb2lzJyxcclxuICAgICdDaGVldGFoJyxcclxuICAgICdDaGlja2VuJyxcclxuICAgICdDaGltcGFuemVlJyxcclxuICAgICdDaGluY2hpbGxhJyxcclxuICAgICdDaG91Z2gnLFxyXG4gICAgJ0NsYW0nLFxyXG4gICAgJ0NvYnJhJyxcclxuICAgICdDb2Nrcm9hY2gnLFxyXG4gICAgJ0NvZCcsXHJcbiAgICAnQ29ybW9yYW50JyxcclxuICAgICdDb3lvdGUnLFxyXG4gICAgJ0NyYWInLFxyXG4gICAgJ0NyYW5lJyxcclxuICAgICdDcm9jb2RpbGUnLFxyXG4gICAgJ0Nyb3cnLFxyXG4gICAgJ0N1cmxldycsXHJcbiAgICAnRGVlcicsXHJcbiAgICAnRGlub3NhdXInLFxyXG4gICAgJ0RvZycsXHJcbiAgICAnRG9nZmlzaCcsXHJcbiAgICAnRG9scGhpbicsXHJcbiAgICAnRG9ua2V5JyxcclxuICAgICdEb3R0ZXJlbCcsXHJcbiAgICAnRG92ZScsXHJcbiAgICAnRHJhZ29uZmx5JyxcclxuICAgICdEdWNrJyxcclxuICAgICdEdWdvbmcnLFxyXG4gICAgJ0R1bmxpbicsXHJcbiAgICAnRWFnbGUnLFxyXG4gICAgJ0VjaGlkbmEnLFxyXG4gICAgJ0VlbCcsXHJcbiAgICAnRWxhbmQnLFxyXG4gICAgJ0VsZXBoYW50JyxcclxuICAgICdFbGVwaGFudCBzZWFsJyxcclxuICAgICdFbGsnLFxyXG4gICAgJ0VtdScsXHJcbiAgICAnRmFsY29uJyxcclxuICAgICdGZXJyZXQnLFxyXG4gICAgJ0ZpbmNoJyxcclxuICAgICdGaXNoJyxcclxuICAgICdGbGFtaW5nbycsXHJcbiAgICAnRmx5JyxcclxuICAgICdGb3gnLFxyXG4gICAgJ0Zyb2cnLFxyXG4gICAgJ0dhdXInLFxyXG4gICAgJ0dhemVsbGUnLFxyXG4gICAgJ0dlcmJpbCcsXHJcbiAgICAnR2lhbnQgUGFuZGEnLFxyXG4gICAgJ0dpcmFmZmUnLFxyXG4gICAgJ0duYXQnLFxyXG4gICAgJ0dudScsXHJcbiAgICAnR29hdCcsXHJcbiAgICAnR29vc2UnLFxyXG4gICAgJ0dvbGRmaW5jaCcsXHJcbiAgICAnR29sZGZpc2gnLFxyXG4gICAgJ0dvcmlsbGEnLFxyXG4gICAgJ0dvc2hhd2snLFxyXG4gICAgJ0dyYXNzaG9wcGVyJyxcclxuICAgICdHcm91c2UnLFxyXG4gICAgJ0d1YW5hY28nLFxyXG4gICAgJ0d1aW5lYSBmb3dsJyxcclxuICAgICdHdWluZWEgcGlnJyxcclxuICAgICdHdWxsJyxcclxuICAgICdIYXJlJyxcclxuICAgICdIYXdrJyxcclxuICAgICdIZWRnZWhvZycsXHJcbiAgICAnSGVyb24nLFxyXG4gICAgJ0hlcnJpbmcnLFxyXG4gICAgJ0hpcHBvcG90YW11cycsXHJcbiAgICAnSG9ybmV0JyxcclxuICAgICdIb3JzZScsXHJcbiAgICAnSHVtYW4nLFxyXG4gICAgJ0h1bW1pbmdiaXJkJyxcclxuICAgICdIeWVuYScsXHJcbiAgICAnSWJleCcsXHJcbiAgICAnSWJpcycsXHJcbiAgICAnSmFja2FsJyxcclxuICAgICdKYWd1YXInLFxyXG4gICAgJ0pheScsXHJcbiAgICAnSmVsbHlmaXNoJyxcclxuICAgICdLYW5nYXJvbycsXHJcbiAgICAnS2luZ2Zpc2hlcicsXHJcbiAgICAnS29hbGEnLFxyXG4gICAgJ0tvbW9kbyBkcmFnb24nLFxyXG4gICAgJ0tvb2thYnVyYScsXHJcbiAgICAnS291cHJleScsXHJcbiAgICAnS3VkdScsXHJcbiAgICAnTGFwd2luZycsXHJcbiAgICAnTGFyaycsXHJcbiAgICAnTGVtdXInLFxyXG4gICAgJ0xlb3BhcmQnLFxyXG4gICAgJ0xpb24nLFxyXG4gICAgJ0xsYW1hJyxcclxuICAgICdMb2JzdGVyJyxcclxuICAgICdMb2N1c3QnLFxyXG4gICAgJ0xvcmlzJyxcclxuICAgICdMb3VzZScsXHJcbiAgICAnTHlyZWJpcmQnLFxyXG4gICAgJ01hZ3BpZScsXHJcbiAgICAnTWFsbGFyZCcsXHJcbiAgICAnTWFuYXRlZScsXHJcbiAgICAnTWFuZHJpbGwnLFxyXG4gICAgJ01hbnRpcycsXHJcbiAgICAnTWFydGVuJyxcclxuICAgICdNZWVya2F0JyxcclxuICAgICdNaW5rJyxcclxuICAgICdNb2xlJyxcclxuICAgICdNb25nb29zZScsXHJcbiAgICAnTW9ua2V5JyxcclxuICAgICdNb29zZScsXHJcbiAgICAnTW91c2UnLFxyXG4gICAgJ01vc3F1aXRvJyxcclxuICAgICdNdWxlJyxcclxuICAgICdOYXJ3aGFsJyxcclxuICAgICdOZXd0JyxcclxuICAgICdOaWdodGluZ2FsZScsXHJcbiAgICAnT2N0b3B1cycsXHJcbiAgICAnT2thcGknLFxyXG4gICAgJ09wb3NzdW0nLFxyXG4gICAgJ09yeXgnLFxyXG4gICAgJ09zdHJpY2gnLFxyXG4gICAgJ090dGVyJyxcclxuICAgICdPd2wnLFxyXG4gICAgJ094JyxcclxuICAgICdPeXN0ZXInLFxyXG4gICAgJ1BhcnJvdCcsXHJcbiAgICAnUGFydHJpZGdlJyxcclxuICAgICdQZWFmb3dsJyxcclxuICAgICdQZWxpY2FuJyxcclxuICAgICdQZW5ndWluJyxcclxuICAgICdQaGVhc2FudCcsXHJcbiAgICAnUGlnJyxcclxuICAgICdQaWdlb24nLFxyXG4gICAgJ1BvbGFyIEJlYXInLFxyXG4gICAgJ1BvbnktIFNlZSBIb3JzZScsXHJcbiAgICAnUG9yY3VwaW5lJyxcclxuICAgICdQb3Jwb2lzZScsXHJcbiAgICAnUHJhaXJpZSBEb2cnLFxyXG4gICAgJ1F1YWlsJyxcclxuICAgICdRdWVsZWEnLFxyXG4gICAgJ1F1ZXR6YWwnLFxyXG4gICAgJ1JhYmJpdCcsXHJcbiAgICAnUmFjY29vbicsXHJcbiAgICAnUmFpbCcsXHJcbiAgICAnUmFtJyxcclxuICAgICdSYXQnLFxyXG4gICAgJ1JhdmVuJyxcclxuICAgICdSZWQgZGVlcicsXHJcbiAgICAnUmVkIHBhbmRhJyxcclxuICAgICdSZWluZGVlcicsXHJcbiAgICAnUmhpbm9jZXJvcycsXHJcbiAgICAnUm9vaycsXHJcbiAgICAnU2FsYW1hbmRlcicsXHJcbiAgICAnU2FsbW9uJyxcclxuICAgICdTYW5kIERvbGxhcicsXHJcbiAgICAnU2FuZHBpcGVyJyxcclxuICAgICdTYXJkaW5lJyxcclxuICAgICdTY29ycGlvbicsXHJcbiAgICAnU2VhIGxpb24nLFxyXG4gICAgJ1NlYSBVcmNoaW4nLFxyXG4gICAgJ1NlYWhvcnNlJyxcclxuICAgICdTZWFsJyxcclxuICAgICdTaGFyaycsXHJcbiAgICAnU2hlZXAnLFxyXG4gICAgJ1NocmV3JyxcclxuICAgICdTa3VuaycsXHJcbiAgICAnU25haWwnLFxyXG4gICAgJ1NuYWtlJyxcclxuICAgICdTcGFycm93JyxcclxuICAgICdTcGlkZXInLFxyXG4gICAgJ1Nwb29uYmlsbCcsXHJcbiAgICAnU3F1aWQnLFxyXG4gICAgJ1NxdWlycmVsJyxcclxuICAgICdTdGFybGluZycsXHJcbiAgICAnU3RpbmdyYXknLFxyXG4gICAgJ1N0aW5rYnVnJyxcclxuICAgICdTdG9yaycsXHJcbiAgICAnU3dhbGxvdycsXHJcbiAgICAnU3dhbicsXHJcbiAgICAnVGFwaXInLFxyXG4gICAgJ1RhcnNpZXInLFxyXG4gICAgJ1Rlcm1pdGUnLFxyXG4gICAgJ1RpZ2VyJyxcclxuICAgICdUb2FkJyxcclxuICAgICdUcm91dCcsXHJcbiAgICAnVHVya2V5JyxcclxuICAgICdUdXJ0bGUnLFxyXG4gICAgJ1ZpcGVyJyxcclxuICAgICdWdWx0dXJlJyxcclxuICAgICdXYWxsYWJ5JyxcclxuICAgICdXYWxydXMnLFxyXG4gICAgJ1dhc3AnLFxyXG4gICAgJ1dhdGVyIGJ1ZmZhbG8nLFxyXG4gICAgJ1dlYXNlbCcsXHJcbiAgICAnV2hhbGUnLFxyXG4gICAgJ1dvbGYnLFxyXG4gICAgJ1dvbHZlcmluZScsXHJcbiAgICAnV29tYmF0JyxcclxuICAgICdXb29kY29jaycsXHJcbiAgICAnV29vZHBlY2tlcicsXHJcbiAgICAnV29ybScsXHJcbiAgICAnV3JlbicsXHJcbiAgICAnWWFrJyxcclxuICAgICdaZWJyYScsXHJcbl07XHJcblxyXG5cclxuXHJcbmRhdGEuY29sb3JzID0gWydBY2lkIEdyZWVuJyxcclxuICAgICdBZXJvJyxcclxuICAgICdBZXJvIEJsdWUnLFxyXG4gICAgJ0FmcmljYW4gVmlvbGV0JyxcclxuICAgICdBbGFiYW1hIENyaW1zb24nLFxyXG4gICAgJ0FsaWNlIEJsdWUnLFxyXG4gICAgJ0FsaXphcmluIENyaW1zb24nLFxyXG4gICAgJ0FsbG95IE9yYW5nZScsXHJcbiAgICAnQWxtb25kJyxcclxuICAgICdBbWFyYW50aCcsXHJcbiAgICAnQW1hcmFudGggUGluaycsXHJcbiAgICAnQW1hcmFudGggUHVycGxlJyxcclxuICAgICdBbWF6b24nLFxyXG4gICAgJ0FtYmVyJyxcclxuICAgICdBbWVyaWNhbiBSb3NlJyxcclxuICAgICdBbWV0aHlzdCcsXHJcbiAgICAnQW5kcm9pZCBHcmVlbicsXHJcbiAgICAnQW50aS1GbGFzaCBXaGl0ZScsXHJcbiAgICAnQW50aXF1ZSBCcmFzcycsXHJcbiAgICAnQW50aXF1ZSBCcm9uemUnLFxyXG4gICAgJ0FudGlxdWUgRnVjaHNpYScsXHJcbiAgICAnQW50aXF1ZSBSdWJ5JyxcclxuICAgICdBbnRpcXVlIFdoaXRlJyxcclxuICAgICdBcHBsZSBHcmVlbicsXHJcbiAgICAnQXByaWNvdCcsXHJcbiAgICAnQXF1YScsXHJcbiAgICAnQXF1YW1hcmluZScsXHJcbiAgICAnQXJteSBHcmVlbicsXHJcbiAgICAnQXJzZW5pYycsXHJcbiAgICAnQXJ0aWNob2tlJyxcclxuICAgICdBcnlsaWRlIFllbGxvdycsXHJcbiAgICAnQXNoIEdyZXknLFxyXG4gICAgJ0FzcGFyYWd1cycsXHJcbiAgICAnQXRvbWljIFRhbmdlcmluZScsXHJcbiAgICAnQXVyZW9saW4nLFxyXG4gICAgJ0F1cm9NZXRhbFNhdXJ1cycsXHJcbiAgICAnQXZvY2FkbycsXHJcbiAgICAnQXp1cmUnLFxyXG4gICAgJ0F6dXJlIE1pc3QnLFxyXG4gICAgJ0RhenpsZWQgQmx1ZScsXHJcbiAgICAnQmFieSBCbHVlJyxcclxuICAgICdCYWJ5IEJsdWUgRXllcycsXHJcbiAgICAnQmFieSBQaW5rJyxcclxuICAgICdCYWJ5IFBvd2RlcicsXHJcbiAgICAnQmFrZXItTWlsbGVyIFBpbmsnLFxyXG4gICAgJ0JhbGwgQmx1ZScsXHJcbiAgICAnQmFuYW5hIE1hbmlhJyxcclxuICAgICdCYW5hbmEgWWVsbG93JyxcclxuICAgICdCYW5nbGFkZXNoIEdyZWVuJyxcclxuICAgICdCYXJiaWUgUGluaycsXHJcbiAgICAnQmFybiBSZWQnLFxyXG4gICAgJ0JhdHRsZXNoaXAgR3JleScsXHJcbiAgICAnQmF6YWFyJyxcclxuICAgICdCZWF1IEJsdWUnLFxyXG4gICAgJ0JlYXZlcicsXHJcbiAgICAnQmVpZ2UnLFxyXG4gICAgJ0Jpc3F1ZScsXHJcbiAgICAnQml0dGVyIExlbW9uJyxcclxuICAgICdCaXR0ZXIgTGltZScsXHJcbiAgICAnQml0dGVyc3dlZXQnLFxyXG4gICAgJ0JpdHRlcnN3ZWV0IFNoaW1tZXInLFxyXG4gICAgJ0JsYWNrJyxcclxuICAgICdCbGFjayBCZWFuJyxcclxuICAgICdCbGFjayBMZWF0aGVyIEphY2tldCcsXHJcbiAgICAnQmxhY2sgT2xpdmUnLFxyXG4gICAgJ0JsYW5jaGVkIEFsbW9uZCcsXHJcbiAgICAnQmxhc3QtT2ZmIEJyb256ZScsXHJcbiAgICAnQmxldSBEZSBGcmFuY2UnLFxyXG4gICAgJ0JsaXp6YXJkIEJsdWUnLFxyXG4gICAgJ0Jsb25kJyxcclxuICAgICdCbHVlJyxcclxuICAgICdCbHVlIEJlbGwnLFxyXG4gICAgJ0JsdWUgU2FwcGhpcmUnLFxyXG4gICAgJ0JsdWUgWW9uZGVyJyxcclxuICAgICdCbHVlLUdyYXknLFxyXG4gICAgJ0JsdWUtR3JlZW4nLFxyXG4gICAgJ0JsdWUtVmlvbGV0JyxcclxuICAgICdCbHVlYmVycnknLFxyXG4gICAgJ0JsdWVib25uZXQnLFxyXG4gICAgJ0JsdXNoJyxcclxuICAgICdCb2xlJyxcclxuICAgICdCb25kaSBCbHVlJyxcclxuICAgICdCb25lJyxcclxuICAgICdCb3N0b24gVW5pdmVyc2l0eSBSZWQnLFxyXG4gICAgJ0JvdHRsZSBHcmVlbicsXHJcbiAgICAnQm95c2VuYmVycnknLFxyXG4gICAgJ0JyYW5kZWlzIEJsdWUnLFxyXG4gICAgJ0JyYXNzJyxcclxuICAgICdCcmljayBSZWQnLFxyXG4gICAgJ0JyaWdodCBDZXJ1bGVhbicsXHJcbiAgICAnQnJpZ2h0IEdyZWVuJyxcclxuICAgICdCcmlnaHQgTGF2ZW5kZXInLFxyXG4gICAgJ0JyaWdodCBMaWxhYycsXHJcbiAgICAnQnJpZ2h0IE1hcm9vbicsXHJcbiAgICAnQnJpZ2h0IE5hdnkgQmx1ZScsXHJcbiAgICAnQnJpZ2h0IFBpbmsnLFxyXG4gICAgJ0JyaWdodCBUdXJxdW9pc2UnLFxyXG4gICAgJ0JyaWdodCBVYmUnLFxyXG4gICAgJ0JyaWxsaWFudCBMYXZlbmRlcicsXHJcbiAgICAnQnJpbGxpYW50IFJvc2UnLFxyXG4gICAgJ0JyaW5rIFBpbmsnLFxyXG4gICAgJ0JyaXRpc2ggUmFjaW5nIEdyZWVuJyxcclxuICAgICdCcm9uemUnLFxyXG4gICAgJ0Jyb256ZSBZZWxsb3cnLFxyXG4gICAgJ0Jyb3duLU5vc2UnLFxyXG4gICAgJ0JydW5zd2ljayBHcmVlbicsXHJcbiAgICAnQnViYmxlIEd1bScsXHJcbiAgICAnQnViYmxlcycsXHJcbiAgICAnQnVkIEdyZWVuJyxcclxuICAgICdCdWZmJyxcclxuICAgICdCdWxnYXJpYW4gUm9zZScsXHJcbiAgICAnQnVyZ3VuZHknLFxyXG4gICAgJ0J1cmx5d29vZCcsXHJcbiAgICAnQnVybnQgT3JhbmdlJyxcclxuICAgICdCdXJudCBTaWVubmEnLFxyXG4gICAgJ0J1cm50IFVtYmVyJyxcclxuICAgICdCeXphbnRpbmUnLFxyXG4gICAgJ0J5emFudGl1bScsXHJcbiAgICAnQ2FkZXQnLFxyXG4gICAgJ0NhZGV0IEJsdWUnLFxyXG4gICAgJ0NhZGV0IEdyZXknLFxyXG4gICAgJ0NhZG1pdW0gR3JlZW4nLFxyXG4gICAgJ0NhZG1pdW0gT3JhbmdlJyxcclxuICAgICdDYWRtaXVtIFJlZCcsXHJcbiAgICAnQ2FkbWl1bSBZZWxsb3cnLFxyXG4gICAgJ0NhZsOpIEF1IExhaXQnLFxyXG4gICAgJ0NhZsOpIE5vaXInLFxyXG4gICAgJ0NhbCBQb2x5IFBvbW9uYSBHcmVlbicsXHJcbiAgICAnQ2FtYnJpZGdlIEJsdWUnLFxyXG4gICAgJ0NhbWVsJyxcclxuICAgICdDYW1lbyBQaW5rJyxcclxuICAgICdDYW1vdWZsYWdlIEdyZWVuJyxcclxuICAgICdDYW5hcnkgWWVsbG93JyxcclxuICAgICdDYW5keSBBcHBsZSBSZWQnLFxyXG4gICAgJ0NhbmR5IFBpbmsnLFxyXG4gICAgJ0NhcHJpJyxcclxuICAgICdDYXB1dCBNb3J0dXVtJyxcclxuICAgICdDYXJkaW5hbCcsXHJcbiAgICAnQ2FyaWJiZWFuIEdyZWVuJyxcclxuICAgICdDYXJtaW5lJyxcclxuICAgICdDYXJtaW5lIFBpbmsnLFxyXG4gICAgJ0Nhcm1pbmUgUmVkJyxcclxuICAgICdDYXJuYXRpb24gUGluaycsXHJcbiAgICAnQ2FybmVsaWFuJyxcclxuICAgICdDYXJvbGluYSBCbHVlJyxcclxuICAgICdDYXJyb3QgT3JhbmdlJyxcclxuICAgICdDYXN0bGV0b24gR3JlZW4nLFxyXG4gICAgJ0NhdGFsaW5hIEJsdWUnLFxyXG4gICAgJ0NhdGF3YmEnLFxyXG4gICAgJ0NlZGFyIENoZXN0JyxcclxuICAgICdDZWlsJyxcclxuICAgICdDZWxhZG9uJyxcclxuICAgICdDZWxhZG9uIEJsdWUnLFxyXG4gICAgJ0NlbGFkb24gR3JlZW4nLFxyXG4gICAgJ0NlbGVzdGUnLFxyXG4gICAgJ0NlbGVzdGlhbCBCbHVlJyxcclxuICAgICdDZXJpc2UnLFxyXG4gICAgJ0NlcmlzZSBQaW5rJyxcclxuICAgICdDZXJ1bGVhbicsXHJcbiAgICAnQ2VydWxlYW4gQmx1ZScsXHJcbiAgICAnQ2VydWxlYW4gRnJvc3QnLFxyXG4gICAgJ0NHIEJsdWUnLFxyXG4gICAgJ0NHIFJlZCcsXHJcbiAgICAnQ2hhbW9pc2VlJyxcclxuICAgICdDaGFtcGFnbmUnLFxyXG4gICAgJ0NoYXJjb2FsJyxcclxuICAgICdDaGFybGVzdG9uIEdyZWVuJyxcclxuICAgICdDaGFybSBQaW5rJyxcclxuICAgICdDaGVycnknLFxyXG4gICAgJ0NoZXJyeSBCbG9zc29tIFBpbmsnLFxyXG4gICAgJ0NoZXN0bnV0JyxcclxuICAgICdDaGluYSBQaW5rJyxcclxuICAgICdDaGluYSBSb3NlJyxcclxuICAgICdDaGluZXNlIFJlZCcsXHJcbiAgICAnQ2hpbmVzZSBWaW9sZXQnLFxyXG4gICAgJ0Nocm9tZSBZZWxsb3cnLFxyXG4gICAgJ0NpbmVyZW91cycsXHJcbiAgICAnQ2lubmFiYXInLFxyXG4gICAgJ0Npbm5hbW9uW0NpdGF0aW9uIE5lZWRlZF0nLFxyXG4gICAgJ0NpdHJpbmUnLFxyXG4gICAgJ0NpdHJvbicsXHJcbiAgICAnQ2xhcmV0JyxcclxuICAgICdDbGFzc2ljIFJvc2UnLFxyXG4gICAgJ0NvYmFsdCcsXHJcbiAgICAnQ29jb2EgQnJvd24nLFxyXG4gICAgJ0NvY29udXQnLFxyXG4gICAgJ0NvZmZlZScsXHJcbiAgICAnQ29sdW1iaWEgQmx1ZScsXHJcbiAgICAnQ29uZ28gUGluaycsXHJcbiAgICAnQ29vbCBCbGFjaycsXHJcbiAgICAnQ29vbCBHcmV5JyxcclxuICAgICdDb3BwZXInLFxyXG4gICAgJ0NvcHBlciBQZW5ueScsXHJcbiAgICAnQ29wcGVyIFJlZCcsXHJcbiAgICAnQ29wcGVyIFJvc2UnLFxyXG4gICAgJ0NvcXVlbGljb3QnLFxyXG4gICAgJ0NvcmFsJyxcclxuICAgICdDb3JhbCBQaW5rJyxcclxuICAgICdDb3JhbCBSZWQnLFxyXG4gICAgJ0NvcmRvdmFuJyxcclxuICAgICdDb3JuJyxcclxuICAgICdDb3JuZWxsIFJlZCcsXHJcbiAgICAnQ29ybmZsb3dlciBCbHVlJyxcclxuICAgICdDb3Juc2lsaycsXHJcbiAgICAnQ29zbWljIExhdHRlJyxcclxuICAgICdDb3R0b24gQ2FuZHknLFxyXG4gICAgJ0NyZWFtJyxcclxuICAgICdDcmltc29uJyxcclxuICAgICdDcmltc29uIEdsb3J5JyxcclxuICAgICdDeWFuJyxcclxuICAgICdDeWJlciBHcmFwZScsXHJcbiAgICAnQ3liZXIgWWVsbG93JyxcclxuICAgICdEYWZmb2RpbCcsXHJcbiAgICAnRGFuZGVsaW9uJyxcclxuICAgICdEYXJrIEJsdWUnLFxyXG4gICAgJ0RhcmsgQmx1ZS1HcmF5JyxcclxuICAgICdEYXJrIEJyb3duJyxcclxuICAgICdEYXJrIEJ5emFudGl1bScsXHJcbiAgICAnRGFyayBDYW5keSBBcHBsZSBSZWQnLFxyXG4gICAgJ0RhcmsgQ2VydWxlYW4nLFxyXG4gICAgJ0RhcmsgQ2hlc3RudXQnLFxyXG4gICAgJ0RhcmsgQ29yYWwnLFxyXG4gICAgJ0RhcmsgQ3lhbicsXHJcbiAgICAnRGFyayBFbGVjdHJpYyBCbHVlJyxcclxuICAgICdEYXJrIEdvbGRlbnJvZCcsXHJcbiAgICAnRGFyayBHcmVlbicsXHJcbiAgICAnRGFyayBJbXBlcmlhbCBCbHVlJyxcclxuICAgICdEYXJrIEp1bmdsZSBHcmVlbicsXHJcbiAgICAnRGFyayBLaGFraScsXHJcbiAgICAnRGFyayBMYXZhJyxcclxuICAgICdEYXJrIExhdmVuZGVyJyxcclxuICAgICdEYXJrIExpdmVyJyxcclxuICAgICdEYXJrIE1hZ2VudGEnLFxyXG4gICAgJ0RhcmsgTWVkaXVtIEdyYXknLFxyXG4gICAgJ0RhcmsgTWlkbmlnaHQgQmx1ZScsXHJcbiAgICAnRGFyayBNb3NzIEdyZWVuJyxcclxuICAgICdEYXJrIE9saXZlIEdyZWVuJyxcclxuICAgICdEYXJrIE9yYW5nZScsXHJcbiAgICAnRGFyayBPcmNoaWQnLFxyXG4gICAgJ0RhcmsgUGFzdGVsIEJsdWUnLFxyXG4gICAgJ0RhcmsgUGFzdGVsIEdyZWVuJyxcclxuICAgICdEYXJrIFBhc3RlbCBQdXJwbGUnLFxyXG4gICAgJ0RhcmsgUGFzdGVsIFJlZCcsXHJcbiAgICAnRGFyayBQaW5rJyxcclxuICAgICdEYXJrIFBvd2RlciBCbHVlJyxcclxuICAgICdEYXJrIFB1Y2UnLFxyXG4gICAgJ0RhcmsgUmFzcGJlcnJ5JyxcclxuICAgICdEYXJrIFJlZCcsXHJcbiAgICAnRGFyayBTYWxtb24nLFxyXG4gICAgJ0RhcmsgU2NhcmxldCcsXHJcbiAgICAnRGFyayBTZWEgR3JlZW4nLFxyXG4gICAgJ0RhcmsgU2llbm5hJyxcclxuICAgICdEYXJrIFNreSBCbHVlJyxcclxuICAgICdEYXJrIFNsYXRlIEJsdWUnLFxyXG4gICAgJ0RhcmsgU2xhdGUgR3JheScsXHJcbiAgICAnRGFyayBTcHJpbmcgR3JlZW4nLFxyXG4gICAgJ0RhcmsgVGFuJyxcclxuICAgICdEYXJrIFRhbmdlcmluZScsXHJcbiAgICAnRGFyayBUYXVwZScsXHJcbiAgICAnRGFyayBUZXJyYSBDb3R0YScsXHJcbiAgICAnRGFyayBUdXJxdW9pc2UnLFxyXG4gICAgJ0RhcmsgVmFuaWxsYScsXHJcbiAgICAnRGFyayBWaW9sZXQnLFxyXG4gICAgJ0RhcmsgWWVsbG93JyxcclxuICAgICdEYXJ0bW91dGggR3JlZW4nLFxyXG4gICAgJ0RlYmlhbiBSZWQnLFxyXG4gICAgJ0RlZXAgQ2FybWluZScsXHJcbiAgICAnRGVlcCBDYXJtaW5lIFBpbmsnLFxyXG4gICAgJ0RlZXAgQ2Fycm90IE9yYW5nZScsXHJcbiAgICAnRGVlcCBDZXJpc2UnLFxyXG4gICAgJ0RlZXAgQ2hhbXBhZ25lJyxcclxuICAgICdEZWVwIENoZXN0bnV0JyxcclxuICAgICdEZWVwIENvZmZlZScsXHJcbiAgICAnRGVlcCBGdWNoc2lhJyxcclxuICAgICdEZWVwIEp1bmdsZSBHcmVlbicsXHJcbiAgICAnRGVlcCBMZW1vbicsXHJcbiAgICAnRGVlcCBMaWxhYycsXHJcbiAgICAnRGVlcCBNYWdlbnRhJyxcclxuICAgICdEZWVwIE1hdXZlJyxcclxuICAgICdEZWVwIE1vc3MgR3JlZW4nLFxyXG4gICAgJ0RlZXAgUGVhY2gnLFxyXG4gICAgJ0RlZXAgUGluaycsXHJcbiAgICAnRGVlcCBQdWNlJyxcclxuICAgICdEZWVwIFJ1YnknLFxyXG4gICAgJ0RlZXAgU2FmZnJvbicsXHJcbiAgICAnRGVlcCBTa3kgQmx1ZScsXHJcbiAgICAnRGVlcCBTcGFjZSBTcGFya2xlJyxcclxuICAgICdEZWVwIFRhdXBlJyxcclxuICAgICdEZWVwIFR1c2NhbiBSZWQnLFxyXG4gICAgJ0RlZXInLFxyXG4gICAgJ0RlbmltJyxcclxuICAgICdEZXNlcnQnLFxyXG4gICAgJ0Rlc2VydCBTYW5kJyxcclxuICAgICdEZXNpcmUnLFxyXG4gICAgJ0RpYW1vbmQnLFxyXG4gICAgJ0RpbSBHcmF5JyxcclxuICAgICdEaXJ0JyxcclxuICAgICdEb2RnZXIgQmx1ZScsXHJcbiAgICAnRG9nd29vZCBSb3NlJyxcclxuICAgICdEb2xsYXIgQmlsbCcsXHJcbiAgICAnRG9ua2V5IEJyb3duJyxcclxuICAgICdEcmFiJyxcclxuICAgICdEdWtlIEJsdWUnLFxyXG4gICAgJ0R1c3QgU3Rvcm0nLFxyXG4gICAgJ0R1dGNoIFdoaXRlJyxcclxuICAgICdFYXJ0aCBZZWxsb3cnLFxyXG4gICAgJ0Vib255JyxcclxuICAgICdFY3J1JyxcclxuICAgICdFZXJpZSBCbGFjaycsXHJcbiAgICAnRWdncGxhbnQnLFxyXG4gICAgJ0VnZ3NoZWxsJyxcclxuICAgICdFZ3lwdGlhbiBCbHVlJyxcclxuICAgICdFbGVjdHJpYyBCbHVlJyxcclxuICAgICdFbGVjdHJpYyBDcmltc29uJyxcclxuICAgICdFbGVjdHJpYyBDeWFuJyxcclxuICAgICdFbGVjdHJpYyBHcmVlbicsXHJcbiAgICAnRWxlY3RyaWMgSW5kaWdvJyxcclxuICAgICdFbGVjdHJpYyBMYXZlbmRlcicsXHJcbiAgICAnRWxlY3RyaWMgTGltZScsXHJcbiAgICAnRWxlY3RyaWMgUHVycGxlJyxcclxuICAgICdFbGVjdHJpYyBVbHRyYW1hcmluZScsXHJcbiAgICAnRWxlY3RyaWMgVmlvbGV0JyxcclxuICAgICdFbGVjdHJpYyBZZWxsb3cnLFxyXG4gICAgJ0VtZXJhbGQnLFxyXG4gICAgJ0VtaW5lbmNlJyxcclxuICAgICdFbmdsaXNoIEdyZWVuJyxcclxuICAgICdFbmdsaXNoIExhdmVuZGVyJyxcclxuICAgICdFbmdsaXNoIFJlZCcsXHJcbiAgICAnRW5nbGlzaCBWaW9sZXQnLFxyXG4gICAgJ0V0b24gQmx1ZScsXHJcbiAgICAnRXVjYWx5cHR1cycsXHJcbiAgICAnRmFsbG93JyxcclxuICAgICdGYWx1IFJlZCcsXHJcbiAgICAnRmFuZGFuZ28nLFxyXG4gICAgJ0ZhbmRhbmdvIFBpbmsnLFxyXG4gICAgJ0Zhc2hpb24gRnVjaHNpYScsXHJcbiAgICAnRmF3bicsXHJcbiAgICAnRmVsZGdyYXUnLFxyXG4gICAgJ0ZlbGRzcGFyJyxcclxuICAgICdGZXJuIEdyZWVuJyxcclxuICAgICdGZXJyYXJpIFJlZCcsXHJcbiAgICAnRmllbGQgRHJhYicsXHJcbiAgICAnRmlyZSBFbmdpbmUgUmVkJyxcclxuICAgICdGaXJlYnJpY2snLFxyXG4gICAgJ0ZsYW1lJyxcclxuICAgICdGbGFtaW5nbyBQaW5rJyxcclxuICAgICdGbGF0dGVyeScsXHJcbiAgICAnRmxhdmVzY2VudCcsXHJcbiAgICAnRmxheCcsXHJcbiAgICAnRmxpcnQnLFxyXG4gICAgJ0Zsb3JhbCBXaGl0ZScsXHJcbiAgICAnRmx1b3Jlc2NlbnQgT3JhbmdlJyxcclxuICAgICdGbHVvcmVzY2VudCBQaW5rJyxcclxuICAgICdGbHVvcmVzY2VudCBZZWxsb3cnLFxyXG4gICAgJ0ZvbGx5JyxcclxuICAgICdGcmVuY2ggQmVpZ2UnLFxyXG4gICAgJ0ZyZW5jaCBCaXN0cmUnLFxyXG4gICAgJ0ZyZW5jaCBCbHVlJyxcclxuICAgICdGcmVuY2ggRnVjaHNpYScsXHJcbiAgICAnRnJlbmNoIExpbGFjJyxcclxuICAgICdGcmVuY2ggTGltZScsXHJcbiAgICAnRnJlbmNoIE1hdXZlJyxcclxuICAgICdGcmVuY2ggUGluaycsXHJcbiAgICAnRnJlbmNoIFBsdW0nLFxyXG4gICAgJ0ZyZW5jaCBQdWNlJyxcclxuICAgICdGcmVuY2ggUmFzcGJlcnJ5JyxcclxuICAgICdGcmVuY2ggUm9zZScsXHJcbiAgICAnRnJlbmNoIFNreSBCbHVlJyxcclxuICAgICdGcmVuY2ggVmlvbGV0JyxcclxuICAgICdGcmVuY2ggV2luZScsXHJcbiAgICAnRnJlc2ggQWlyJyxcclxuICAgICdGdWNoc2lhJyxcclxuICAgICdGdWNoc2lhIFBpbmsnLFxyXG4gICAgJ0Z1Y2hzaWEgUHVycGxlJyxcclxuICAgICdGdWNoc2lhIFJvc2UnLFxyXG4gICAgJ0Z1bHZvdXMnLFxyXG4gICAgJ0Z1enp5IFd1enp5JyxcclxuXTtcclxuXHJcbmZ1bmN0aW9uIHJhbmRvbShsaXN0KXtcclxuICAgIHJldHVybiBsaXN0W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpsaXN0Lmxlbmd0aCldO1xyXG59XHJcblxyXG5leHBvcnRzLmNvbG9yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHJhbmRvbShkYXRhLmNvbG9ycyk7XHJcbn07XHJcblxyXG5leHBvcnRzLmFuaW1hbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiByYW5kb20oZGF0YS5hbmltYWxzKTtcclxufTtcclxuXHJcbmV4cG9ydHMuY29sb3JBbmltYWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jb2xvcigpICsgXCIgXCIgKyB0aGlzLmFuaW1hbCgpO1xyXG59OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxuXHJcbnZhciBBcHBsaWNhdGlvbiA9IHJlcXVpcmUoJy4vYXBwbGljYXRpb24nKTtcclxudmFyIFJlc3VsdFJlbmRlcmVyID0gcmVxdWlyZSgnLi9yZXN1bHQtcmVuZGVyZXInKTtcclxudmFyIFdpZkVkaXRvciA9IHJlcXVpcmUoJy4vd2lmLWVkaXRvcicpO1xyXG52YXIgV2lmTGlzdCA9IHJlcXVpcmUoJy4vd2lmLWxpc3QnKTtcclxudmFyIEljb24gPSByZXF1aXJlKCcuL2Jvb3RzdHJhcC9pY29uJyk7XHJcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XHJcblxyXG5cclxudmFyIE5hdkJhciA9UmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTmF2QmFyJyxcclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwcm9BY3RpdmUgPSB0aGlzLnByb3BzLnBhZ2UgPT0gJ3Byb2plY3RzJz8nYWN0aXZlJzonJztcclxuICAgICAgICB2YXIgd2lmQWN0aXZlID0gdGhpcy5wcm9wcy5wYWdlID09ICd3aWZzJz8nYWN0aXZlJzonJztcclxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLm5hdigge2NsYXNzTmFtZTpcIm5hdmJhciBuYXZiYXItZGVmYXVsdFwiLCByb2xlOlwibmF2aWdhdGlvblwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb250YWluZXItZmx1aWRcIn0sIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm5hdmJhci1oZWFkZXJcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5hKCB7Y2xhc3NOYW1lOlwibmF2YmFyLWJyYW5kXCIsIGhyZWY6XCIjXCJ9LCBJY29uKCB7aWNvbjpcImZpcmVcIn0pLFxuICAgICAgICAgICAgICAgICAgICBcIiBSYW5kb20gV2VhdmUgU3RyaXBlc1wiKVxyXG4gICAgICAgICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00udWwoIHtjbGFzc05hbWU6XCJuYXYgbmF2YmFyLW5hdlwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmxpKCB7Y2xhc3NOYW1lOnByb0FjdGl2ZX0sIFJlYWN0LkRPTS5hKCB7aHJlZjpcIiNwcm9qZWN0c1wifSwgXCJQcm9qZWN0c1wiKSlcclxuICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00udWwoIHtjbGFzc05hbWU6XCJuYXYgbmF2YmFyLW5hdlwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmxpKCB7Y2xhc3NOYW1lOndpZkFjdGl2ZX0sIFJlYWN0LkRPTS5hKCB7aHJlZjpcIiN3aWZzXCJ9LCBcIldpZnNcIikpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbnZhciBVcGxvYWRGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVXBsb2FkRm9ybScsXHJcbiAgICBvblN1Ym1pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG5cclxuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICAgICAgICAgIGlmKGV2dC50YXJnZXQucmVhZHlTdGF0ZSAhPSAyKSByZXR1cm47XHJcbiAgICAgICAgICAgIGlmKGV2dC50YXJnZXQuZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KCdFcnJvciB3aGlsZSByZWFkaW5nIGZpbGUnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZmlsZWNvbnRlbnQgPSBldnQudGFyZ2V0LnJlc3VsdDtcclxuXHJcbiAgICAgICAgICAgIHZhciBuZXdJZCA9IFwiXCIgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMDAwKTtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKGV2dC50YXJnZXQucmVzdWx0KTtcclxuICAgICAgICAgICAgZGF0YS5uYW1lID0gZGF0YS5uYW1lICsgXCIgW0ltcG9ydGVkXVwiO1xyXG4gICAgICAgICAgICBzdG9yYWdlLnNhdmUobmV3SWQsIGRhdGEpO1xyXG4gICAgICAgICAgICByb3V0aWUocm91dGllLmxvb2t1cCgncHJvamVjdCcsIHtpZDogbmV3SWR9KSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQodGhpcy5yZWZzLmZpbGUuZ2V0RE9NTm9kZSgpLmZpbGVzWzBdKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xpY2tGaWxlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZpbGUuZ2V0RE9NTm9kZSgpLmNsaWNrKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBzdHlsZT17Y29sb3I6J3doaXRlJ307XHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5mb3JtKCB7b25TdWJtaXQ6dGhpcy5vblN1Ym1pdH0sIFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5oNChudWxsLCBcIkltcG9ydCBQcm9qZWN0XCIpLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwiZmlsZVwiLCByZWY6XCJmaWxlXCIsIGNsYXNzTmFtZTpcIndoaXRlLWZpbGVcIiwgc3R5bGU6c3R5bGV9ICksUmVhY3QuRE9NLmJyKG51bGwpLFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIn0sIEljb24oIHtpY29uOlwiZmxvcHB5LW9wZW5cIn0pLCBcIiBJbXBvcnRcIilcclxuICAgICAgICAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG5cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGthandpXzAwMCBvbiAyMDE0LTA0LTA3LlxyXG4gKi9cclxudmFyIFByb2plY3RQaWNrZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQcm9qZWN0UGlja2VyJyxcclxuXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcHJvamVjdHM6IFtdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcm91dGllKCd3aWYgd2lmLzppZCcsIGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwYWdlR3JvdXA6ICd3aWZzJywgcGFnZTogJ3dpZicsIGlkOiBpZH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJvdXRpZSgnd2lmcyB3aWZzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwYWdlR3JvdXA6ICd3aWZzJywgcGFnZTogJ3dpZnMnfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgcm91dGllKCdwcm9qZWN0IHByb2plY3QvOmlkJywgZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3BhZ2VHcm91cDogJ3Byb2plY3RzJywgcGFnZTogJ3Byb2plY3QnLCBpZDogaWR9KTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICByb3V0aWUoJyonLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3BhZ2VHcm91cDogJ3Byb2plY3RzJywgIHBhZ2U6ICdwcm9qZWN0cyd9KTtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VycmVudElkOiBudWxsLCAgcHJvamVjdHM6IHN0b3JhZ2UubGlzdFByb2plY3RzKCl9KTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfSxcclxuXHJcblxyXG5cclxuICAgIGNyZWF0ZU5ldzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBuZXdJZCA9IFwiXCIgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMDAwKTtcclxuICAgICAgICByb3V0aWUocm91dGllLmxvb2t1cCgncHJvamVjdCcsIHtpZDogbmV3SWR9KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwYWdlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5wYWdlID09ICdwcm9qZWN0Jykge1xyXG4gICAgICAgICAgICBwYWdlID0gQXBwbGljYXRpb24oIHtpZDp0aGlzLnN0YXRlLmlkfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5zdGF0ZS5wYWdlID09ICd3aWYnKSB7XHJcbiAgICAgICAgICAgIHBhZ2UgPSBXaWZFZGl0b3IoIHtpZDp0aGlzLnN0YXRlLmlkfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5zdGF0ZS5wYWdlID09ICd3aWZzJykge1xyXG4gICAgICAgICAgICBwYWdlID0gV2lmTGlzdChudWxsKVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBwcm9qZWN0cyA9IHRoaXMuc3RhdGUucHJvamVjdHMuc2xpY2UoKTtcclxuICAgICAgICAgICAgcHJvamVjdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9uZSA9IChiLmxhc3RDaGFuZ2UgfHwgMCkgLSAoYS5sYXN0Q2hhbmdlIHx8IDApIDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZihvbmUgPT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb25lO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBwcm9qZWN0Vmlld3MgPSBwcm9qZWN0cy5tYXAoZnVuY3Rpb24gKHByb2plY3QpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwcmV2aWV3O1xyXG4gICAgICAgICAgICAgICAgaWYocHJvamVjdC5yZXN1bHQpe1xyXG4gICAgICAgICAgICAgICAgICAgIHByZXZpZXcgPSBSZXN1bHRSZW5kZXJlcigge3Jlc3VsdDpwcm9qZWN0LnJlc3VsdCwgaGVpZ2h0OlwiMjBcIn0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG1ha2VMaW5rKGlubmVyKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmEoIHtocmVmOicjJyArIHJvdXRpZS5sb29rdXAoJ3Byb2plY3QnLCB7aWQ6IHByb2plY3QuaWR9KX0sIGlubmVyKVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiAoUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaDQobnVsbCwgbWFrZUxpbmsocHJvamVjdC5uYW1lKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ha2VMaW5rKHByZXZpZXcpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcblxyXG5cclxuXHJcblxyXG4gICAgICAgICAgICBwYWdlID0gUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbnRhaW5lci1mbHVpZFwifSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uaDEoIHtjbGFzc05hbWU6XCJwYWdlLWhlYWRlciBwYWdlLWhlYWRlci1tYWluXCJ9LCBcIlNhdmVkIHByb2plY3RzXCIpLFxyXG4gICAgICAgICAgICAgICAgcHJvamVjdFZpZXdzLFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5hKCB7Y2xhc3NOYW1lOlwiYnRuIGJ0bi1kZWZhdWx0XCIsIG9uQ2xpY2s6dGhpcy5jcmVhdGVOZXd9LCBJY29uKCB7aWNvbjpcInBsdXNcIn0pLCBcIiBOZXcgUHJvamVjdFwiKSxcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnIobnVsbCksUmVhY3QuRE9NLmJyKG51bGwpLFxyXG4gICAgICAgICAgICAgICAgICAgIFVwbG9hZEZvcm0obnVsbClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYobnVsbCwgTmF2QmFyKCB7cGFnZTp0aGlzLnN0YXRlLnBhZ2VHcm91cH0pLHBhZ2UpXHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcm9qZWN0UGlja2VyOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxuXHJcblxyXG52YXIgc3RyaXBlcyA9IHJlcXVpcmUoJy4vc3RyaXBlcycpO1xyXG5cclxuXHJcbnZhciBSZW5kZXJlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1JlbmRlcmVyJyxcclxuICAgIGN0eDogbnVsbCxcclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJQb2ludHModGhpcy5wcm9wcyk7XHJcbiAgICB9LFxyXG5cclxuLy8gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbiAocHJvcHMpIHtcclxuLy8gICAgICAgIHRoaXMucmVuZGVyUG9pbnRzKHByb3BzKTtcclxuLy8gICAgICAgIHJldHVybiBmYWxzZTtcclxuLy8gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcm9wcykge1xyXG4gICAgICAgIHdpbmRvdy5faGFjayA9IHdpbmRvdy5faGFja3x8e307XHJcbiAgICAgICAgd2luZG93Ll9oYWNrLmNhbnZhcyA9IHRoaXMuZ2V0RE9NTm9kZSgpO1xyXG4gICAgICAgIHRoaXMucmVuZGVyUG9pbnRzKHRoaXMucHJvcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXJQb2ludHM6IGZ1bmN0aW9uIChwcm9wcykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBzdHJpcGVzKHByb3BzLmxheWVycywgdGhpcy5wcm9wcy5zaXplLngsIHRoaXMucHJvcHMuYmFja2dyb3VuZENvbG9yKTtcclxuXHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0RE9NTm9kZSgpLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgICAgIHZhciBzaXplPSB0aGlzLnByb3BzLnNpemU7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdncmV5JztcclxuICAgICAgICBjdHguZmlsbFJlY3QoMCwgMCwgc2l6ZS54LCBzaXplLnkpO1xyXG5cclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHJlc3VsdFtpXTtcclxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0KGksIDAsIDEsIHNpemUueSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuLy8gICAgICAgIHJldHVybiA8ZGl2PmhlbGxvPC9kaXY+XHJcbiAgICAgICAgcmV0dXJuICBSZWFjdC5ET00uY2FudmFzKCB7d2lkdGg6dGhpcy5wcm9wcy5zaXplLngsIGhlaWdodDp0aGlzLnByb3BzLnNpemUueX0pXHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXHJcblxyXG5cclxudmFyIHN0cmlwZXMgPSByZXF1aXJlKCcuL3N0cmlwZXMnKTtcclxuXHJcblxyXG52YXIgUmVuZGVyZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdSZW5kZXJlcicsXHJcbiAgICBjdHg6IG51bGwsXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucmVuZGVyUG9pbnRzKHRoaXMucHJvcHMpO1xyXG4gICAgfSxcclxuXHJcbi8vICAgIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24gKHByb3BzKSB7XHJcbi8vICAgICAgICB0aGlzLnJlbmRlclBvaW50cyhwcm9wcyk7XHJcbi8vICAgICAgICByZXR1cm4gZmFsc2U7XHJcbi8vICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAocHJvcHMpIHtcclxuICAgICAgICB0aGlzLnJlbmRlclBvaW50cyh0aGlzLnByb3BzKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyUG9pbnRzOiBmdW5jdGlvbiAocHJvcHMpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gcHJvcHMucmVzdWx0O1xyXG5cclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRET01Ob2RlKCkuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICAgICAgdmFyIHNpemU9IHRoaXMucHJvcHMuc2l6ZTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gJ3BpbmsnO1xyXG4gICAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCByZXN1bHQubGVuZ3RoLCBwcm9wcy5oZWlnaHQpO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gcmVzdWx0W2ldO1xyXG4gICAgICAgICAgICBjdHguZmlsbFJlY3QoaSwgMCwgMSwgcHJvcHMuaGVpZ2h0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICByZXR1cm4gIFJlYWN0LkRPTS5jYW52YXMoIHt3aWR0aDp0aGlzLnByb3BzLnJlc3VsdC5sZW5ndGgsIGhlaWdodDp0aGlzLnByb3BzLmhlaWdodH0pXHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjsiLCJ2YXIgUm5kID0ge307XHJcblxyXG5SbmQuY29sb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgY29sb3IgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxNjc3NzIxNikudG9TdHJpbmcoMTYpO1xyXG4gICAgcmV0dXJuICcjMDAwMDAwJy5zbGljZSgwLCAtY29sb3IubGVuZ3RoKSArIGNvbG9yO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSbmQ7XHJcbiIsInZhciBSbmQgPSByZXF1aXJlKCcuL3JuZCcpO1xyXG52YXIgTmFtZUdlbiA9IHJlcXVpcmUoJy4vbmFtZS1nZW4nKTtcclxudmFyIExheWVyID0gcmVxdWlyZSgnLi9kYXRhL2xheWVyJyk7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vZGF0YS9wb2ludCcpO1xyXG5cclxudmFyIHN0cmlwZXMgPSByZXF1aXJlKCcuL3N0cmlwZXMnKTtcclxuXHJcbnZhciBkdW1teSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbmFtZTogTmFtZUdlbi5jb2xvckFuaW1hbCgpLFxyXG4gICAgICAgIHNpemU6IHtcclxuICAgICAgICAgICAgeDogODAwLFxyXG4gICAgICAgICAgICB5OiAyMDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVkaXRvclNpemU6IDMwMCxcclxuICAgICAgICBzZWxlY3RJbkxheWVyRWRpdG9yOiB0cnVlLFxyXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogUm5kLmNvbG9yKCksXHJcbiAgICAgICAgbGF5ZXJEYXRhOiB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkOjEsXHJcbiAgICAgICAgICAgIGxheWVyczogW1xyXG4gICAgICAgICAgICAgICAgbmV3IExheWVyKFJuZC5jb2xvcigpLCBbXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IFBvaW50KE1hdGgucmFuZG9tKCksIE1hdGgucmFuZG9tKCkpLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBQb2ludChNYXRoLnJhbmRvbSgpLCBNYXRoLnJhbmRvbSgpKSxcclxuICAgICAgICAgICAgICAgICAgICBuZXcgUG9pbnQoTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSlcclxuICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgbmV3IExheWVyKFJuZC5jb2xvcigpLCBbXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IFBvaW50KE1hdGgucmFuZG9tKCksIE1hdGgucmFuZG9tKCkpLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBQb2ludChNYXRoLnJhbmRvbSgpLCBNYXRoLnJhbmRvbSgpKVxyXG4gICAgICAgICAgICAgICAgXSldXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcblxyXG52YXIgcHJvamVjdFByZWZpeCA9IFwicmFuZG9tLXdlYXZlLVwiO1xyXG52YXIgc3RvcmFnZSA9IHtcclxuICAgIHNhdmU6IGZ1bmN0aW9uIChpZCwgZGF0YSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBzdHJpcGVzKGRhdGEubGF5ZXJEYXRhLmxheWVycywgZGF0YS5zaXplLngsIGRhdGEuYmFja2dyb3VuZENvbG9yKTtcclxuICAgICAgICB2YXIgZGVzYyA9IHtcclxuICAgICAgICAgICAgICAgIGlkOiBpZCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IGRhdGEubmFtZSxcclxuICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgbGFzdENoYW5nZTogRGF0ZS5ub3coKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLWRhdGEtXCIgKyBpZCwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi1kZXNjLVwiICsgaWQsIEpTT04uc3RyaW5naWZ5KGRlc2MpKTtcclxuICAgIH0sXHJcbiAgICBsb2FkOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgaXRlbSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi1kYXRhLVwiICsgaWQpO1xyXG4gICAgICAgICAgICBpZiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5iYWNrZ3JvdW5kQ29sb3IgPSBkYXRhLmJhY2tncm91bmRDb2xvciB8fCAnI2ZjZmNmYyc7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0gZHVtbXkoKTtcclxuICAgICAgICB0aGlzLnNhdmUoaWQsIGRhdGEpO1xyXG4gICAgICAgIHJldHVybiAgZGF0YTtcclxuICAgIH0sXHJcbiAgICBzYXZlV2lmOiBmdW5jdGlvbiAoZGVzYywgZGF0YSkge1xyXG4gICAgICAgIHZhciBpZCA9IGRlc2MuaWQ7XHJcblxyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi13aWYtZGF0YS1cIiArIGlkLCBkYXRhKTtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItd2lmLWRlc2MtXCIgKyBpZCwgSlNPTi5zdHJpbmdpZnkoZGVzYykpO1xyXG5cclxuICAgIH0sXHJcbiAgICBzYXZlV2lmRGVzYzogZnVuY3Rpb24gKGRlc2MpIHtcclxuICAgICAgICB2YXIgaWQgPSBkZXNjLmlkO1xyXG4gICAgICAgIHZhciBjb3B5ID0gXy5jbG9uZShkZXNjKTtcclxuICAgICAgICBkZWxldGUgY29weS5kYXRhO1xyXG5cclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItd2lmLWRlc2MtXCIgKyBpZCwgSlNPTi5zdHJpbmdpZnkoZGVzYykpO1xyXG5cclxuICAgIH0sXHJcbiAgICBsb2FkV2lmOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgZGF0YSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi13aWYtZGF0YS1cIiArIGlkKTtcclxuICAgICAgICB2YXIgZGVzYyA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLXdpZi1kZXNjLVwiICsgaWQpKTtcclxuICAgICAgICBkZXNjLmRhdGEgPSBkYXRhO1xyXG4gICAgICAgIHJldHVybiBkZXNjO1xyXG4gICAgfSxcclxuICAgIHJlbW92ZTogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLWRhdGEtXCIgKyBpZCwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi1kZXNjLVwiICsgaWQsIEpTT04uc3RyaW5naWZ5KGRlc2MpKTtcclxuICAgIH0sXHJcbiAgICBsaXN0UHJvamVjdHM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcHJvamVjdHMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvY2FsU3RvcmFnZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIga2V5ID0gbG9jYWxTdG9yYWdlLmtleShpKTtcclxuICAgICAgICAgICAgaWYoa2V5LmluZGV4T2YocHJvamVjdFByZWZpeCArIFwiLWRlc2MtXCIpID09PSAwKXtcclxuICAgICAgICAgICAgICAgIHZhciBkZXNjID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKVxyXG4gICAgICAgICAgICAgICAgcHJvamVjdHMucHVzaChkZXNjKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2plY3RzO1xyXG4gICAgfSxcclxuICAgIGxpc3RXaWZzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHdpZnMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvY2FsU3RvcmFnZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIga2V5ID0gbG9jYWxTdG9yYWdlLmtleShpKTtcclxuICAgICAgICAgICAgaWYoa2V5LmluZGV4T2YocHJvamVjdFByZWZpeCArIFwiLXdpZi1kZXNjLVwiKSA9PT0gMCl7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGVzYyA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSlcclxuICAgICAgICAgICAgICAgIHdpZnMucHVzaChkZXNjKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHdpZnM7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE9wZW5UYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbG9jYWxTdG9yYWdlLmdldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLW9wZW4tdGFiXCIpO1xyXG4gICAgfSxcclxuICAgIHNldE9wZW5UYWI6IGZ1bmN0aW9uICh0YWIpIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItb3Blbi10YWJcIiwgdGFiKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzPSBzdG9yYWdlO1xyXG4iLCJ2YXIgTWF0aFV0aWxzID0gcmVxdWlyZSgnLi9tYXRoLXV0aWxzJyk7XHJcblxyXG52YXIgc2VlZFJhbmRvbSA9IGZ1bmN0aW9uIChzZWVkKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB4ID0gTWF0aC5zaW4oc2VlZCsrKSAqIDEwMDAwO1xyXG4gICAgICAgIHJldHVybiB4IC0gTWF0aC5mbG9vcih4KTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGxheWVycywgc2l6ZSwgYmFja2dyb3VuZCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgZm9yICh2YXIgZiA9IDA7IGYgPCBzaXplOyBmKyspIHtcclxuICAgICAgICByZXN1bHQucHVzaChiYWNrZ3JvdW5kIHx8IFwiI2ZjZmNmY1wiKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgc2NhbGUgPSBmdW5jdGlvbiAocCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6IHAueCAqIHNpemUsXHJcbiAgICAgICAgICAgIHk6IDEgLSBwLnlcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKHZhciBsaSA9IDA7IGxpIDwgbGF5ZXJzLmxlbmd0aDsgbGkrKykge1xyXG4gICAgICAgIHZhciBsYXllciA9IGxheWVyc1tsaV07XHJcblxyXG4gICAgICAgIHJuZCA9IHNlZWRSYW5kb20obGF5ZXIuc2VlZCB8fCBsaSsxKTtcclxuICAgICAgICB2YXIgcG9pbnRzID0gbGF5ZXIucG9pbnRzO1xyXG5cclxuICAgICAgICB2YXIgemVybyA9IHt4OjAsIHk6MH07XHJcbiAgICAgICAgdmFyIG1heCA9IHt4OiBzaXplLTEsIHk6MX07XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBwb2ludHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHAxID0gc2NhbGUocG9pbnRzW2kgLSAxXSk7XHJcbiAgICAgICAgICAgIHZhciBwMiA9IHNjYWxlKHBvaW50c1tpXSk7XHJcbiAgICAgICAgICAgIE1hdGhVdGlscy5jb25zdHJhaW5Qb2ludChwMSwgemVybywgbWF4KTtcclxuICAgICAgICAgICAgTWF0aFV0aWxzLmNvbnN0cmFpblBvaW50KHAyLCB6ZXJvLCBtYXgpO1xyXG4gICAgICAgICAgICBwMS54ID0gTWF0aC5mbG9vcihwMS54KTtcclxuICAgICAgICAgICAgcDIueCA9IE1hdGguZmxvb3IocDIueCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbSA9IChwMi55IC0gcDEueSkgLyAocDIueCAtIHAxLngpO1xyXG4gICAgICAgICAgICB2YXIgYiA9IHAxLnkgLSBtICogcDEueDtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSBwMS54OyBqIDw9IHAyLng7IGorKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJuZFZhbCA9IHJuZCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHkgPSBtICogaiArIGI7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJuZFZhbCA8PSB5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2pdID0gbGF5ZXIuY29sb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxudmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7d2lmRGF0YTp7fX07XHJcbiAgICB9LFxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHt3aWZEYXRhOiBzdG9yYWdlLmxvYWRXaWYodGhpcy5wcm9wcy5pZCl9KTtcclxuICAgIH0sXHJcbiAgICBvbk5hbWVDaGFuZ2U6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdmFyIGNvcHkgPSBfLmNsb25lKHRoaXMuc3RhdGUud2lmRGF0YSk7XHJcbiAgICAgICAgY29weS5uYW1lID0gZS50YXJnZXQudmFsdWU7XHJcbiAgICAgICAgc3RvcmFnZS5zYXZlV2lmRGVzYyhjb3B5KTtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHt3aWZEYXRhOiBjb3B5fSk7XHJcbiAgICB9LFxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb250YWluZXItZmx1aWRcIn0sIFJlYWN0LkRPTS5oMShudWxsLCB0aGlzLnN0YXRlLndpZkRhdGEubmFtZSksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3ZhbHVlOnRoaXMuc3RhdGUud2lmRGF0YS5uYW1lLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgb25DaGFuZ2U6dGhpcy5vbk5hbWVDaGFuZ2V9ICksUmVhY3QuRE9NLmJyKG51bGwpLCBSZWFjdC5ET00ucHJlKG51bGwsIHRoaXMuc3RhdGUud2lmRGF0YS5kYXRhKSk7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXHJcbnZhciBJY29uID0gcmVxdWlyZSgnLi9ib290c3RyYXAvaWNvbicpO1xyXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xyXG5cclxuXHJcbnZhciBVcGxvYWRXaWZGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVXBsb2FkV2lmRm9ybScsXHJcbiAgICBvblN1Ym1pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgIHZhciBuYW1lO1xyXG5cclxuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICAgICAgICAgIGlmKGV2dC50YXJnZXQucmVhZHlTdGF0ZSAhPSAyKSByZXR1cm47XHJcbiAgICAgICAgICAgIGlmKGV2dC50YXJnZXQuZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KCdFcnJvciB3aGlsZSByZWFkaW5nIGZpbGUnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZmlsZWNvbnRlbnQgPSBldnQudGFyZ2V0LnJlc3VsdDtcclxuICAgICAgICAgICAgdmFyIG5ld0lkID0gXCJcIiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwMDApO1xyXG5cclxuICAgICAgICAgICAgc3RvcmFnZS5zYXZlV2lmKHtpZDogbmV3SWQsIG5hbWU6IG5hbWV9LCBmaWxlY29udGVudCk7XHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25VcGxvYWQoKTtcclxuICAgICAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgICAgIHZhciBmaWxlID0gdGhpcy5yZWZzLmZpbGUuZ2V0RE9NTm9kZSgpLmZpbGVzWzBdO1xyXG4gICAgICAgIG5hbWUgPSBmaWxlLm5hbWUucmVwbGFjZShcIi53aWZcIixcIlwiKTtcclxuICAgICAgICByZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xpY2tGaWxlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZpbGUuZ2V0RE9NTm9kZSgpLmNsaWNrKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBzdHlsZT17Y29sb3I6J3doaXRlJ307XHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5mb3JtKCB7b25TdWJtaXQ6dGhpcy5vblN1Ym1pdH0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaDQobnVsbCwgXCJJbXBvcnQgV2lmXCIpLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7dHlwZTpcImZpbGVcIiwgcmVmOlwiZmlsZVwiLCBjbGFzc05hbWU6XCJ3aGl0ZS1maWxlXCIsIHN0eWxlOnN0eWxlfSApLFJlYWN0LkRPTS5icihudWxsKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcImJ0biBidG4tZGVmYXVsdFwifSwgSWNvbigge2ljb246XCJib29rXCJ9KSwgXCIgSW1wb3J0XCIpXHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7ICAgICAgICAgICAgd2lmczogW11cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgcmVmcmVzaFdpZjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3dpZnM6IHN0b3JhZ2UubGlzdFdpZnMoKX0pO1xyXG4gICAgfSxcclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICB0aGlzLnJlZnJlc2hXaWYoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHdpZnMgPSB0aGlzLnN0YXRlLndpZnM7XHJcblxyXG4gICAgICAgIHZhciB3aWZWaWV3cyA9IHdpZnMubWFwKGZ1bmN0aW9uICh3aWYpIHtcclxuXHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiBtYWtlTGluayhpbm5lcil7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmEoIHtocmVmOicjJyArIHJvdXRpZS5sb29rdXAoJ3dpZicsIHtpZDogd2lmLmlkfSl9LCBpbm5lcilcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIG1ha2VMaW5rKHdpZi5uYW1lKSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29udGFpbmVyLWZsdWlkXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmgxKCB7Y2xhc3NOYW1lOlwicGFnZS1oZWFkZXIgcGFnZS1oZWFkZXItbWFpblwifSwgXCJJbXBvcnRlZCBXaWZzXCIpLFxyXG4gICAgICAgICAgICB3aWZWaWV3cyxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxyXG4gICAgICAgICAgICBVcGxvYWRXaWZGb3JtKCB7b25VcGxvYWQ6dGhpcy5yZWZyZXNoV2lmfSlcclxuICAgICAgICApXHJcblxyXG4gICAgfVxyXG5cclxuXHJcbn0pO1xyXG4iXX0=
