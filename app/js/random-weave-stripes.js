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
            if(sec.indexOf('COLOR PALETTE') == 0){
                res += '[COLOR PALETTE]' + nl;
                res += 'Entries=' + colorsArray.length + nl;
                res += 'Form=RGB' + nl;
                res += 'Range=0,255' + nl;
            }
            else if(sec.indexOf('COLOR TABLE')== 0){
                res += data2;
            }
            else if(sec.indexOf('WARP COLORS')== 0){
                res += '[WARP COLORS]' + nl;
                res+= data;
            }
            else {
                res += '[' + sec;
            }
        });


        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(res));
        pom.setAttribute('download', this.getFileName()+ "_modified_wif_"+loadWif.name+".wif");
        pom.click();

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
                React.DOM.select( {value:selected, className:"form-control h-spaced"}, 
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJlOlxccHJvamVjdHNcXGhvbWVcXHdlYXZlXFxyYW5kb20td2VhdmUtc3RyaXBlc1xcbm9kZV9tb2R1bGVzXFxncnVudC1icm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvYm9vdHN0cmFwL2ljb24tYnV0dG9uLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvYm9vdHN0cmFwL2ljb24uanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9kYXRhL2xheWVyLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvZGF0YS9wb2ludC5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL2luZGV4LmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvbGF5ZXItbGluZXMtZWRpdG9yLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvbGF5ZXItbGlzdC5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL21hdGgtdXRpbHMuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9uYW1lLWdlbi5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL3Byb2plY3QtcGlja2VyLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvcmVuZGVyZXIuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9yZXN1bHQtcmVuZGVyZXIuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9ybmQuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9zdG9yYWdlLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvc3RyaXBlcy5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL3dpZi1lZGl0b3IuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy93aWYtbGlzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2bkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXHJcbnZhciBSbmQgPSByZXF1aXJlKCcuL3JuZCcpO1xyXG5cclxudmFyIExheWVyID0gcmVxdWlyZSgnLi9kYXRhL2xheWVyJyk7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vZGF0YS9wb2ludCcpO1xyXG5cclxudmFyIEljb24gPSByZXF1aXJlKCcuL2Jvb3RzdHJhcC9pY29uJyk7XHJcblxyXG52YXIgUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmVyJyk7XHJcbnZhciBMYXllckxpbmVzRWRpdG9yID0gcmVxdWlyZSgnLi9sYXllci1saW5lcy1lZGl0b3InKTtcclxudmFyIExheWVyTGlzdCA9IHJlcXVpcmUoJy4vbGF5ZXItbGlzdCcpO1xyXG52YXIgSWNvbkJ1dHRvbiA9IHJlcXVpcmUoJy4vYm9vdHN0cmFwL2ljb24tYnV0dG9uJyk7XHJcblxyXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xyXG5cclxudmFyIHN0cmlwZXMgPSByZXF1aXJlKCcuL3N0cmlwZXMnKTtcclxuXHJcblxyXG5cclxudmFyIGNoYW5nZWQgPSBmdW5jdGlvbiAodGFyZ2V0LCBjaGFuZ2VzKSB7XHJcbiAgICByZXR1cm4gXy5leHRlbmQoXy5jbG9uZSh0YXJnZXQpLCBjaGFuZ2VzKTtcclxufTtcclxuXHJcblxyXG52YXIgS2luZElucHV0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnS2luZElucHV0JyxcclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLnByb3BzLnZhbHVlXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgb25DaGFuZ2U6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdmFyIHYgPSBlLnRhcmdldC52YWx1ZTtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHt2YWx1ZTogdn0pO1xyXG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2Uodik7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uQmx1cjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiB0aGlzLnByb3BzLnZhbHVlfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBzdHlsZSA9IHt9O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5wcm9wcy52YWx1ZSAhPSB0aGlzLnN0YXRlLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHN0eWxlLmNvbG9yID0gJ29yYW5nZSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oUmVhY3QuRE9NLmlucHV0KCB7dmFsdWU6dGhpcy5zdGF0ZS52YWx1ZSwgb25DaGFuZ2U6dGhpcy5vbkNoYW5nZSwgc3R5bGU6c3R5bGUsIG9uQmx1cjp0aGlzLm9uQmx1cn0pKTtcclxuICAgIH1cclxufSk7XHJcblxyXG52YXIgUHJvamVjdERvd25sb2FkcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Byb2plY3REb3dubG9hZHMnLFxyXG4gICAgZ2V0RmlsZU5hbWU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbmFtZSA9IHRoaXMucHJvcHMuYXBwU3RhdGUubmFtZSB8fCBcIm5vbmFtZVwiO1xyXG4gICAgICAgIHZhciBmaWxlbmFtZSA9IG5hbWUucmVwbGFjZSgvW15hLXowLTldL2dpLCAnXycpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgcmV0dXJuIGZpbGVuYW1lO1xyXG4gICAgfSxcclxuXHJcbiAgICBzYXZlSW1hZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgIHBvbS5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCB3aW5kb3cuX2hhY2suY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJykpO1xyXG4gICAgICAgIHBvbS5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgdGhpcy5nZXRGaWxlTmFtZSgpICtcIl9pbWFnZS5wbmdcIik7XHJcbiAgICAgICAgcG9tLmNsaWNrKCk7XHJcblxyXG4gICAgfSxcclxuICAgIHNhdmVQcm9qZWN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHBvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICBwb20uc2V0QXR0cmlidXRlKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkodGhpcy5wcm9wcy5hcHBTdGF0ZSkpKTtcclxuICAgICAgICBwb20uc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHRoaXMuZ2V0RmlsZU5hbWUoKSArXCJfcHJvamVjdC5qc29uXCIpO1xyXG4gICAgICAgIHBvbS5jbGljaygpO1xyXG5cclxuICAgIH0sXHJcbiAgICBzYXZlTW9kaWZpZWRXaWY6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGhleFRvUmdiKGhleCkge1xyXG4gICAgICAgICAgICAvLyBFeHBhbmQgc2hvcnRoYW5kIGZvcm0gKGUuZy4gXCIwM0ZcIikgdG8gZnVsbCBmb3JtIChlLmcuIFwiMDAzM0ZGXCIpXHJcbiAgICAgICAgICAgIHZhciBzaG9ydGhhbmRSZWdleCA9IC9eIz8oW2EtZlxcZF0pKFthLWZcXGRdKShbYS1mXFxkXSkkL2k7XHJcbiAgICAgICAgICAgIGhleCA9IGhleC5yZXBsYWNlKHNob3J0aGFuZFJlZ2V4LCBmdW5jdGlvbiAobSwgciwgZywgYikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHIgKyByICsgZyArIGcgKyBiICsgYjtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gL14jPyhbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KSQvaS5leGVjKGhleCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQgPyB7XHJcbiAgICAgICAgICAgICAgICByOiBwYXJzZUludChyZXN1bHRbMV0sIDE2KSxcclxuICAgICAgICAgICAgICAgIGc6IHBhcnNlSW50KHJlc3VsdFsyXSwgMTYpLFxyXG4gICAgICAgICAgICAgICAgYjogcGFyc2VJbnQocmVzdWx0WzNdLCAxNilcclxuICAgICAgICAgICAgfSA6IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgIHZhciBsb2FkV2lmID0gc3RvcmFnZS5sb2FkV2lmKGlkKTtcclxuXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHN0cmlwZXModGhpcy5wcm9wcy5hcHBTdGF0ZS5sYXllckRhdGEubGF5ZXJzLCB0aGlzLnByb3BzLmFwcFN0YXRlLnNpemUueCwgdGhpcy5wcm9wcy5hcHBTdGF0ZS5iYWNrZ3JvdW5kQ29sb3IpO1xyXG5cclxuICAgICAgICB2YXIgbmwgPSBcIlxcclxcblwiO1xyXG4gICAgICAgIHZhciBjb2xvcnNBcnJheSA9IFtdO1xyXG4gICAgICAgIHZhciBkYXRhID0gXCJcIjtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgY29sb3IgPSByZXN1bHRbaV07XHJcbiAgICAgICAgICAgIHZhciBuciA9IGNvbG9yc0FycmF5LmluZGV4T2YoY29sb3IpO1xyXG4gICAgICAgICAgICBpZiAobnIgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb2xvcnNBcnJheS5wdXNoKGNvbG9yKTtcclxuICAgICAgICAgICAgICAgIG5yID0gY29sb3JzQXJyYXkubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkYXRhICs9IChpICsgMSkgKyBcIj1cIiArIChuciArIDEpICsgbmw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZGF0YTIgPSBcIltDT0xPUiBUQUJMRV1cIiArIG5sO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNvbG9yc0FycmF5Lmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHZhciBjID0gY29sb3JzQXJyYXlbal07XHJcbiAgICAgICAgICAgIHZhciByZ2IgPSBoZXhUb1JnYihjKTtcclxuICAgICAgICAgICAgZGF0YTIgKz0gKGogKyAxKSArIFwiPVwiICsgcmdiLnIgKyBcIixcIiArIHJnYi5nICsgXCIsXCIgKyByZ2IuYiArIG5sO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNlY3Rpb25TcGxpdCA9IGxvYWRXaWYuZGF0YS5zcGxpdChcIltcIik7XHJcbiAgICAgICAgdmFyIHJlcztcclxuXHJcbiAgICAgICAgc2VjdGlvblNwbGl0LmZvckVhY2goZnVuY3Rpb24gKHNlYykge1xyXG4gICAgICAgICAgICBpZihzZWMuaW5kZXhPZignQ09MT1IgUEFMRVRURScpID09IDApe1xyXG4gICAgICAgICAgICAgICAgcmVzICs9ICdbQ09MT1IgUEFMRVRURV0nICsgbmw7XHJcbiAgICAgICAgICAgICAgICByZXMgKz0gJ0VudHJpZXM9JyArIGNvbG9yc0FycmF5Lmxlbmd0aCArIG5sO1xyXG4gICAgICAgICAgICAgICAgcmVzICs9ICdGb3JtPVJHQicgKyBubDtcclxuICAgICAgICAgICAgICAgIHJlcyArPSAnUmFuZ2U9MCwyNTUnICsgbmw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZihzZWMuaW5kZXhPZignQ09MT1IgVEFCTEUnKT09IDApe1xyXG4gICAgICAgICAgICAgICAgcmVzICs9IGRhdGEyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYoc2VjLmluZGV4T2YoJ1dBUlAgQ09MT1JTJyk9PSAwKXtcclxuICAgICAgICAgICAgICAgIHJlcyArPSAnW1dBUlAgQ09MT1JTXScgKyBubDtcclxuICAgICAgICAgICAgICAgIHJlcys9IGRhdGE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXMgKz0gJ1snICsgc2VjO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICBwb20uc2V0QXR0cmlidXRlKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQocmVzKSk7XHJcbiAgICAgICAgcG9tLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCB0aGlzLmdldEZpbGVOYW1lKCkrIFwiX21vZGlmaWVkX3dpZl9cIitsb2FkV2lmLm5hbWUrXCIud2lmXCIpO1xyXG4gICAgICAgIHBvbS5jbGljaygpO1xyXG5cclxuICAgIH0sXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge307XHJcbiAgICB9LFxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHdpZnMgPSB0aGlzLnByb3BzLmFwcFN0YXRlLndpZnMgfHwgW107XHJcbiAgICAgICAgdmFyIGZpcnN0ID0gbnVsbDtcclxuICAgICAgICB2YXIgd2lmT3B0cyA9IHdpZnMubWFwKGZ1bmN0aW9uICh3aWYpIHtcclxuICAgICAgICAgICAgZmlyc3QgPSBmaXJzdCB8fCB3aWYuaWQ7XHJcbiAgICAgICAgICAgIHJldHVybiBSZWFjdC5ET00ub3B0aW9uKCB7dmFsdWU6d2lmLmlkfSwgd2lmLm5hbWUpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gdGhpcy5zdGF0ZS5zZWxlY3RlZFdpZiB8fCBmaXJzdDtcclxuXHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5oNChudWxsLCBcIkRvd25sb2Fkc1wiKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgICAgIEljb25CdXR0b24oIHtpY29uOlwiZmxvcHB5LXNhdmVcIiwgdGl0bGU6XCJQcm9qZWN0XCIsIGNsYXNzTmFtZTpcImRvd25sb2FkLWJ1dHRvblwiLCBvbkNsaWNrOnRoaXMuc2F2ZVByb2plY3R9KSxcclxuICAgICAgICAgICAgICAgIEljb25CdXR0b24oIHtpY29uOlwicGljdHVyZVwiLCB0aXRsZTpcIkltYWdlXCIsIGNsYXNzTmFtZTpcImRvd25sb2FkLWJ1dHRvblwiLCBvbkNsaWNrOnRoaXMuc2F2ZUltYWdlfSksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uaDQobnVsbCwgXCJTZWxlY3Qgd2lmXCIpLFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNlbGVjdCgge3ZhbHVlOnNlbGVjdGVkLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaC1zcGFjZWRcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgIHdpZk9wdHNcclxuICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICBJY29uQnV0dG9uKCB7aWNvbjpcInJhbmRvbVwiLCB0aXRsZTpcIk1vZGlmeSBhbmQgRG93bmxvYWRcIiwgY2xhc3NOYW1lOlwiZG93bmxvYWQtYnV0dG9uXCIsIG9uQ2xpY2s6dGhpcy5zYXZlTW9kaWZpZWRXaWYuYmluZCh0aGlzLCBzZWxlY3RlZCl9IClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbnZhciBQcm9qZWN0U2l6ZXMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQcm9qZWN0U2l6ZXMnLFxyXG4gICAgb25XaWR0aENoYW5nZTogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciBmaXhlZCA9IE1hdGgubWF4KDEwLCBwYXJzZUludCh2YWwpIHx8IDEwMCk7XHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25TaXplQ2hhbmdlZCh7eDogZml4ZWR9KTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBvbkhlaWdodENoYW5nZTogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciBmaXhlZCA9IE1hdGgubWF4KDEwLCBwYXJzZUludCh2YWwpIHx8IDEwMCk7XHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25TaXplQ2hhbmdlZCh7eTogZml4ZWR9KTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGlkID0gXCJcIiArIE1hdGgucmFuZG9tKCk7XHJcbiAgICAgICAgcmV0dXJuICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cCBoLXNwYWNlZFwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIFwiU2l6ZXNcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgS2luZElucHV0KCB7aWQ6aWQsIHR5cGU6XCJ0ZXh0XCIsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1zbVwiLCAgdmFsdWU6dGhpcy5wcm9wcy5zaXplLngsIG9uQ2hhbmdlOnRoaXMub25XaWR0aENoYW5nZX0gKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1hZGRvblwifSwgXCJ4XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBLaW5kSW5wdXQoIHt0eXBlOlwidGV4dFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgdmFsdWU6dGhpcy5wcm9wcy5zaXplLnksIG9uQ2hhbmdlOnRoaXMub25IZWlnaHRDaGFuZ2V9ICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXAtYWRkb25cIn0sIFwiZWRpdFwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgS2luZElucHV0KCB7dHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsICB2YWx1ZTp0aGlzLnByb3BzLmVkaXRvclNpemUsIG9uQ2hhbmdlOnRoaXMucHJvcHMub25FZGl0b3JTaXplQ2hhbmdlfSApXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG52YXIgSW5zcGVjdG9yQm94ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSW5zcGVjdG9yQm94JyxcclxuICAgIG9uUmFuZG9tQ29sb3I6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLm9uTmV3Q29sb3IoUm5kLmNvbG9yKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvbkNvbG9yQ2hhbmdlOiBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHRoaXMub25OZXdDb2xvcihlLnRhcmdldC52YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uTmV3Q29sb3I6IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkJhY2tncm91bmRDb2xvckNoYW5nZSh2KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHt0YWI6IHN0b3JhZ2UuZ2V0T3BlblRhYigpfTtcclxuICAgIH0sXHJcblxyXG4gICAgY2hhbmdlVGFiOiBmdW5jdGlvbiAodGFiKSB7XHJcbiAgICAgICAgc3RvcmFnZS5zZXRPcGVuVGFiKHRhYik7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dGFiOiB0YWJ9KTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGFwcFN0YXRlID0gdGhpcy5wcm9wcy5hcHBTdGF0ZTtcclxuICAgICAgICB2YXIgdGFiID0gdGhpcy5zdGF0ZS50YWJ8fCdwcm9qZWN0JztcclxuICAgICAgICB2YXIgdGFiRGF0YTtcclxuICAgICAgICBpZih0YWIgPT0gJ2NvbG9ycycpe1xyXG4gICAgICAgICAgICB0YWJEYXRhID0gUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmZvcm0oIHtyb2xlOlwiZm9ybVwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXBcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaDQoIHtmb3I6XCJsYXllckNvbG9yXCJ9LCBcIkJhY2tncm91bmQgY29sb3JcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cFwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtpZDpcImxheWVyQ29sb3JcIiwgdHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsIHZhbHVlOnRoaXMucHJvcHMuYXBwU3RhdGUuYmFja2dyb3VuZENvbG9yLCBvbkNoYW5nZTp0aGlzLm9uQ29sb3JDaGFuZ2V9KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXAtYnRuXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOlwiYnRuIGJ0bi1kZWZhdWx0IGlucHV0LXNtXCIsIHR5cGU6XCJidXR0b25cIiwgb25DbGljazp0aGlzLm9uUmFuZG9tQ29sb3J9LCBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24gZ2x5cGhpY29uLWZpcmVcIn0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBMYXllckxpc3QoIHtsYXllckRhdGE6YXBwU3RhdGUubGF5ZXJEYXRhLCBzaXplOmFwcFN0YXRlLnNpemUsIG9uQ2hhbmdlOnRoaXMucHJvcHMub25MYXllckRhdGFDaGFuZ2V9KVxyXG4gICAgICAgICAgICApXHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICB0YWJEYXRhID0gUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgICAgIFByb2plY3RTaXplcygge3NpemU6YXBwU3RhdGUuc2l6ZSxcclxuICAgICAgICAgICAgICAgIGVkaXRvclNpemU6YXBwU3RhdGUuZWRpdG9yU2l6ZSxcclxuICAgICAgICAgICAgICAgIG9uU2l6ZUNoYW5nZWQ6dGhpcy5wcm9wcy5vblNpemVDaGFuZ2VkLFxyXG4gICAgICAgICAgICAgICAgb25FZGl0b3JTaXplQ2hhbmdlOnRoaXMucHJvcHMub25FZGl0b3JTaXplQ2hhbmdlfSksXHJcbiAgICAgICAgICAgICAgICBQcm9qZWN0RG93bmxvYWRzKCB7YXBwU3RhdGU6YXBwU3RhdGV9KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaW5zcGVjdG9yQm94IGNvbnRhaW5lci1mbHVpZFwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00udWwoIHtjbGFzc05hbWU6XCJuYXYgbmF2LXRhYnNcIn0sIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmxpKCB7Y2xhc3NOYW1lOnRhYj09J3Byb2plY3QnICYmICdhY3RpdmUnfSwgUmVhY3QuRE9NLmEoIHtvbkNsaWNrOnRoaXMuY2hhbmdlVGFiLmJpbmQodGhpcywgJ3Byb2plY3QnKX0sIFwiUHJvamVjdFwiKSksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6dGFiPT0nY29sb3JzJyAmJiAnYWN0aXZlJ30sIFJlYWN0LkRPTS5hKCB7b25DbGljazp0aGlzLmNoYW5nZVRhYi5iaW5kKHRoaXMsICdjb2xvcnMnKX0sIFwiQ29sb3JzXCIpKVxyXG5cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICB0YWJEYXRhXHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG52YXIgQXBwbGljYXRpb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBcHBsaWNhdGlvbicsXHJcbiAgICBtaXhpbnM6IFtSZWFjdC5hZGRvbnMuTGlua2VkU3RhdGVNaXhpbl0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0b3JhZ2UubG9hZCh0aGlzLnByb3BzLmlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgb25MYXllckRhdGFDaGFuZ2U6IGZ1bmN0aW9uIChuZXdMYXllckRhdGEpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtsYXllckRhdGE6IG5ld0xheWVyRGF0YX0pO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgY2hhbmdlU2l6ZTogZnVuY3Rpb24gKG5ld1NpemUpIHtcclxuICAgICAgICB2YXIgZml4ZWRTaXplID0gY2hhbmdlZCh0aGlzLnN0YXRlLnNpemUsIG5ld1NpemUpO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3NpemU6IGZpeGVkU2l6ZX0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY29weSA9IF8uY2xvbmUodGhpcy5zdGF0ZSk7XHJcbiAgICAgICAgZGVsZXRlIGNvcHkud2lmcztcclxuICAgICAgICBzdG9yYWdlLnNhdmUodGhpcy5wcm9wcy5pZCwgdGhpcy5zdGF0ZSk7XHJcbiAgICAgICAgaWYodGhpcy5zdGF0ZS5lZGl0TmFtZSl7XHJcbiAgICAgICAgICAgIHZhciBuYW1lRWRpdG9yID0gdGhpcy5yZWZzLm5hbWVFZGl0b3I7XHJcbiAgICAgICAgICAgIGlmIChuYW1lRWRpdG9yKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZG9tTm9kZSA9IG5hbWVFZGl0b3IuZ2V0RE9NTm9kZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRvbU5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBkb21Ob2RlLmZvY3VzKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgb25CYWNrZ3JvdW5kQ29sb3JDaGFuZ2U6IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtiYWNrZ3JvdW5kQ29sb3I6IHZhbH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBvbkVkaXRvclNpemVDaGFuZ2U6IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICB2YXIgZml4ZWQgPSBNYXRoLm1heCgxMCwgcGFyc2VJbnQodmFsKSB8fCAxMDApO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2VkaXRvclNpemU6IGZpeGVkfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNob3dOYW1lRWRpdG9yOiBmdW5jdGlvbiAoc2hvdykge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2VkaXROYW1lOiBzaG93IH0pO1xyXG4gICAgfSxcclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7d2lmczogc3RvcmFnZS5saXN0V2lmcygpfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlZGl0b3JTaXplID0ge3g6IHRoaXMuc3RhdGUuc2l6ZS54LCB5OiB0aGlzLnN0YXRlLmVkaXRvclNpemUgfHwgMTAwfTtcclxuICAgICAgICB2YXIgbmFtZUNvbXBvbmVudCA9IFJlYWN0LkRPTS5zcGFuKCB7b25DbGljazp0aGlzLnNob3dOYW1lRWRpdG9yLmJpbmQodGhpcywgdHJ1ZSl9LCB0aGlzLnN0YXRlLm5hbWUpXHJcbiAgICAgICAgaWYodGhpcy5zdGF0ZS5lZGl0TmFtZSl7XHJcbiAgICAgICAgICAgIG5hbWVDb21wb25lbnQgPSBSZWFjdC5ET00uaW5wdXQoIHtjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgdmFsdWVMaW5rOnRoaXMubGlua1N0YXRlKCduYW1lJyksIHJlZjpcIm5hbWVFZGl0b3JcIiwgb25CbHVyOnRoaXMuc2hvd05hbWVFZGl0b3IuYmluZCh0aGlzLCBmYWxzZSl9IClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29udGFpbmVyLWZsdWlkXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmgxKCB7Y2xhc3NOYW1lOlwicGFnZS1oZWFkZXIgcGFnZS1oZWFkZXItbWFpblwifSwgbmFtZUNvbXBvbmVudCksXHJcblxyXG4gICAgICAgICAgICBJbnNwZWN0b3JCb3goIHthcHBTdGF0ZTp0aGlzLnN0YXRlLFxyXG4gICAgICAgICAgICBvbkxheWVyRGF0YUNoYW5nZTp0aGlzLm9uTGF5ZXJEYXRhQ2hhbmdlLFxyXG4gICAgICAgICAgICBvblNpemVDaGFuZ2VkOnRoaXMuY2hhbmdlU2l6ZSxcclxuICAgICAgICAgICAgb25FZGl0b3JTaXplQ2hhbmdlOnRoaXMub25FZGl0b3JTaXplQ2hhbmdlLFxyXG4gICAgICAgICAgICBvbkJhY2tncm91bmRDb2xvckNoYW5nZTp0aGlzLm9uQmFja2dyb3VuZENvbG9yQ2hhbmdlfVxyXG4gICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInN0cmlwZXNBcmVhQm94XCJ9LCBcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgICAgICAgICAgUmVuZGVyZXIoIHtsYXllcnM6dGhpcy5zdGF0ZS5sYXllckRhdGEubGF5ZXJzLCBzaXplOnRoaXMuc3RhdGUuc2l6ZSwgYmFja2dyb3VuZENvbG9yOnRoaXMuc3RhdGUuYmFja2dyb3VuZENvbG9yfSlcclxuICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICBMYXllckxpbmVzRWRpdG9yKCB7Y2FuU2VsZWN0OnRoaXMuc3RhdGUuc2VsZWN0SW5MYXllckVkaXRvciwgbGF5ZXJEYXRhOnRoaXMuc3RhdGUubGF5ZXJEYXRhLCBvbkNoYW5nZTp0aGlzLm9uTGF5ZXJEYXRhQ2hhbmdlLCBzaXplOmVkaXRvclNpemV9ICksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnIobnVsbCksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwiY2hlY2tib3hcIiwgY2hlY2tlZExpbms6dGhpcy5saW5rU3RhdGUoJ3NlbGVjdEluTGF5ZXJFZGl0b3InKX0pLFxuICAgICAgICAgICAgICAgIFwiIEFsbG93IFNlbGVjdCBcIixcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnIobnVsbCksUmVhY3QuRE9NLmJyKG51bGwpLFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIndlbGxcIn0sIFxuICAgICAgICAgICAgICAgICAgICBcIiBTaGlmdCtDbGljayB0byBhZGQgcG9pbnRzIFwiLFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnIobnVsbCksXG4gICAgICAgICAgICAgICAgICAgIFwiIEN0cmwrQ2xpY2sgdG8gcmVtb3ZlIHBvaW50cyBcIlxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNsZWFyLWZpeCBhbGVydCBhbGVydC13YXJuaW5nXCJ9LCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiV2FybmluZyFcIiksIFwiIFRoaXMgaXMgYSB3b3JrIGluIHByb2dyZXNzIHRoaW5nLiBEb24ndCBleHBlY3QgYW55dGhpbmcgdG8gd29yayBhbmQgeW91ciBkYXRhIG1pZ2h0IGRpc2FwZWFyIGF0IGFueSBtb21lbnQhXCIpXHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFwcGxpY2F0aW9uO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXHJcbnZhciBJY29uID0gcmVxdWlyZSgnLi9pY29uJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiYnRuIGJ0bi1kZWZhdWx0XCJ9LCBJY29uKCB7aWNvbjp0aGlzLnByb3BzLmljb259KSwgdGhpcy5wcm9wcy50aXRsZT9cIiBcIiArIHRoaXMucHJvcHMudGl0bGU6JycpKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXHJcbnZhciBJY29uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSWNvbicsXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgaWNvbiA9IFwiZ2x5cGhpY29uIGdseXBoaWNvbi1cIiArIHRoaXMucHJvcHMuaWNvbjtcclxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6aWNvbn0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSWNvbjsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb2xvciwgcG9pbnRzKSB7XHJcbiAgICB0aGlzLmlkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwMDAwMCk7XHJcbiAgICB0aGlzLnNlZWQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwKSsxMDtcclxuICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcclxuICAgIHRoaXMucG9pbnRzID0gcG9pbnRzO1xyXG4gICAgcG9pbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gYS54IC0gYi54O1xyXG4gICAgfSk7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgID0gIGZ1bmN0aW9uICh4LCB5KSB7XHJcbiAgICB0aGlzLmlkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwMDAwMCk7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxufTtcclxuXHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxudmFyIFByb2plY3RQaWNrZXIgPSByZXF1aXJlKCcuL3Byb2plY3QtcGlja2VyJyk7XHJcblxyXG5SZWFjdC5yZW5kZXJDb21wb25lbnQoXHJcbiAgICBQcm9qZWN0UGlja2VyKG51bGwgKSxcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHBsaWNhdGlvbicpXHJcbik7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxudmFyIE1hdGhVdGlscyA9IHJlcXVpcmUoJy4vbWF0aC11dGlscycpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL2RhdGEvcG9pbnQnKTtcclxuXHJcblxyXG52YXIgSWNvbkJ1dHRvbiA9IHJlcXVpcmUoJy4vYm9vdHN0cmFwL2ljb24tYnV0dG9uJyk7XHJcblxyXG4vLyB0b2RvOiByZXVzZT9cclxudmFyIGNoYW5nZWQ9IGZ1bmN0aW9uICh0YXJnZXQsIGNoYW5nZXMpIHtcclxuICAgIHJldHVybiBfLmV4dGVuZChfLmNsb25lKHRhcmdldCksIGNoYW5nZXMpO1xyXG59O1xyXG5cclxudmFyIE1vdmFibGVDaXJjbGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdNb3ZhYmxlQ2lyY2xlJyxcclxuICAgIG9uTW91c2VEb3duOiBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICBvOiB7XHJcbiAgICAgICAgICAgICAgICBveDogdGhpcy5wcm9wcy5jeCxcclxuICAgICAgICAgICAgICAgIG95OiB0aGlzLnByb3BzLmN5LFxyXG4gICAgICAgICAgICAgICAgeDogZS5jbGllbnRYLFxyXG4gICAgICAgICAgICAgICAgeTogZS5jbGllbnRZXHJcbiAgICAgICAgICAgIH19KTtcclxuICAgICAgICB0aGlzLnByb3BzLm9uTW91c2VEb3duKGUpO1xyXG5cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VNb3ZlKTtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgdGhpcy5vbk1vdXNlVXApO1xyXG5cclxuICAgIH0sXHJcbiAgICBvbk1vdXNlVXA6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7bzogbnVsbH0pXHJcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5vbk1vdXNlTW92ZSk7XHJcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIHRoaXMub25Nb3VzZVVwKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VNb3ZlKTtcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgdGhpcy5vbk1vdXNlVXApO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgb25Nb3VzZU1vdmU6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdmFyIG8gPSB0aGlzLnN0YXRlLm87XHJcblxyXG4gICAgICAgIGlmIChvKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdPID0gT2JqZWN0LmNyZWF0ZShvKTtcclxuICAgICAgICAgICAgbmV3Ty54ID0gZS5jbGllbnRYO1xyXG4gICAgICAgICAgICBuZXdPLnkgPSBlLmNsaWVudFk7XHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25Nb3ZlKChvLm94ICsgZS5jbGllbnRYIC0gdGhpcy5zdGF0ZS5vLnggKSwgKG8ub3kgK2UuY2xpZW50WSAtIHRoaXMuc3RhdGUuby55ICkpO1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKG5ld08pO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFJlYWN0LkRPTS5jaXJjbGUoIHtvbk1vdXNlRG93bjp0aGlzLm9uTW91c2VEb3dufSkpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG5cclxudmFyIFNpbmdsZUxpbmVFZGl0b3IgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTaW5nbGVMaW5lRWRpdG9yJyxcclxuICAgIG9uTW92ZUNpcmNsZU1vdmU6IGZ1bmN0aW9uIChpbmRleCwgeCwgeSkge1xyXG4gICAgICAgIHZhciBuZXdQb2ludHMgPSB0aGlzLnByb3BzLnBvaW50cy5zbGljZSgpO1xyXG4gICAgICAgIHZhciBsZWZ0UG9pbnQgPSBuZXdQb2ludHNbaW5kZXggLSAxXSB8fCB7eDogMH07XHJcbiAgICAgICAgdmFyIHJpZ2h0UG9pbnQgPSBuZXdQb2ludHNbaW5kZXggKyAxXSB8fCB7eDogdGhpcy5wcm9wcy5zaXplLnh9O1xyXG5cclxuICAgICAgICBuZXdQb2ludHNbaW5kZXhdID0gbmV3UG9pbnQgPSBfLmNsb25lKG5ld1BvaW50c1tpbmRleF0pO1xyXG5cclxuICAgICAgICBuZXdQb2ludC54ID0gTWF0aFV0aWxzLmNvbnN0cmFpbih4LCBsZWZ0UG9pbnQueCwgcmlnaHRQb2ludC54KTtcclxuICAgICAgICBuZXdQb2ludC55ID0gTWF0aFV0aWxzLmNvbnN0cmFpbih5LCAgMCwgdGhpcy5wcm9wcy5zaXplLnkpO1xyXG5cclxuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKG5ld1BvaW50cyk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uVG91Y2g6IGZ1bmN0aW9uIChjaXJjbGVJLCBlKSB7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblBvaW50VG91Y2goY2lyY2xlSSwgZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgbGluZVN0eWxlID0ge1xyXG4gICAgICAgICAgICBzdHJva2U6IHRoaXMucHJvcHMuY29sb3IsXHJcbiAgICAgICAgICAgICdzdHJva2Utd2lkdGgnOiAyXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgY2lyY2xlU3R5bGUgPSB7XHJcbiAgICAgICAgICAgIGZpbGw6IHRoaXMucHJvcHMubWFya0NvbG9yLFxyXG4gICAgICAgICAgICBjdXJzb3I6ICdtb3ZlJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBsaW5lcyA9IFtdO1xyXG4gICAgICAgIHZhciBjaXJjbGVzID0gW107XHJcblxyXG4gICAgICAgIHZhciBjaXJjbGUgPSBmdW5jdGlvbiAocCwgaSkge1xyXG4gICAgICAgICAgICByZXR1cm4gTW92YWJsZUNpcmNsZSgge2tleTpwLmlkLCBjeDpwLngsIGN5OnAueSwgcjp0aGlzLnByb3BzLm1hcmtTaXplLCBvbk1vdXNlRG93bjp0aGlzLm9uVG91Y2guYmluZCh0aGlzLCBpKSwgb25Nb3ZlOnRoaXMub25Nb3ZlQ2lyY2xlTW92ZS5iaW5kKHRoaXMsIGkpLCBzdHlsZTpjaXJjbGVTdHlsZX0pXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMucHJvcHMucG9pbnRzLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgcDEgPSB0aGlzLnByb3BzLnBvaW50c1tpIC0gMV07XHJcbiAgICAgICAgICAgIHZhciBwMiA9IHRoaXMucHJvcHMucG9pbnRzW2ldO1xyXG4gICAgICAgICAgICBpZiAoaSA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjaXJjbGVzLnB1c2goY2lyY2xlKHAxLCBpIC0gMSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxpbmVzLnB1c2goUmVhY3QuRE9NLmxpbmUoIHt4MTpwMS54LCB5MTpwMS55LCB4MjpwMi54LCB5MjpwMi55LCBzdHlsZTpsaW5lU3R5bGV9KSk7XHJcbiAgICAgICAgICAgIGNpcmNsZXMucHVzaChjaXJjbGUocDIsIGkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZyhudWxsLCBcclxuICAgICAgICBsaW5lcyxcclxuICAgICAgICBjaXJjbGVzXHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcbmZ1bmN0aW9uIHNjYWxlUG9pbnQocG9pbnQsIGJ5KXtcclxuICAgIHJldHVybiBfLmV4dGVuZChfLmNsb25lKHBvaW50KSwge3g6IHBvaW50LngqIGJ5LngseTogcG9pbnQueSogYnkueSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2NhbGVQb2ludHMocG9pbnRzLCBieSl7XHJcbiAgICByZXR1cm4gcG9pbnRzLm1hcChmdW5jdGlvbiAocCkge1xyXG4gICAgICAgIHJldHVybiBzY2FsZVBvaW50KHAsIGJ5KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxudmFyIExheWVyTGluZXNFZGl0b3IgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdMYXllckxpbmVzRWRpdG9yJyxcclxuICAgIG9uTGluZUNoYW5nZTogZnVuY3Rpb24gKGluZGV4LCBwb2ludHMpIHtcclxuICAgICAgICB2YXIgcyA9IHRoaXMucHJvcHMuc2l6ZTtcclxuICAgICAgICB2YXIgaXMgPSAge3g6IDEvcy54LCB5OjEvIHMueX07XHJcbiAgICAgICAgcG9pbnRzID0gc2NhbGVQb2ludHMocG9pbnRzLCBpcyk7XHJcbiAgICAgICAgdGhpcy5vblJhd0xpbmVDaGFuZ2UoaW5kZXgsIHBvaW50cyk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uUmF3TGluZUNoYW5nZTogZnVuY3Rpb24gKGluZGV4LCBwb2ludHMpIHtcclxuICAgICAgICB2YXIgbmV3TGF5ZXJzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzLnNsaWNlKCk7XHJcbiAgICAgICAgdmFyIG5ld0xheWVyID0gbmV3TGF5ZXJzW2luZGV4XSA9IF8uY2xvbmUobmV3TGF5ZXJzW2luZGV4XSk7XHJcbiAgICAgICAgbmV3TGF5ZXIucG9pbnRzID0gcG9pbnRzO1xyXG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoY2hhbmdlZCh0aGlzLnByb3BzLmxheWVyRGF0YSwge2xheWVyczogbmV3TGF5ZXJzfSkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvblBvaW50VG91Y2g6IGZ1bmN0aW9uIChsYXllckksIHBvaW50SSwgZSkge1xyXG4gICAgICAgIGlmICghZS5jdHJsS2V5KSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoY2hhbmdlZCh0aGlzLnByb3BzLmxheWVyRGF0YSwge3NlbGVjdGVkOiBsYXllckl9KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgbmV3UG9pbnRzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzW2xheWVySV0ucG9pbnRzLnNsaWNlKCk7XHJcbiAgICAgICAgICAgIG5ld1BvaW50cy5zcGxpY2UocG9pbnRJLCAxKTtcclxuICAgICAgICAgICAgdGhpcy5vblJhd0xpbmVDaGFuZ2UobGF5ZXJJLG5ld1BvaW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQYXJlbnQ6IGZ1bmN0aW9uICh0YXJnZXQsIHR5cGUpIHtcclxuICAgICAgICB3aGlsZSh0YXJnZXQgJiYgdGFyZ2V0Lm5vZGVOYW1lICE9IHR5cGUpe1xyXG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkUG9pbnQ6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgaWYgKCFlLmN0cmxLZXkgJiYgZS5zaGlmdEtleSkge1xyXG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5zZWxlY3RlZDtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3UG9pbnRzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzW3NlbGVjdGVkXS5wb2ludHMuc2xpY2UoKTtcclxuICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSB0aGlzLmdldFBhcmVudChlLnRhcmdldCwgJ3N2ZycpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHAgPSBuZXcgUG9pbnQoZS5wYWdlWCAtIGNhbnZhcy5vZmZzZXRMZWZ0LCBlLnBhZ2VZIC0gY2FudmFzLm9mZnNldFRvcClcclxuICAgICAgICAgICAgICAgIHZhciBzID0gdGhpcy5wcm9wcy5zaXplO1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzID0gIHt4OiAxL3MueCwgeToxLyBzLnl9O1xyXG4gICAgICAgICAgICAgICAgcCA9IHNjYWxlUG9pbnQocCxpcyk7XHJcbiAgICAgICAgICAgICAgICBuZXdQb2ludHMucHVzaChwKTtcclxuICAgICAgICAgICAgICAgIG5ld1BvaW50cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEueCAtIGIueDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblJhd0xpbmVDaGFuZ2Uoc2VsZWN0ZWQsIG5ld1BvaW50cyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcyA9IHRoaXMucHJvcHMuc2l6ZTtcclxuICAgICAgICB2YXIgZWRpdG9ycyA9IHRoaXMucHJvcHMubGF5ZXJEYXRhLmxheWVycy5tYXAoZnVuY3Rpb24gKGxheWVyLCBpKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5zZWxlY3RlZCA9PSBpO1xyXG4gICAgICAgICAgICB2YXIgbWFya0NvbG9yID0gc2VsZWN0ZWQ/J3doaXRlJzonZ3JleSc7XHJcbiAgICAgICAgICAgIHZhciBtYXJrU2l6ZSA9IDEwO1xyXG5cclxuICAgICAgICAgICAgaWYoIXRoaXMucHJvcHMuY2FuU2VsZWN0ICYmICFzZWxlY3RlZCl7XHJcbiAgICAgICAgICAgICAgICBtYXJrU2l6ZSA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzY2FsZWRQb2ludHMgPSBzY2FsZVBvaW50cyhsYXllci5wb2ludHMsIHRoaXMucHJvcHMuc2l6ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBTaW5nbGVMaW5lRWRpdG9yKCAge3NpemU6cywgY29sb3I6bGF5ZXIuY29sb3IsIG1hcmtDb2xvcjptYXJrQ29sb3IsIG1hcmtTaXplOm1hcmtTaXplLCAgcG9pbnRzOnNjYWxlZFBvaW50cywgb25DaGFuZ2U6dGhpcy5vbkxpbmVDaGFuZ2UuYmluZCh0aGlzLCBpKSwgb25Qb2ludFRvdWNoOnRoaXMub25Qb2ludFRvdWNoLmJpbmQodGhpcywgaSl9KTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuXHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5zdmcoIHt3aWR0aDpzLngsIGhlaWdodDpzLnksIGNsYXNzTmFtZTpcImxpbmVFZGl0b3JcIiwgb25Nb3VzZURvd246dGhpcy5hZGRQb2ludH0sIGVkaXRvcnMpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExheWVyTGluZXNFZGl0b3I7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblxyXG52YXIgUm5kID0gcmVxdWlyZSgnLi9ybmQnKTtcclxuXHJcbnZhciBMYXllciA9IHJlcXVpcmUoJy4vZGF0YS9sYXllcicpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL2RhdGEvcG9pbnQnKTtcclxuXHJcbnZhciBJY29uQnV0dG9uID0gcmVxdWlyZSgnLi9ib290c3RyYXAvaWNvbi1idXR0b24nKTtcclxuXHJcbmFycmF5TW92ZSA9IGZ1bmN0aW9uKGFycmF5LCBmcm9tLCB0bykge1xyXG4gICAgYXJyYXkuc3BsaWNlKHRvLCAwLCBhcnJheS5zcGxpY2UoZnJvbSwgMSlbMF0pO1xyXG59O1xyXG5cclxudmFyIExheWVySW5zcGVjdG9yID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTGF5ZXJJbnNwZWN0b3InLFxyXG4gICAgb25Db2xvckNoYW5nZTogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB0aGlzLm9uTmV3Q29sb3JWYWx1ZShlLnRhcmdldC52YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uU2VlZENoYW5nZTogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB0aGlzLm9uTmV3U2VlZFZhbHVlKGUudGFyZ2V0LnZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgb25OZXdDb2xvclZhbHVlOiBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgdmFyIG5ld0xheWVyICA9ICBfLmNsb25lKHRoaXMucHJvcHMubGF5ZXIpO1xyXG4gICAgICAgIG5ld0xheWVyLmNvbG9yID0gdmFsO1xyXG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UobmV3TGF5ZXIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvbk5ld1NlZWRWYWx1ZTogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgIHZhciBuZXdMYXllciAgPSAgXy5jbG9uZSh0aGlzLnByb3BzLmxheWVyKTtcclxuICAgICAgICBuZXdMYXllci5zZWVkID0gdmFsO1xyXG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UobmV3TGF5ZXIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvblJhbmRvbUNvbG9yOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5vbk5ld0NvbG9yVmFsdWUoUm5kLmNvbG9yKCkpO1xyXG4gICAgfSxcclxuICAgIG9uUmFuZG9tU2VlZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMub25OZXdTZWVkVmFsdWUoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjkwMDAwICsxMDAwMCkpO1xyXG4gICAgfSxcclxuXHJcblxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIHRvZG86IHJldXNhYmxlIGZvcm0gY29tcG9uZW5ldFxyXG5cclxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZm9ybSgge3JvbGU6XCJmb3JtXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXBcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5sYWJlbCgge2ZvcjpcImxheWVyQ29sb3JcIn0sIFwiQ29sb3JcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7aWQ6XCJsYXllckNvbG9yXCIsIHR5cGU6XCJ0ZXh0XCIsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1zbVwiLCB2YWx1ZTp0aGlzLnByb3BzLmxheWVyLmNvbG9yLCBvbkNoYW5nZTp0aGlzLm9uQ29sb3JDaGFuZ2V9KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXAtYnRuXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOlwiYnRuIGJ0bi1kZWZhdWx0IGlucHV0LXNtXCIsIHR5cGU6XCJidXR0b25cIiwgb25DbGljazp0aGlzLm9uUmFuZG9tQ29sb3J9LCBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24gZ2x5cGhpY29uLWZpcmVcIn0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cFwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5sYWJlbCgge2ZvcjpcImxheWVyU2VlZFwifSwgXCJTZWVkXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXBcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7aWQ6XCJsYXllclNlZWRcIiwgdHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsIHZhbHVlOnRoaXMucHJvcHMubGF5ZXIuc2VlZCwgb25DaGFuZ2U6dGhpcy5vblNlZWRDaGFuZ2V9KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwLWJ0blwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHQgaW5wdXQtc21cIiwgdHlwZTpcImJ1dHRvblwiLCBvbkNsaWNrOnRoaXMub25SYW5kb21TZWVkfSwgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uIGdseXBoaWNvbi1maXJlXCJ9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICB9XHJcbn0pO1xyXG5cclxudmFyIGNoYW5nZWQ9IGZ1bmN0aW9uICh0YXJnZXQsIGNoYW5nZXMpIHtcclxuICAgIHJldHVybiBfLmV4dGVuZChfLmNsb25lKHRhcmdldCksIGNoYW5nZXMpO1xyXG59O1xyXG5cclxudmFyIExheWVyTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0xheWVyTGlzdCcsXHJcblxyXG4gICAgb25DbGljazogZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShjaGFuZ2VkKHRoaXMucHJvcHMubGF5ZXJEYXRhLCB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkOiBpbmRleFxyXG4gICAgICAgIH0pKTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkTGF5ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcm5kUG9pbnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQoTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIG5ld0xheWVycyA9IHRoaXMucHJvcHMubGF5ZXJEYXRhLmxheWVycy5zbGljZSgpO1xyXG5cclxuICAgICAgICAvLyB0b2RvOiByZXVzZSBzb3J0IChtb3ZlIHRvIExheWVyPylcclxuICAgICAgICB2YXIgbGF5ZXIgPSBuZXcgTGF5ZXIoUm5kLmNvbG9yKCksIFtybmRQb2ludCgpLCBybmRQb2ludCgpXSk7XHJcbiAgICAgICAgbGF5ZXIucG9pbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGEueCAtIGIueDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBuZXdMYXllcnMucHVzaChsYXllcik7XHJcblxyXG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoY2hhbmdlZCh0aGlzLnByb3BzLmxheWVyRGF0YSwge1xyXG4gICAgICAgICAgICBsYXllcnM6IG5ld0xheWVycyxcclxuICAgICAgICAgICAgc2VsZWN0ZWQ6IG5ld0xheWVycy5sZW5ndGgtMVxyXG4gICAgICAgIH0pKTtcclxuICAgIH0sXHJcbiAgICByZW1vdmVMYXllcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBuZXdMYXllcnMgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5sYXllcnMuc2xpY2UoKTtcclxuICAgICAgICBuZXdMYXllcnMuc3BsaWNlKHRoaXMucHJvcHMubGF5ZXJEYXRhLnNlbGVjdGVkLDEpO1xyXG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoY2hhbmdlZCh0aGlzLnByb3BzLmxheWVyRGF0YSwge1xyXG4gICAgICAgICAgICBsYXllcnM6IG5ld0xheWVyc1xyXG4gICAgICAgIH0pKTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIG9uTGF5ZXJDaGFuZ2U6IGZ1bmN0aW9uIChsYXllckluZGV4LCBuZXdMYXllcikge1xyXG5cclxuICAgICAgICB2YXIgbmV3TGF5ZXJzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzLnNsaWNlKCk7XHJcbiAgICAgICAgbmV3TGF5ZXJzW2xheWVySW5kZXhdID0gbmV3TGF5ZXI7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShjaGFuZ2VkKHRoaXMucHJvcHMubGF5ZXJEYXRhLCB7XHJcbiAgICAgICAgICAgIGxheWVyczogbmV3TGF5ZXJzXHJcbiAgICAgICAgfSkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBtb3ZlVXA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLm1vdmUoMSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG1vdmVEb3duOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5tb3ZlKC0xKTtcclxuICAgIH0sXHJcblxyXG4gICAgbW92ZTogZnVuY3Rpb24gKGRlbHRhKSB7XHJcbiAgICAgICAgdmFyIGxheWVyRGF0YSA9IHRoaXMucHJvcHMubGF5ZXJEYXRhO1xyXG4gICAgICAgIHZhciBzZWxlY3RlZCA9IGxheWVyRGF0YS5zZWxlY3RlZDtcclxuICAgICAgICB2YXIgbmV3TGF5ZXJzID0gbGF5ZXJEYXRhLmxheWVycy5zbGljZSgpO1xyXG4gICAgICAgIGFycmF5TW92ZShuZXdMYXllcnMsIHNlbGVjdGVkLCBzZWxlY3RlZCtkZWx0YSk7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShjaGFuZ2VkKGxheWVyRGF0YSwge1xyXG4gICAgICAgICAgICBsYXllcnM6IG5ld0xheWVycyxcclxuICAgICAgICAgICAgc2VsZWN0ZWQ6IHNlbGVjdGVkK2RlbHRhXHJcbiAgICAgICAgfSkpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbGF5ZXJEYXRhID0gdGhpcy5wcm9wcy5sYXllckRhdGE7XHJcbiAgICAgICAgdmFyIHNlbGVjdGVkTGF5ZXI7XHJcblxyXG4gICAgICAgIHZhciBsYXllcnMgPSBsYXllckRhdGEubGF5ZXJzLm1hcChmdW5jdGlvbiAobGF5ZXIsIGkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IHtcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogbGF5ZXIuY29sb3IsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzMwcHgnXHJcblxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYoaSA9PSBsYXllckRhdGEuc2VsZWN0ZWQpe1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRMYXllciA9IGxheWVyO1xyXG4gICAgICAgICAgICAgICAgc3R5bGUuYm9yZGVyID0gXCIzcHggZGFzaGVkICMyNzJCMzBcIlxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmRpdigge3N0eWxlOnN0eWxlLCBvbkNsaWNrOnRoaXMub25DbGljay5iaW5kKHRoaXMsIGkpfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBsYXllcnMucmV2ZXJzZSgpO1xyXG4gICAgICAgIHZhciBpbnNwZWN0b3I7XHJcbiAgICAgICAgdmFyIGFjdGlvbnMgPSBbXTtcclxuXHJcbiAgICAgICAgYWN0aW9ucy5wdXNoKEljb25CdXR0b24oIHtpY29uOlwicGx1c1wiLCBjbGFzc05hbWU6XCJidG4tZ3JvdXAtc3BhY2VcIiwgb25DbGljazp0aGlzLmFkZExheWVyfSApKTtcclxuXHJcbiAgICAgICAgaWYoc2VsZWN0ZWRMYXllcikge1xyXG4gICAgICAgICAgICBpbnNwZWN0b3IgPSBMYXllckluc3BlY3Rvcigge2xheWVyOnNlbGVjdGVkTGF5ZXIsIG9uQ2hhbmdlOnRoaXMub25MYXllckNoYW5nZS5iaW5kKHRoaXMsIHRoaXMucHJvcHMubGF5ZXJEYXRhLnNlbGVjdGVkKX0pO1xyXG5cclxuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJidG4tZ3JvdXAgYnRuLWdyb3VwLXNwYWNlXCJ9LCBcclxuICAgICAgICAgICAgICAgIEljb25CdXR0b24oIHtpY29uOlwiYXJyb3ctdXBcIiwgb25DbGljazp0aGlzLm1vdmVVcCwgZW5hYmxlZDpsYXllckRhdGEuc2VsZWN0ZWQgPCBsYXllckRhdGEubGF5ZXJzLmxlbmd0aC0xfSksXHJcbiAgICAgICAgICAgICAgICBJY29uQnV0dG9uKCB7aWNvbjpcImFycm93LWRvd25cIiwgb25DbGljazp0aGlzLm1vdmVEb3duLCBlbmFibGVkOmxheWVyRGF0YS5zZWxlY3RlZCA+IDB9KVxyXG4gICAgICAgICAgICApKTtcclxuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKEljb25CdXR0b24oIHtpY29uOlwidHJhc2hcIiwgY2xhc3NOYW1lOlwiYnRuLWdyb3VwLXNwYWNlXCIsIG9uQ2xpY2s6dGhpcy5yZW1vdmVMYXllcn0gKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oNChudWxsLCBcIkxheWVyc1wiKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImgtc3BhY2VkXCJ9LCBcclxuICAgICAgICAgICAgICAgIGxheWVyc1xyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaC1zcGFjZWRcIn0sIFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uc1xyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBpbnNwZWN0b3JcclxuICAgICAgICApXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGF5ZXJMaXN0OyIsInZhciBNYXRoVXRpbCA9IE1hdGhVdGlsIHx8IHt9O1xyXG5NYXRoVXRpbC5jb25zdHJhaW4gPSBmdW5jdGlvbiAodiwgbWluLCBtYXgpIHtcclxuICAgIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKG1heCwgdikpO1xyXG59O1xyXG5cclxuTWF0aFV0aWwuY29uc3RyYWluUG9pbnQgPSBmdW5jdGlvbiAocCwgbWluLCBtYXgpIHtcclxuICAgIHAueCA9IE1hdGhVdGlsLmNvbnN0cmFpbihwLngsIG1pbi54LCBtYXgueCk7XHJcbiAgICBwLnkgPSBNYXRoVXRpbC5jb25zdHJhaW4ocC55LCBtaW4ueSwgbWF4LnkpO1xyXG4gICAgcmV0dXJuIHA7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGhVdGlsOyIsInZhciBkYXRhID0ge307XHJcbmRhdGEuYW5pbWFscyA9IFsnQWFyZHZhcmsnLFxyXG4gICAgJ0FsYmF0cm9zcycsXHJcbiAgICAnQWxsaWdhdG9yJyxcclxuICAgICdBbHBhY2EnLFxyXG4gICAgJ0FudCcsXHJcbiAgICAnQW50ZWF0ZXInLFxyXG4gICAgJ0FudGVsb3BlJyxcclxuICAgICdBcGUnLFxyXG4gICAgJ0FybWFkaWxsbycsXHJcbiAgICAnQXNzL0RvbmtleScsXHJcbiAgICAnQmFib29uJyxcclxuICAgICdCYWRnZXInLFxyXG4gICAgJ0JhcnJhY3VkYScsXHJcbiAgICAnQmF0JyxcclxuICAgICdCZWFyJyxcclxuICAgICdCZWF2ZXInLFxyXG4gICAgJ0JlZScsXHJcbiAgICAnQmlzb24nLFxyXG4gICAgJ0JvYXInLFxyXG4gICAgJ0J1ZmZhbG8nLFxyXG4gICAgJ0J1dHRlcmZseScsXHJcbiAgICAnQ2FtZWwnLFxyXG4gICAgJ0NhcHliYXJhJyxcclxuICAgICdDYXJpYm91JyxcclxuICAgICdDYXNzb3dhcnknLFxyXG4gICAgJ0NhdCcsXHJcbiAgICAnQ2F0ZXJwaWxsYXInLFxyXG4gICAgJ0NhdHRsZScsXHJcbiAgICAnQ2hhbW9pcycsXHJcbiAgICAnQ2hlZXRhaCcsXHJcbiAgICAnQ2hpY2tlbicsXHJcbiAgICAnQ2hpbXBhbnplZScsXHJcbiAgICAnQ2hpbmNoaWxsYScsXHJcbiAgICAnQ2hvdWdoJyxcclxuICAgICdDbGFtJyxcclxuICAgICdDb2JyYScsXHJcbiAgICAnQ29ja3JvYWNoJyxcclxuICAgICdDb2QnLFxyXG4gICAgJ0Nvcm1vcmFudCcsXHJcbiAgICAnQ295b3RlJyxcclxuICAgICdDcmFiJyxcclxuICAgICdDcmFuZScsXHJcbiAgICAnQ3JvY29kaWxlJyxcclxuICAgICdDcm93JyxcclxuICAgICdDdXJsZXcnLFxyXG4gICAgJ0RlZXInLFxyXG4gICAgJ0Rpbm9zYXVyJyxcclxuICAgICdEb2cnLFxyXG4gICAgJ0RvZ2Zpc2gnLFxyXG4gICAgJ0RvbHBoaW4nLFxyXG4gICAgJ0RvbmtleScsXHJcbiAgICAnRG90dGVyZWwnLFxyXG4gICAgJ0RvdmUnLFxyXG4gICAgJ0RyYWdvbmZseScsXHJcbiAgICAnRHVjaycsXHJcbiAgICAnRHVnb25nJyxcclxuICAgICdEdW5saW4nLFxyXG4gICAgJ0VhZ2xlJyxcclxuICAgICdFY2hpZG5hJyxcclxuICAgICdFZWwnLFxyXG4gICAgJ0VsYW5kJyxcclxuICAgICdFbGVwaGFudCcsXHJcbiAgICAnRWxlcGhhbnQgc2VhbCcsXHJcbiAgICAnRWxrJyxcclxuICAgICdFbXUnLFxyXG4gICAgJ0ZhbGNvbicsXHJcbiAgICAnRmVycmV0JyxcclxuICAgICdGaW5jaCcsXHJcbiAgICAnRmlzaCcsXHJcbiAgICAnRmxhbWluZ28nLFxyXG4gICAgJ0ZseScsXHJcbiAgICAnRm94JyxcclxuICAgICdGcm9nJyxcclxuICAgICdHYXVyJyxcclxuICAgICdHYXplbGxlJyxcclxuICAgICdHZXJiaWwnLFxyXG4gICAgJ0dpYW50IFBhbmRhJyxcclxuICAgICdHaXJhZmZlJyxcclxuICAgICdHbmF0JyxcclxuICAgICdHbnUnLFxyXG4gICAgJ0dvYXQnLFxyXG4gICAgJ0dvb3NlJyxcclxuICAgICdHb2xkZmluY2gnLFxyXG4gICAgJ0dvbGRmaXNoJyxcclxuICAgICdHb3JpbGxhJyxcclxuICAgICdHb3NoYXdrJyxcclxuICAgICdHcmFzc2hvcHBlcicsXHJcbiAgICAnR3JvdXNlJyxcclxuICAgICdHdWFuYWNvJyxcclxuICAgICdHdWluZWEgZm93bCcsXHJcbiAgICAnR3VpbmVhIHBpZycsXHJcbiAgICAnR3VsbCcsXHJcbiAgICAnSGFyZScsXHJcbiAgICAnSGF3aycsXHJcbiAgICAnSGVkZ2Vob2cnLFxyXG4gICAgJ0hlcm9uJyxcclxuICAgICdIZXJyaW5nJyxcclxuICAgICdIaXBwb3BvdGFtdXMnLFxyXG4gICAgJ0hvcm5ldCcsXHJcbiAgICAnSG9yc2UnLFxyXG4gICAgJ0h1bWFuJyxcclxuICAgICdIdW1taW5nYmlyZCcsXHJcbiAgICAnSHllbmEnLFxyXG4gICAgJ0liZXgnLFxyXG4gICAgJ0liaXMnLFxyXG4gICAgJ0phY2thbCcsXHJcbiAgICAnSmFndWFyJyxcclxuICAgICdKYXknLFxyXG4gICAgJ0plbGx5ZmlzaCcsXHJcbiAgICAnS2FuZ2Fyb28nLFxyXG4gICAgJ0tpbmdmaXNoZXInLFxyXG4gICAgJ0tvYWxhJyxcclxuICAgICdLb21vZG8gZHJhZ29uJyxcclxuICAgICdLb29rYWJ1cmEnLFxyXG4gICAgJ0tvdXByZXknLFxyXG4gICAgJ0t1ZHUnLFxyXG4gICAgJ0xhcHdpbmcnLFxyXG4gICAgJ0xhcmsnLFxyXG4gICAgJ0xlbXVyJyxcclxuICAgICdMZW9wYXJkJyxcclxuICAgICdMaW9uJyxcclxuICAgICdMbGFtYScsXHJcbiAgICAnTG9ic3RlcicsXHJcbiAgICAnTG9jdXN0JyxcclxuICAgICdMb3JpcycsXHJcbiAgICAnTG91c2UnLFxyXG4gICAgJ0x5cmViaXJkJyxcclxuICAgICdNYWdwaWUnLFxyXG4gICAgJ01hbGxhcmQnLFxyXG4gICAgJ01hbmF0ZWUnLFxyXG4gICAgJ01hbmRyaWxsJyxcclxuICAgICdNYW50aXMnLFxyXG4gICAgJ01hcnRlbicsXHJcbiAgICAnTWVlcmthdCcsXHJcbiAgICAnTWluaycsXHJcbiAgICAnTW9sZScsXHJcbiAgICAnTW9uZ29vc2UnLFxyXG4gICAgJ01vbmtleScsXHJcbiAgICAnTW9vc2UnLFxyXG4gICAgJ01vdXNlJyxcclxuICAgICdNb3NxdWl0bycsXHJcbiAgICAnTXVsZScsXHJcbiAgICAnTmFyd2hhbCcsXHJcbiAgICAnTmV3dCcsXHJcbiAgICAnTmlnaHRpbmdhbGUnLFxyXG4gICAgJ09jdG9wdXMnLFxyXG4gICAgJ09rYXBpJyxcclxuICAgICdPcG9zc3VtJyxcclxuICAgICdPcnl4JyxcclxuICAgICdPc3RyaWNoJyxcclxuICAgICdPdHRlcicsXHJcbiAgICAnT3dsJyxcclxuICAgICdPeCcsXHJcbiAgICAnT3lzdGVyJyxcclxuICAgICdQYXJyb3QnLFxyXG4gICAgJ1BhcnRyaWRnZScsXHJcbiAgICAnUGVhZm93bCcsXHJcbiAgICAnUGVsaWNhbicsXHJcbiAgICAnUGVuZ3VpbicsXHJcbiAgICAnUGhlYXNhbnQnLFxyXG4gICAgJ1BpZycsXHJcbiAgICAnUGlnZW9uJyxcclxuICAgICdQb2xhciBCZWFyJyxcclxuICAgICdQb255LSBTZWUgSG9yc2UnLFxyXG4gICAgJ1BvcmN1cGluZScsXHJcbiAgICAnUG9ycG9pc2UnLFxyXG4gICAgJ1ByYWlyaWUgRG9nJyxcclxuICAgICdRdWFpbCcsXHJcbiAgICAnUXVlbGVhJyxcclxuICAgICdRdWV0emFsJyxcclxuICAgICdSYWJiaXQnLFxyXG4gICAgJ1JhY2Nvb24nLFxyXG4gICAgJ1JhaWwnLFxyXG4gICAgJ1JhbScsXHJcbiAgICAnUmF0JyxcclxuICAgICdSYXZlbicsXHJcbiAgICAnUmVkIGRlZXInLFxyXG4gICAgJ1JlZCBwYW5kYScsXHJcbiAgICAnUmVpbmRlZXInLFxyXG4gICAgJ1JoaW5vY2Vyb3MnLFxyXG4gICAgJ1Jvb2snLFxyXG4gICAgJ1NhbGFtYW5kZXInLFxyXG4gICAgJ1NhbG1vbicsXHJcbiAgICAnU2FuZCBEb2xsYXInLFxyXG4gICAgJ1NhbmRwaXBlcicsXHJcbiAgICAnU2FyZGluZScsXHJcbiAgICAnU2NvcnBpb24nLFxyXG4gICAgJ1NlYSBsaW9uJyxcclxuICAgICdTZWEgVXJjaGluJyxcclxuICAgICdTZWFob3JzZScsXHJcbiAgICAnU2VhbCcsXHJcbiAgICAnU2hhcmsnLFxyXG4gICAgJ1NoZWVwJyxcclxuICAgICdTaHJldycsXHJcbiAgICAnU2t1bmsnLFxyXG4gICAgJ1NuYWlsJyxcclxuICAgICdTbmFrZScsXHJcbiAgICAnU3BhcnJvdycsXHJcbiAgICAnU3BpZGVyJyxcclxuICAgICdTcG9vbmJpbGwnLFxyXG4gICAgJ1NxdWlkJyxcclxuICAgICdTcXVpcnJlbCcsXHJcbiAgICAnU3RhcmxpbmcnLFxyXG4gICAgJ1N0aW5ncmF5JyxcclxuICAgICdTdGlua2J1ZycsXHJcbiAgICAnU3RvcmsnLFxyXG4gICAgJ1N3YWxsb3cnLFxyXG4gICAgJ1N3YW4nLFxyXG4gICAgJ1RhcGlyJyxcclxuICAgICdUYXJzaWVyJyxcclxuICAgICdUZXJtaXRlJyxcclxuICAgICdUaWdlcicsXHJcbiAgICAnVG9hZCcsXHJcbiAgICAnVHJvdXQnLFxyXG4gICAgJ1R1cmtleScsXHJcbiAgICAnVHVydGxlJyxcclxuICAgICdWaXBlcicsXHJcbiAgICAnVnVsdHVyZScsXHJcbiAgICAnV2FsbGFieScsXHJcbiAgICAnV2FscnVzJyxcclxuICAgICdXYXNwJyxcclxuICAgICdXYXRlciBidWZmYWxvJyxcclxuICAgICdXZWFzZWwnLFxyXG4gICAgJ1doYWxlJyxcclxuICAgICdXb2xmJyxcclxuICAgICdXb2x2ZXJpbmUnLFxyXG4gICAgJ1dvbWJhdCcsXHJcbiAgICAnV29vZGNvY2snLFxyXG4gICAgJ1dvb2RwZWNrZXInLFxyXG4gICAgJ1dvcm0nLFxyXG4gICAgJ1dyZW4nLFxyXG4gICAgJ1lhaycsXHJcbiAgICAnWmVicmEnLFxyXG5dO1xyXG5cclxuXHJcblxyXG5kYXRhLmNvbG9ycyA9IFsnQWNpZCBHcmVlbicsXHJcbiAgICAnQWVybycsXHJcbiAgICAnQWVybyBCbHVlJyxcclxuICAgICdBZnJpY2FuIFZpb2xldCcsXHJcbiAgICAnQWxhYmFtYSBDcmltc29uJyxcclxuICAgICdBbGljZSBCbHVlJyxcclxuICAgICdBbGl6YXJpbiBDcmltc29uJyxcclxuICAgICdBbGxveSBPcmFuZ2UnLFxyXG4gICAgJ0FsbW9uZCcsXHJcbiAgICAnQW1hcmFudGgnLFxyXG4gICAgJ0FtYXJhbnRoIFBpbmsnLFxyXG4gICAgJ0FtYXJhbnRoIFB1cnBsZScsXHJcbiAgICAnQW1hem9uJyxcclxuICAgICdBbWJlcicsXHJcbiAgICAnQW1lcmljYW4gUm9zZScsXHJcbiAgICAnQW1ldGh5c3QnLFxyXG4gICAgJ0FuZHJvaWQgR3JlZW4nLFxyXG4gICAgJ0FudGktRmxhc2ggV2hpdGUnLFxyXG4gICAgJ0FudGlxdWUgQnJhc3MnLFxyXG4gICAgJ0FudGlxdWUgQnJvbnplJyxcclxuICAgICdBbnRpcXVlIEZ1Y2hzaWEnLFxyXG4gICAgJ0FudGlxdWUgUnVieScsXHJcbiAgICAnQW50aXF1ZSBXaGl0ZScsXHJcbiAgICAnQXBwbGUgR3JlZW4nLFxyXG4gICAgJ0Fwcmljb3QnLFxyXG4gICAgJ0FxdWEnLFxyXG4gICAgJ0FxdWFtYXJpbmUnLFxyXG4gICAgJ0FybXkgR3JlZW4nLFxyXG4gICAgJ0Fyc2VuaWMnLFxyXG4gICAgJ0FydGljaG9rZScsXHJcbiAgICAnQXJ5bGlkZSBZZWxsb3cnLFxyXG4gICAgJ0FzaCBHcmV5JyxcclxuICAgICdBc3BhcmFndXMnLFxyXG4gICAgJ0F0b21pYyBUYW5nZXJpbmUnLFxyXG4gICAgJ0F1cmVvbGluJyxcclxuICAgICdBdXJvTWV0YWxTYXVydXMnLFxyXG4gICAgJ0F2b2NhZG8nLFxyXG4gICAgJ0F6dXJlJyxcclxuICAgICdBenVyZSBNaXN0JyxcclxuICAgICdEYXp6bGVkIEJsdWUnLFxyXG4gICAgJ0JhYnkgQmx1ZScsXHJcbiAgICAnQmFieSBCbHVlIEV5ZXMnLFxyXG4gICAgJ0JhYnkgUGluaycsXHJcbiAgICAnQmFieSBQb3dkZXInLFxyXG4gICAgJ0Jha2VyLU1pbGxlciBQaW5rJyxcclxuICAgICdCYWxsIEJsdWUnLFxyXG4gICAgJ0JhbmFuYSBNYW5pYScsXHJcbiAgICAnQmFuYW5hIFllbGxvdycsXHJcbiAgICAnQmFuZ2xhZGVzaCBHcmVlbicsXHJcbiAgICAnQmFyYmllIFBpbmsnLFxyXG4gICAgJ0Jhcm4gUmVkJyxcclxuICAgICdCYXR0bGVzaGlwIEdyZXknLFxyXG4gICAgJ0JhemFhcicsXHJcbiAgICAnQmVhdSBCbHVlJyxcclxuICAgICdCZWF2ZXInLFxyXG4gICAgJ0JlaWdlJyxcclxuICAgICdCaXNxdWUnLFxyXG4gICAgJ0JpdHRlciBMZW1vbicsXHJcbiAgICAnQml0dGVyIExpbWUnLFxyXG4gICAgJ0JpdHRlcnN3ZWV0JyxcclxuICAgICdCaXR0ZXJzd2VldCBTaGltbWVyJyxcclxuICAgICdCbGFjaycsXHJcbiAgICAnQmxhY2sgQmVhbicsXHJcbiAgICAnQmxhY2sgTGVhdGhlciBKYWNrZXQnLFxyXG4gICAgJ0JsYWNrIE9saXZlJyxcclxuICAgICdCbGFuY2hlZCBBbG1vbmQnLFxyXG4gICAgJ0JsYXN0LU9mZiBCcm9uemUnLFxyXG4gICAgJ0JsZXUgRGUgRnJhbmNlJyxcclxuICAgICdCbGl6emFyZCBCbHVlJyxcclxuICAgICdCbG9uZCcsXHJcbiAgICAnQmx1ZScsXHJcbiAgICAnQmx1ZSBCZWxsJyxcclxuICAgICdCbHVlIFNhcHBoaXJlJyxcclxuICAgICdCbHVlIFlvbmRlcicsXHJcbiAgICAnQmx1ZS1HcmF5JyxcclxuICAgICdCbHVlLUdyZWVuJyxcclxuICAgICdCbHVlLVZpb2xldCcsXHJcbiAgICAnQmx1ZWJlcnJ5JyxcclxuICAgICdCbHVlYm9ubmV0JyxcclxuICAgICdCbHVzaCcsXHJcbiAgICAnQm9sZScsXHJcbiAgICAnQm9uZGkgQmx1ZScsXHJcbiAgICAnQm9uZScsXHJcbiAgICAnQm9zdG9uIFVuaXZlcnNpdHkgUmVkJyxcclxuICAgICdCb3R0bGUgR3JlZW4nLFxyXG4gICAgJ0JveXNlbmJlcnJ5JyxcclxuICAgICdCcmFuZGVpcyBCbHVlJyxcclxuICAgICdCcmFzcycsXHJcbiAgICAnQnJpY2sgUmVkJyxcclxuICAgICdCcmlnaHQgQ2VydWxlYW4nLFxyXG4gICAgJ0JyaWdodCBHcmVlbicsXHJcbiAgICAnQnJpZ2h0IExhdmVuZGVyJyxcclxuICAgICdCcmlnaHQgTGlsYWMnLFxyXG4gICAgJ0JyaWdodCBNYXJvb24nLFxyXG4gICAgJ0JyaWdodCBOYXZ5IEJsdWUnLFxyXG4gICAgJ0JyaWdodCBQaW5rJyxcclxuICAgICdCcmlnaHQgVHVycXVvaXNlJyxcclxuICAgICdCcmlnaHQgVWJlJyxcclxuICAgICdCcmlsbGlhbnQgTGF2ZW5kZXInLFxyXG4gICAgJ0JyaWxsaWFudCBSb3NlJyxcclxuICAgICdCcmluayBQaW5rJyxcclxuICAgICdCcml0aXNoIFJhY2luZyBHcmVlbicsXHJcbiAgICAnQnJvbnplJyxcclxuICAgICdCcm9uemUgWWVsbG93JyxcclxuICAgICdCcm93bi1Ob3NlJyxcclxuICAgICdCcnVuc3dpY2sgR3JlZW4nLFxyXG4gICAgJ0J1YmJsZSBHdW0nLFxyXG4gICAgJ0J1YmJsZXMnLFxyXG4gICAgJ0J1ZCBHcmVlbicsXHJcbiAgICAnQnVmZicsXHJcbiAgICAnQnVsZ2FyaWFuIFJvc2UnLFxyXG4gICAgJ0J1cmd1bmR5JyxcclxuICAgICdCdXJseXdvb2QnLFxyXG4gICAgJ0J1cm50IE9yYW5nZScsXHJcbiAgICAnQnVybnQgU2llbm5hJyxcclxuICAgICdCdXJudCBVbWJlcicsXHJcbiAgICAnQnl6YW50aW5lJyxcclxuICAgICdCeXphbnRpdW0nLFxyXG4gICAgJ0NhZGV0JyxcclxuICAgICdDYWRldCBCbHVlJyxcclxuICAgICdDYWRldCBHcmV5JyxcclxuICAgICdDYWRtaXVtIEdyZWVuJyxcclxuICAgICdDYWRtaXVtIE9yYW5nZScsXHJcbiAgICAnQ2FkbWl1bSBSZWQnLFxyXG4gICAgJ0NhZG1pdW0gWWVsbG93JyxcclxuICAgICdDYWbDqSBBdSBMYWl0JyxcclxuICAgICdDYWbDqSBOb2lyJyxcclxuICAgICdDYWwgUG9seSBQb21vbmEgR3JlZW4nLFxyXG4gICAgJ0NhbWJyaWRnZSBCbHVlJyxcclxuICAgICdDYW1lbCcsXHJcbiAgICAnQ2FtZW8gUGluaycsXHJcbiAgICAnQ2Ftb3VmbGFnZSBHcmVlbicsXHJcbiAgICAnQ2FuYXJ5IFllbGxvdycsXHJcbiAgICAnQ2FuZHkgQXBwbGUgUmVkJyxcclxuICAgICdDYW5keSBQaW5rJyxcclxuICAgICdDYXByaScsXHJcbiAgICAnQ2FwdXQgTW9ydHV1bScsXHJcbiAgICAnQ2FyZGluYWwnLFxyXG4gICAgJ0NhcmliYmVhbiBHcmVlbicsXHJcbiAgICAnQ2FybWluZScsXHJcbiAgICAnQ2FybWluZSBQaW5rJyxcclxuICAgICdDYXJtaW5lIFJlZCcsXHJcbiAgICAnQ2FybmF0aW9uIFBpbmsnLFxyXG4gICAgJ0Nhcm5lbGlhbicsXHJcbiAgICAnQ2Fyb2xpbmEgQmx1ZScsXHJcbiAgICAnQ2Fycm90IE9yYW5nZScsXHJcbiAgICAnQ2FzdGxldG9uIEdyZWVuJyxcclxuICAgICdDYXRhbGluYSBCbHVlJyxcclxuICAgICdDYXRhd2JhJyxcclxuICAgICdDZWRhciBDaGVzdCcsXHJcbiAgICAnQ2VpbCcsXHJcbiAgICAnQ2VsYWRvbicsXHJcbiAgICAnQ2VsYWRvbiBCbHVlJyxcclxuICAgICdDZWxhZG9uIEdyZWVuJyxcclxuICAgICdDZWxlc3RlJyxcclxuICAgICdDZWxlc3RpYWwgQmx1ZScsXHJcbiAgICAnQ2VyaXNlJyxcclxuICAgICdDZXJpc2UgUGluaycsXHJcbiAgICAnQ2VydWxlYW4nLFxyXG4gICAgJ0NlcnVsZWFuIEJsdWUnLFxyXG4gICAgJ0NlcnVsZWFuIEZyb3N0JyxcclxuICAgICdDRyBCbHVlJyxcclxuICAgICdDRyBSZWQnLFxyXG4gICAgJ0NoYW1vaXNlZScsXHJcbiAgICAnQ2hhbXBhZ25lJyxcclxuICAgICdDaGFyY29hbCcsXHJcbiAgICAnQ2hhcmxlc3RvbiBHcmVlbicsXHJcbiAgICAnQ2hhcm0gUGluaycsXHJcbiAgICAnQ2hlcnJ5JyxcclxuICAgICdDaGVycnkgQmxvc3NvbSBQaW5rJyxcclxuICAgICdDaGVzdG51dCcsXHJcbiAgICAnQ2hpbmEgUGluaycsXHJcbiAgICAnQ2hpbmEgUm9zZScsXHJcbiAgICAnQ2hpbmVzZSBSZWQnLFxyXG4gICAgJ0NoaW5lc2UgVmlvbGV0JyxcclxuICAgICdDaHJvbWUgWWVsbG93JyxcclxuICAgICdDaW5lcmVvdXMnLFxyXG4gICAgJ0Npbm5hYmFyJyxcclxuICAgICdDaW5uYW1vbltDaXRhdGlvbiBOZWVkZWRdJyxcclxuICAgICdDaXRyaW5lJyxcclxuICAgICdDaXRyb24nLFxyXG4gICAgJ0NsYXJldCcsXHJcbiAgICAnQ2xhc3NpYyBSb3NlJyxcclxuICAgICdDb2JhbHQnLFxyXG4gICAgJ0NvY29hIEJyb3duJyxcclxuICAgICdDb2NvbnV0JyxcclxuICAgICdDb2ZmZWUnLFxyXG4gICAgJ0NvbHVtYmlhIEJsdWUnLFxyXG4gICAgJ0NvbmdvIFBpbmsnLFxyXG4gICAgJ0Nvb2wgQmxhY2snLFxyXG4gICAgJ0Nvb2wgR3JleScsXHJcbiAgICAnQ29wcGVyJyxcclxuICAgICdDb3BwZXIgUGVubnknLFxyXG4gICAgJ0NvcHBlciBSZWQnLFxyXG4gICAgJ0NvcHBlciBSb3NlJyxcclxuICAgICdDb3F1ZWxpY290JyxcclxuICAgICdDb3JhbCcsXHJcbiAgICAnQ29yYWwgUGluaycsXHJcbiAgICAnQ29yYWwgUmVkJyxcclxuICAgICdDb3Jkb3ZhbicsXHJcbiAgICAnQ29ybicsXHJcbiAgICAnQ29ybmVsbCBSZWQnLFxyXG4gICAgJ0Nvcm5mbG93ZXIgQmx1ZScsXHJcbiAgICAnQ29ybnNpbGsnLFxyXG4gICAgJ0Nvc21pYyBMYXR0ZScsXHJcbiAgICAnQ290dG9uIENhbmR5JyxcclxuICAgICdDcmVhbScsXHJcbiAgICAnQ3JpbXNvbicsXHJcbiAgICAnQ3JpbXNvbiBHbG9yeScsXHJcbiAgICAnQ3lhbicsXHJcbiAgICAnQ3liZXIgR3JhcGUnLFxyXG4gICAgJ0N5YmVyIFllbGxvdycsXHJcbiAgICAnRGFmZm9kaWwnLFxyXG4gICAgJ0RhbmRlbGlvbicsXHJcbiAgICAnRGFyayBCbHVlJyxcclxuICAgICdEYXJrIEJsdWUtR3JheScsXHJcbiAgICAnRGFyayBCcm93bicsXHJcbiAgICAnRGFyayBCeXphbnRpdW0nLFxyXG4gICAgJ0RhcmsgQ2FuZHkgQXBwbGUgUmVkJyxcclxuICAgICdEYXJrIENlcnVsZWFuJyxcclxuICAgICdEYXJrIENoZXN0bnV0JyxcclxuICAgICdEYXJrIENvcmFsJyxcclxuICAgICdEYXJrIEN5YW4nLFxyXG4gICAgJ0RhcmsgRWxlY3RyaWMgQmx1ZScsXHJcbiAgICAnRGFyayBHb2xkZW5yb2QnLFxyXG4gICAgJ0RhcmsgR3JlZW4nLFxyXG4gICAgJ0RhcmsgSW1wZXJpYWwgQmx1ZScsXHJcbiAgICAnRGFyayBKdW5nbGUgR3JlZW4nLFxyXG4gICAgJ0RhcmsgS2hha2knLFxyXG4gICAgJ0RhcmsgTGF2YScsXHJcbiAgICAnRGFyayBMYXZlbmRlcicsXHJcbiAgICAnRGFyayBMaXZlcicsXHJcbiAgICAnRGFyayBNYWdlbnRhJyxcclxuICAgICdEYXJrIE1lZGl1bSBHcmF5JyxcclxuICAgICdEYXJrIE1pZG5pZ2h0IEJsdWUnLFxyXG4gICAgJ0RhcmsgTW9zcyBHcmVlbicsXHJcbiAgICAnRGFyayBPbGl2ZSBHcmVlbicsXHJcbiAgICAnRGFyayBPcmFuZ2UnLFxyXG4gICAgJ0RhcmsgT3JjaGlkJyxcclxuICAgICdEYXJrIFBhc3RlbCBCbHVlJyxcclxuICAgICdEYXJrIFBhc3RlbCBHcmVlbicsXHJcbiAgICAnRGFyayBQYXN0ZWwgUHVycGxlJyxcclxuICAgICdEYXJrIFBhc3RlbCBSZWQnLFxyXG4gICAgJ0RhcmsgUGluaycsXHJcbiAgICAnRGFyayBQb3dkZXIgQmx1ZScsXHJcbiAgICAnRGFyayBQdWNlJyxcclxuICAgICdEYXJrIFJhc3BiZXJyeScsXHJcbiAgICAnRGFyayBSZWQnLFxyXG4gICAgJ0RhcmsgU2FsbW9uJyxcclxuICAgICdEYXJrIFNjYXJsZXQnLFxyXG4gICAgJ0RhcmsgU2VhIEdyZWVuJyxcclxuICAgICdEYXJrIFNpZW5uYScsXHJcbiAgICAnRGFyayBTa3kgQmx1ZScsXHJcbiAgICAnRGFyayBTbGF0ZSBCbHVlJyxcclxuICAgICdEYXJrIFNsYXRlIEdyYXknLFxyXG4gICAgJ0RhcmsgU3ByaW5nIEdyZWVuJyxcclxuICAgICdEYXJrIFRhbicsXHJcbiAgICAnRGFyayBUYW5nZXJpbmUnLFxyXG4gICAgJ0RhcmsgVGF1cGUnLFxyXG4gICAgJ0RhcmsgVGVycmEgQ290dGEnLFxyXG4gICAgJ0RhcmsgVHVycXVvaXNlJyxcclxuICAgICdEYXJrIFZhbmlsbGEnLFxyXG4gICAgJ0RhcmsgVmlvbGV0JyxcclxuICAgICdEYXJrIFllbGxvdycsXHJcbiAgICAnRGFydG1vdXRoIEdyZWVuJyxcclxuICAgICdEZWJpYW4gUmVkJyxcclxuICAgICdEZWVwIENhcm1pbmUnLFxyXG4gICAgJ0RlZXAgQ2FybWluZSBQaW5rJyxcclxuICAgICdEZWVwIENhcnJvdCBPcmFuZ2UnLFxyXG4gICAgJ0RlZXAgQ2VyaXNlJyxcclxuICAgICdEZWVwIENoYW1wYWduZScsXHJcbiAgICAnRGVlcCBDaGVzdG51dCcsXHJcbiAgICAnRGVlcCBDb2ZmZWUnLFxyXG4gICAgJ0RlZXAgRnVjaHNpYScsXHJcbiAgICAnRGVlcCBKdW5nbGUgR3JlZW4nLFxyXG4gICAgJ0RlZXAgTGVtb24nLFxyXG4gICAgJ0RlZXAgTGlsYWMnLFxyXG4gICAgJ0RlZXAgTWFnZW50YScsXHJcbiAgICAnRGVlcCBNYXV2ZScsXHJcbiAgICAnRGVlcCBNb3NzIEdyZWVuJyxcclxuICAgICdEZWVwIFBlYWNoJyxcclxuICAgICdEZWVwIFBpbmsnLFxyXG4gICAgJ0RlZXAgUHVjZScsXHJcbiAgICAnRGVlcCBSdWJ5JyxcclxuICAgICdEZWVwIFNhZmZyb24nLFxyXG4gICAgJ0RlZXAgU2t5IEJsdWUnLFxyXG4gICAgJ0RlZXAgU3BhY2UgU3BhcmtsZScsXHJcbiAgICAnRGVlcCBUYXVwZScsXHJcbiAgICAnRGVlcCBUdXNjYW4gUmVkJyxcclxuICAgICdEZWVyJyxcclxuICAgICdEZW5pbScsXHJcbiAgICAnRGVzZXJ0JyxcclxuICAgICdEZXNlcnQgU2FuZCcsXHJcbiAgICAnRGVzaXJlJyxcclxuICAgICdEaWFtb25kJyxcclxuICAgICdEaW0gR3JheScsXHJcbiAgICAnRGlydCcsXHJcbiAgICAnRG9kZ2VyIEJsdWUnLFxyXG4gICAgJ0RvZ3dvb2QgUm9zZScsXHJcbiAgICAnRG9sbGFyIEJpbGwnLFxyXG4gICAgJ0RvbmtleSBCcm93bicsXHJcbiAgICAnRHJhYicsXHJcbiAgICAnRHVrZSBCbHVlJyxcclxuICAgICdEdXN0IFN0b3JtJyxcclxuICAgICdEdXRjaCBXaGl0ZScsXHJcbiAgICAnRWFydGggWWVsbG93JyxcclxuICAgICdFYm9ueScsXHJcbiAgICAnRWNydScsXHJcbiAgICAnRWVyaWUgQmxhY2snLFxyXG4gICAgJ0VnZ3BsYW50JyxcclxuICAgICdFZ2dzaGVsbCcsXHJcbiAgICAnRWd5cHRpYW4gQmx1ZScsXHJcbiAgICAnRWxlY3RyaWMgQmx1ZScsXHJcbiAgICAnRWxlY3RyaWMgQ3JpbXNvbicsXHJcbiAgICAnRWxlY3RyaWMgQ3lhbicsXHJcbiAgICAnRWxlY3RyaWMgR3JlZW4nLFxyXG4gICAgJ0VsZWN0cmljIEluZGlnbycsXHJcbiAgICAnRWxlY3RyaWMgTGF2ZW5kZXInLFxyXG4gICAgJ0VsZWN0cmljIExpbWUnLFxyXG4gICAgJ0VsZWN0cmljIFB1cnBsZScsXHJcbiAgICAnRWxlY3RyaWMgVWx0cmFtYXJpbmUnLFxyXG4gICAgJ0VsZWN0cmljIFZpb2xldCcsXHJcbiAgICAnRWxlY3RyaWMgWWVsbG93JyxcclxuICAgICdFbWVyYWxkJyxcclxuICAgICdFbWluZW5jZScsXHJcbiAgICAnRW5nbGlzaCBHcmVlbicsXHJcbiAgICAnRW5nbGlzaCBMYXZlbmRlcicsXHJcbiAgICAnRW5nbGlzaCBSZWQnLFxyXG4gICAgJ0VuZ2xpc2ggVmlvbGV0JyxcclxuICAgICdFdG9uIEJsdWUnLFxyXG4gICAgJ0V1Y2FseXB0dXMnLFxyXG4gICAgJ0ZhbGxvdycsXHJcbiAgICAnRmFsdSBSZWQnLFxyXG4gICAgJ0ZhbmRhbmdvJyxcclxuICAgICdGYW5kYW5nbyBQaW5rJyxcclxuICAgICdGYXNoaW9uIEZ1Y2hzaWEnLFxyXG4gICAgJ0Zhd24nLFxyXG4gICAgJ0ZlbGRncmF1JyxcclxuICAgICdGZWxkc3BhcicsXHJcbiAgICAnRmVybiBHcmVlbicsXHJcbiAgICAnRmVycmFyaSBSZWQnLFxyXG4gICAgJ0ZpZWxkIERyYWInLFxyXG4gICAgJ0ZpcmUgRW5naW5lIFJlZCcsXHJcbiAgICAnRmlyZWJyaWNrJyxcclxuICAgICdGbGFtZScsXHJcbiAgICAnRmxhbWluZ28gUGluaycsXHJcbiAgICAnRmxhdHRlcnknLFxyXG4gICAgJ0ZsYXZlc2NlbnQnLFxyXG4gICAgJ0ZsYXgnLFxyXG4gICAgJ0ZsaXJ0JyxcclxuICAgICdGbG9yYWwgV2hpdGUnLFxyXG4gICAgJ0ZsdW9yZXNjZW50IE9yYW5nZScsXHJcbiAgICAnRmx1b3Jlc2NlbnQgUGluaycsXHJcbiAgICAnRmx1b3Jlc2NlbnQgWWVsbG93JyxcclxuICAgICdGb2xseScsXHJcbiAgICAnRnJlbmNoIEJlaWdlJyxcclxuICAgICdGcmVuY2ggQmlzdHJlJyxcclxuICAgICdGcmVuY2ggQmx1ZScsXHJcbiAgICAnRnJlbmNoIEZ1Y2hzaWEnLFxyXG4gICAgJ0ZyZW5jaCBMaWxhYycsXHJcbiAgICAnRnJlbmNoIExpbWUnLFxyXG4gICAgJ0ZyZW5jaCBNYXV2ZScsXHJcbiAgICAnRnJlbmNoIFBpbmsnLFxyXG4gICAgJ0ZyZW5jaCBQbHVtJyxcclxuICAgICdGcmVuY2ggUHVjZScsXHJcbiAgICAnRnJlbmNoIFJhc3BiZXJyeScsXHJcbiAgICAnRnJlbmNoIFJvc2UnLFxyXG4gICAgJ0ZyZW5jaCBTa3kgQmx1ZScsXHJcbiAgICAnRnJlbmNoIFZpb2xldCcsXHJcbiAgICAnRnJlbmNoIFdpbmUnLFxyXG4gICAgJ0ZyZXNoIEFpcicsXHJcbiAgICAnRnVjaHNpYScsXHJcbiAgICAnRnVjaHNpYSBQaW5rJyxcclxuICAgICdGdWNoc2lhIFB1cnBsZScsXHJcbiAgICAnRnVjaHNpYSBSb3NlJyxcclxuICAgICdGdWx2b3VzJyxcclxuICAgICdGdXp6eSBXdXp6eScsXHJcbl07XHJcblxyXG5mdW5jdGlvbiByYW5kb20obGlzdCl7XHJcbiAgICByZXR1cm4gbGlzdFtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqbGlzdC5sZW5ndGgpXTtcclxufVxyXG5cclxuZXhwb3J0cy5jb2xvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiByYW5kb20oZGF0YS5jb2xvcnMpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5hbmltYWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gcmFuZG9tKGRhdGEuYW5pbWFscyk7XHJcbn07XHJcblxyXG5leHBvcnRzLmNvbG9yQW5pbWFsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuY29sb3IoKSArIFwiIFwiICsgdGhpcy5hbmltYWwoKTtcclxufTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXHJcblxyXG52YXIgQXBwbGljYXRpb24gPSByZXF1aXJlKCcuL2FwcGxpY2F0aW9uJyk7XHJcbnZhciBSZXN1bHRSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVzdWx0LXJlbmRlcmVyJyk7XHJcbnZhciBXaWZFZGl0b3IgPSByZXF1aXJlKCcuL3dpZi1lZGl0b3InKTtcclxudmFyIFdpZkxpc3QgPSByZXF1aXJlKCcuL3dpZi1saXN0Jyk7XHJcbnZhciBJY29uID0gcmVxdWlyZSgnLi9ib290c3RyYXAvaWNvbicpO1xyXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xyXG5cclxuXHJcbnZhciBOYXZCYXIgPVJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ05hdkJhcicsXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcHJvQWN0aXZlID0gdGhpcy5wcm9wcy5wYWdlID09ICdwcm9qZWN0cyc/J2FjdGl2ZSc6Jyc7XHJcbiAgICAgICAgdmFyIHdpZkFjdGl2ZSA9IHRoaXMucHJvcHMucGFnZSA9PSAnd2lmcyc/J2FjdGl2ZSc6Jyc7XHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5uYXYoIHtjbGFzc05hbWU6XCJuYXZiYXIgbmF2YmFyLWRlZmF1bHRcIiwgcm9sZTpcIm5hdmlnYXRpb25cIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29udGFpbmVyLWZsdWlkXCJ9LCBcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJuYXZiYXItaGVhZGVyXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYSgge2NsYXNzTmFtZTpcIm5hdmJhci1icmFuZFwiLCBocmVmOlwiI1wifSwgSWNvbigge2ljb246XCJmaXJlXCJ9KSxcbiAgICAgICAgICAgICAgICAgICAgXCIgUmFuZG9tIFdlYXZlIFN0cmlwZXNcIilcclxuICAgICAgICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibmF2IG5hdmJhci1uYXZcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5saSgge2NsYXNzTmFtZTpwcm9BY3RpdmV9LCBSZWFjdC5ET00uYSgge2hyZWY6XCIjcHJvamVjdHNcIn0sIFwiUHJvamVjdHNcIikpXHJcbiAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibmF2IG5hdmJhci1uYXZcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5saSgge2NsYXNzTmFtZTp3aWZBY3RpdmV9LCBSZWFjdC5ET00uYSgge2hyZWY6XCIjd2lmc1wifSwgXCJXaWZzXCIpKVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG52YXIgVXBsb2FkRm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1VwbG9hZEZvcm0nLFxyXG4gICAgb25TdWJtaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuXHJcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgICAgICAgICBpZihldnQudGFyZ2V0LnJlYWR5U3RhdGUgIT0gMikgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZihldnQudGFyZ2V0LmVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydCgnRXJyb3Igd2hpbGUgcmVhZGluZyBmaWxlJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZpbGVjb250ZW50ID0gZXZ0LnRhcmdldC5yZXN1bHQ7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmV3SWQgPSBcIlwiICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwMDAwMCk7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShldnQudGFyZ2V0LnJlc3VsdCk7XHJcbiAgICAgICAgICAgIGRhdGEubmFtZSA9IGRhdGEubmFtZSArIFwiIFtJbXBvcnRlZF1cIjtcclxuICAgICAgICAgICAgc3RvcmFnZS5zYXZlKG5ld0lkLCBkYXRhKTtcclxuICAgICAgICAgICAgcm91dGllKHJvdXRpZS5sb29rdXAoJ3Byb2plY3QnLCB7aWQ6IG5ld0lkfSkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KHRoaXMucmVmcy5maWxlLmdldERPTU5vZGUoKS5maWxlc1swXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsaWNrRmlsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucmVmcy5maWxlLmdldERPTU5vZGUoKS5jbGljaygpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgc3R5bGU9e2NvbG9yOid3aGl0ZSd9O1xyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZm9ybSgge29uU3VibWl0OnRoaXMub25TdWJtaXR9LCBcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaDQobnVsbCwgXCJJbXBvcnQgUHJvamVjdFwiKSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7dHlwZTpcImZpbGVcIiwgcmVmOlwiZmlsZVwiLCBjbGFzc05hbWU6XCJ3aGl0ZS1maWxlXCIsIHN0eWxlOnN0eWxlfSApLFJlYWN0LkRPTS5icihudWxsKSxcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOlwiYnRuIGJ0bi1kZWZhdWx0XCJ9LCBJY29uKCB7aWNvbjpcImZsb3BweS1vcGVuXCJ9KSwgXCIgSW1wb3J0XCIpXHJcbiAgICAgICAgICAgICAgIClcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlZCBieSBrYWp3aV8wMDAgb24gMjAxNC0wNC0wNy5cclxuICovXHJcbnZhciBQcm9qZWN0UGlja2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUHJvamVjdFBpY2tlcicsXHJcblxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHByb2plY3RzOiBbXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJvdXRpZSgnd2lmIHdpZi86aWQnLCBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGFnZUdyb3VwOiAnd2lmcycsIHBhZ2U6ICd3aWYnLCBpZDogaWR9KTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICByb3V0aWUoJ3dpZnMgd2lmcycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGFnZUdyb3VwOiAnd2lmcycsIHBhZ2U6ICd3aWZzJ30pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJvdXRpZSgncHJvamVjdCBwcm9qZWN0LzppZCcsIGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwYWdlR3JvdXA6ICdwcm9qZWN0cycsIHBhZ2U6ICdwcm9qZWN0JywgaWQ6IGlkfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgcm91dGllKCcqJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwYWdlR3JvdXA6ICdwcm9qZWN0cycsICBwYWdlOiAncHJvamVjdHMnfSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2N1cnJlbnRJZDogbnVsbCwgIHByb2plY3RzOiBzdG9yYWdlLmxpc3RQcm9qZWN0cygpfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH0sXHJcblxyXG5cclxuXHJcbiAgICBjcmVhdGVOZXc6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbmV3SWQgPSBcIlwiICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwMDAwMCk7XHJcbiAgICAgICAgcm91dGllKHJvdXRpZS5sb29rdXAoJ3Byb2plY3QnLCB7aWQ6IG5ld0lkfSkpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcGFnZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucGFnZSA9PSAncHJvamVjdCcpIHtcclxuICAgICAgICAgICAgcGFnZSA9IEFwcGxpY2F0aW9uKCB7aWQ6dGhpcy5zdGF0ZS5pZH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuc3RhdGUucGFnZSA9PSAnd2lmJykge1xyXG4gICAgICAgICAgICBwYWdlID0gV2lmRWRpdG9yKCB7aWQ6dGhpcy5zdGF0ZS5pZH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuc3RhdGUucGFnZSA9PSAnd2lmcycpIHtcclxuICAgICAgICAgICAgcGFnZSA9IFdpZkxpc3QobnVsbClcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvamVjdHMgPSB0aGlzLnN0YXRlLnByb2plY3RzLnNsaWNlKCk7XHJcbiAgICAgICAgICAgIHByb2plY3RzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvbmUgPSAoYi5sYXN0Q2hhbmdlIHx8IDApIC0gKGEubGFzdENoYW5nZSB8fCAwKSA7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYob25lID09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9uZTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvamVjdFZpZXdzID0gcHJvamVjdHMubWFwKGZ1bmN0aW9uIChwcm9qZWN0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJldmlldztcclxuICAgICAgICAgICAgICAgIGlmKHByb2plY3QucmVzdWx0KXtcclxuICAgICAgICAgICAgICAgICAgICBwcmV2aWV3ID0gUmVzdWx0UmVuZGVyZXIoIHtyZXN1bHQ6cHJvamVjdC5yZXN1bHQsIGhlaWdodDpcIjIwXCJ9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBtYWtlTGluayhpbm5lcil7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5hKCB7aHJlZjonIycgKyByb3V0aWUubG9va3VwKCdwcm9qZWN0Jywge2lkOiBwcm9qZWN0LmlkfSl9LCBpbm5lcilcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIG1ha2VMaW5rKHByb2plY3QubmFtZSkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWtlTGluayhwcmV2aWV3KVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG5cclxuXHJcblxyXG5cclxuICAgICAgICAgICAgcGFnZSA9IFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb250YWluZXItZmx1aWRcIn0sIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmgxKCB7Y2xhc3NOYW1lOlwicGFnZS1oZWFkZXIgcGFnZS1oZWFkZXItbWFpblwifSwgXCJTYXZlZCBwcm9qZWN0c1wiKSxcclxuICAgICAgICAgICAgICAgIHByb2plY3RWaWV3cyxcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYSgge2NsYXNzTmFtZTpcImJ0biBidG4tZGVmYXVsdFwiLCBvbkNsaWNrOnRoaXMuY3JlYXRlTmV3fSwgSWNvbigge2ljb246XCJwbHVzXCJ9KSwgXCIgTmV3IFByb2plY3RcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmJyKG51bGwpLFJlYWN0LkRPTS5icihudWxsKSxcclxuICAgICAgICAgICAgICAgICAgICBVcGxvYWRGb3JtKG51bGwpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KG51bGwsIE5hdkJhcigge3BhZ2U6dGhpcy5zdGF0ZS5wYWdlR3JvdXB9KSxwYWdlKVxyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvamVjdFBpY2tlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXHJcblxyXG5cclxudmFyIHN0cmlwZXMgPSByZXF1aXJlKCcuL3N0cmlwZXMnKTtcclxuXHJcblxyXG52YXIgUmVuZGVyZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdSZW5kZXJlcicsXHJcbiAgICBjdHg6IG51bGwsXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucmVuZGVyUG9pbnRzKHRoaXMucHJvcHMpO1xyXG4gICAgfSxcclxuXHJcbi8vICAgIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24gKHByb3BzKSB7XHJcbi8vICAgICAgICB0aGlzLnJlbmRlclBvaW50cyhwcm9wcyk7XHJcbi8vICAgICAgICByZXR1cm4gZmFsc2U7XHJcbi8vICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAocHJvcHMpIHtcclxuICAgICAgICB3aW5kb3cuX2hhY2sgPSB3aW5kb3cuX2hhY2t8fHt9O1xyXG4gICAgICAgIHdpbmRvdy5faGFjay5jYW52YXMgPSB0aGlzLmdldERPTU5vZGUoKTtcclxuICAgICAgICB0aGlzLnJlbmRlclBvaW50cyh0aGlzLnByb3BzKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyUG9pbnRzOiBmdW5jdGlvbiAocHJvcHMpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gc3RyaXBlcyhwcm9wcy5sYXllcnMsIHRoaXMucHJvcHMuc2l6ZS54LCB0aGlzLnByb3BzLmJhY2tncm91bmRDb2xvcik7XHJcblxyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldERPTU5vZGUoKS5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgICAgICB2YXIgc2l6ZT0gdGhpcy5wcm9wcy5zaXplO1xyXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSAnZ3JleSc7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIHNpemUueCwgc2l6ZS55KTtcclxuXHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSByZXN1bHRbaV07XHJcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdChpLCAwLCAxLCBzaXplLnkpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbi8vICAgICAgICByZXR1cm4gPGRpdj5oZWxsbzwvZGl2PlxyXG4gICAgICAgIHJldHVybiAgUmVhY3QuRE9NLmNhbnZhcygge3dpZHRoOnRoaXMucHJvcHMuc2l6ZS54LCBoZWlnaHQ6dGhpcy5wcm9wcy5zaXplLnl9KVxyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblxyXG5cclxuXHJcbnZhciBzdHJpcGVzID0gcmVxdWlyZSgnLi9zdHJpcGVzJyk7XHJcblxyXG5cclxudmFyIFJlbmRlcmVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUmVuZGVyZXInLFxyXG4gICAgY3R4OiBudWxsLFxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnJlbmRlclBvaW50cyh0aGlzLnByb3BzKTtcclxuICAgIH0sXHJcblxyXG4vLyAgICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uIChwcm9wcykge1xyXG4vLyAgICAgICAgdGhpcy5yZW5kZXJQb2ludHMocHJvcHMpO1xyXG4vLyAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4vLyAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByb3BzKSB7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJQb2ludHModGhpcy5wcm9wcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlclBvaW50czogZnVuY3Rpb24gKHByb3BzKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHByb3BzLnJlc3VsdDtcclxuXHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0RE9NTm9kZSgpLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgICAgIHZhciBzaXplPSB0aGlzLnByb3BzLnNpemU7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdwaW5rJztcclxuICAgICAgICBjdHguZmlsbFJlY3QoMCwgMCwgcmVzdWx0Lmxlbmd0aCwgcHJvcHMuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHJlc3VsdFtpXTtcclxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0KGksIDAsIDEsIHByb3BzLmhlaWdodCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuICBSZWFjdC5ET00uY2FudmFzKCB7d2lkdGg6dGhpcy5wcm9wcy5yZXN1bHQubGVuZ3RoLCBoZWlnaHQ6dGhpcy5wcm9wcy5oZWlnaHR9KVxyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyZXI7IiwidmFyIFJuZCA9IHt9O1xyXG5cclxuUm5kLmNvbG9yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGNvbG9yID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTY3NzcyMTYpLnRvU3RyaW5nKDE2KTtcclxuICAgIHJldHVybiAnIzAwMDAwMCcuc2xpY2UoMCwgLWNvbG9yLmxlbmd0aCkgKyBjb2xvcjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUm5kO1xyXG4iLCJ2YXIgUm5kID0gcmVxdWlyZSgnLi9ybmQnKTtcclxudmFyIE5hbWVHZW4gPSByZXF1aXJlKCcuL25hbWUtZ2VuJyk7XHJcbnZhciBMYXllciA9IHJlcXVpcmUoJy4vZGF0YS9sYXllcicpO1xyXG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL2RhdGEvcG9pbnQnKTtcclxuXHJcbnZhciBzdHJpcGVzID0gcmVxdWlyZSgnLi9zdHJpcGVzJyk7XHJcblxyXG52YXIgZHVtbXkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIG5hbWU6IE5hbWVHZW4uY29sb3JBbmltYWwoKSxcclxuICAgICAgICBzaXplOiB7XHJcbiAgICAgICAgICAgIHg6IDgwMCxcclxuICAgICAgICAgICAgeTogMjAwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlZGl0b3JTaXplOiAzMDAsXHJcbiAgICAgICAgc2VsZWN0SW5MYXllckVkaXRvcjogdHJ1ZSxcclxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFJuZC5jb2xvcigpLFxyXG4gICAgICAgIGxheWVyRGF0YToge1xyXG4gICAgICAgICAgICBzZWxlY3RlZDoxLFxyXG4gICAgICAgICAgICBsYXllcnM6IFtcclxuICAgICAgICAgICAgICAgIG5ldyBMYXllcihSbmQuY29sb3IoKSwgW1xyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBQb2ludChNYXRoLnJhbmRvbSgpLCBNYXRoLnJhbmRvbSgpKSxcclxuICAgICAgICAgICAgICAgICAgICBuZXcgUG9pbnQoTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSksXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IFBvaW50KE1hdGgucmFuZG9tKCksIE1hdGgucmFuZG9tKCkpXHJcbiAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgIG5ldyBMYXllcihSbmQuY29sb3IoKSwgW1xyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBQb2ludChNYXRoLnJhbmRvbSgpLCBNYXRoLnJhbmRvbSgpKSxcclxuICAgICAgICAgICAgICAgICAgICBuZXcgUG9pbnQoTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSlcclxuICAgICAgICAgICAgICAgIF0pXVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5cclxudmFyIHByb2plY3RQcmVmaXggPSBcInJhbmRvbS13ZWF2ZS1cIjtcclxudmFyIHN0b3JhZ2UgPSB7XHJcbiAgICBzYXZlOiBmdW5jdGlvbiAoaWQsIGRhdGEpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gc3RyaXBlcyhkYXRhLmxheWVyRGF0YS5sYXllcnMsIGRhdGEuc2l6ZS54LCBkYXRhLmJhY2tncm91bmRDb2xvcik7XHJcbiAgICAgICAgdmFyIGRlc2MgPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogaWQsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBkYXRhLm5hbWUsXHJcbiAgICAgICAgICAgICAgICByZXN1bHQ6IHJlc3VsdCxcclxuICAgICAgICAgICAgICAgIGxhc3RDaGFuZ2U6IERhdGUubm93KClcclxuICAgICAgICB9O1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi1kYXRhLVwiICsgaWQsIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItZGVzYy1cIiArIGlkLCBKU09OLnN0cmluZ2lmeShkZXNjKSk7XHJcbiAgICB9LFxyXG4gICAgbG9hZDogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIGl0ZW0gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItZGF0YS1cIiArIGlkKTtcclxuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShpdGVtKTtcclxuICAgICAgICAgICAgICAgIGRhdGEuYmFja2dyb3VuZENvbG9yID0gZGF0YS5iYWNrZ3JvdW5kQ29sb3IgfHwgJyNmY2ZjZmMnO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IGR1bW15KCk7XHJcbiAgICAgICAgdGhpcy5zYXZlKGlkLCBkYXRhKTtcclxuICAgICAgICByZXR1cm4gIGRhdGE7XHJcbiAgICB9LFxyXG4gICAgc2F2ZVdpZjogZnVuY3Rpb24gKGRlc2MsIGRhdGEpIHtcclxuICAgICAgICB2YXIgaWQgPSBkZXNjLmlkO1xyXG5cclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItd2lmLWRhdGEtXCIgKyBpZCwgZGF0YSk7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLXdpZi1kZXNjLVwiICsgaWQsIEpTT04uc3RyaW5naWZ5KGRlc2MpKTtcclxuXHJcbiAgICB9LFxyXG4gICAgc2F2ZVdpZkRlc2M6IGZ1bmN0aW9uIChkZXNjKSB7XHJcbiAgICAgICAgdmFyIGlkID0gZGVzYy5pZDtcclxuICAgICAgICB2YXIgY29weSA9IF8uY2xvbmUoZGVzYyk7XHJcbiAgICAgICAgZGVsZXRlIGNvcHkuZGF0YTtcclxuXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLXdpZi1kZXNjLVwiICsgaWQsIEpTT04uc3RyaW5naWZ5KGRlc2MpKTtcclxuXHJcbiAgICB9LFxyXG4gICAgbG9hZFdpZjogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItd2lmLWRhdGEtXCIgKyBpZCk7XHJcbiAgICAgICAgdmFyIGRlc2MgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi13aWYtZGVzYy1cIiArIGlkKSk7XHJcbiAgICAgICAgZGVzYy5kYXRhID0gZGF0YTtcclxuICAgICAgICByZXR1cm4gZGVzYztcclxuICAgIH0sXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi1kYXRhLVwiICsgaWQsIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItZGVzYy1cIiArIGlkLCBKU09OLnN0cmluZ2lmeShkZXNjKSk7XHJcbiAgICB9LFxyXG4gICAgbGlzdFByb2plY3RzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHByb2plY3RzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb2NhbFN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IGxvY2FsU3RvcmFnZS5rZXkoaSk7XHJcbiAgICAgICAgICAgIGlmKGtleS5pbmRleE9mKHByb2plY3RQcmVmaXggKyBcIi1kZXNjLVwiKSA9PT0gMCl7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGVzYyA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSlcclxuICAgICAgICAgICAgICAgIHByb2plY3RzLnB1c2goZGVzYyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9qZWN0cztcclxuICAgIH0sXHJcbiAgICBsaXN0V2lmczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB3aWZzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb2NhbFN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IGxvY2FsU3RvcmFnZS5rZXkoaSk7XHJcbiAgICAgICAgICAgIGlmKGtleS5pbmRleE9mKHByb2plY3RQcmVmaXggKyBcIi13aWYtZGVzYy1cIikgPT09IDApe1xyXG4gICAgICAgICAgICAgICAgdmFyIGRlc2MgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpXHJcbiAgICAgICAgICAgICAgICB3aWZzLnB1c2goZGVzYyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB3aWZzO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRPcGVuVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi1vcGVuLXRhYlwiKTtcclxuICAgIH0sXHJcbiAgICBzZXRPcGVuVGFiOiBmdW5jdGlvbiAodGFiKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLW9wZW4tdGFiXCIsIHRhYik7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cz0gc3RvcmFnZTtcclxuIiwidmFyIE1hdGhVdGlscyA9IHJlcXVpcmUoJy4vbWF0aC11dGlscycpO1xyXG5cclxudmFyIHNlZWRSYW5kb20gPSBmdW5jdGlvbiAoc2VlZCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgeCA9IE1hdGguc2luKHNlZWQrKykgKiAxMDAwMDtcclxuICAgICAgICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChsYXllcnMsIHNpemUsIGJhY2tncm91bmQpIHtcclxuICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgIGZvciAodmFyIGYgPSAwOyBmIDwgc2l6ZTsgZisrKSB7XHJcbiAgICAgICAgcmVzdWx0LnB1c2goYmFja2dyb3VuZCB8fCBcIiNmY2ZjZmNcIik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHNjYWxlID0gZnVuY3Rpb24gKHApIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiBwLnggKiBzaXplLFxyXG4gICAgICAgICAgICB5OiAxIC0gcC55XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgZm9yICh2YXIgbGkgPSAwOyBsaSA8IGxheWVycy5sZW5ndGg7IGxpKyspIHtcclxuICAgICAgICB2YXIgbGF5ZXIgPSBsYXllcnNbbGldO1xyXG5cclxuICAgICAgICBybmQgPSBzZWVkUmFuZG9tKGxheWVyLnNlZWQgfHwgbGkrMSk7XHJcbiAgICAgICAgdmFyIHBvaW50cyA9IGxheWVyLnBvaW50cztcclxuXHJcbiAgICAgICAgdmFyIHplcm8gPSB7eDowLCB5OjB9O1xyXG4gICAgICAgIHZhciBtYXggPSB7eDogc2l6ZS0xLCB5OjF9O1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcG9pbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBwMSA9IHNjYWxlKHBvaW50c1tpIC0gMV0pO1xyXG4gICAgICAgICAgICB2YXIgcDIgPSBzY2FsZShwb2ludHNbaV0pO1xyXG4gICAgICAgICAgICBNYXRoVXRpbHMuY29uc3RyYWluUG9pbnQocDEsIHplcm8sIG1heCk7XHJcbiAgICAgICAgICAgIE1hdGhVdGlscy5jb25zdHJhaW5Qb2ludChwMiwgemVybywgbWF4KTtcclxuICAgICAgICAgICAgcDEueCA9IE1hdGguZmxvb3IocDEueCk7XHJcbiAgICAgICAgICAgIHAyLnggPSBNYXRoLmZsb29yKHAyLngpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG0gPSAocDIueSAtIHAxLnkpIC8gKHAyLnggLSBwMS54KTtcclxuICAgICAgICAgICAgdmFyIGIgPSBwMS55IC0gbSAqIHAxLng7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gcDEueDsgaiA8PSBwMi54OyBqKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBybmRWYWwgPSBybmQoKTtcclxuICAgICAgICAgICAgICAgIHZhciB5ID0gbSAqIGogKyBiO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChybmRWYWwgPD0geSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtqXSA9IGxheWVyLmNvbG9yO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXHJcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge3dpZkRhdGE6e319O1xyXG4gICAgfSxcclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7d2lmRGF0YTogc3RvcmFnZS5sb2FkV2lmKHRoaXMucHJvcHMuaWQpfSk7XHJcbiAgICB9LFxyXG4gICAgb25OYW1lQ2hhbmdlOiBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHZhciBjb3B5ID0gXy5jbG9uZSh0aGlzLnN0YXRlLndpZkRhdGEpO1xyXG4gICAgICAgIGNvcHkubmFtZSA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgICAgIHN0b3JhZ2Uuc2F2ZVdpZkRlc2MoY29weSk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7d2lmRGF0YTogY29weX0pO1xyXG4gICAgfSxcclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29udGFpbmVyLWZsdWlkXCJ9LCBSZWFjdC5ET00uaDEobnVsbCwgdGhpcy5zdGF0ZS53aWZEYXRhLm5hbWUpLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt2YWx1ZTp0aGlzLnN0YXRlLndpZkRhdGEubmFtZSwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsIG9uQ2hhbmdlOnRoaXMub25OYW1lQ2hhbmdlfSApLFJlYWN0LkRPTS5icihudWxsKSwgUmVhY3QuRE9NLnByZShudWxsLCB0aGlzLnN0YXRlLndpZkRhdGEuZGF0YSkpO1xyXG4gICAgfVxyXG59KTtcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblxyXG52YXIgSWNvbiA9IHJlcXVpcmUoJy4vYm9vdHN0cmFwL2ljb24nKTtcclxudmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuXHJcblxyXG52YXIgVXBsb2FkV2lmRm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1VwbG9hZFdpZkZvcm0nLFxyXG4gICAgb25TdWJtaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICB2YXIgbmFtZTtcclxuXHJcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgICAgICAgICBpZihldnQudGFyZ2V0LnJlYWR5U3RhdGUgIT0gMikgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZihldnQudGFyZ2V0LmVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydCgnRXJyb3Igd2hpbGUgcmVhZGluZyBmaWxlJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZpbGVjb250ZW50ID0gZXZ0LnRhcmdldC5yZXN1bHQ7XHJcbiAgICAgICAgICAgIHZhciBuZXdJZCA9IFwiXCIgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMDAwKTtcclxuXHJcbiAgICAgICAgICAgIHN0b3JhZ2Uuc2F2ZVdpZih7aWQ6IG5ld0lkLCBuYW1lOiBuYW1lfSwgZmlsZWNvbnRlbnQpO1xyXG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uVXBsb2FkKCk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgICAgICB2YXIgZmlsZSA9IHRoaXMucmVmcy5maWxlLmdldERPTU5vZGUoKS5maWxlc1swXTtcclxuICAgICAgICBuYW1lID0gZmlsZS5uYW1lLnJlcGxhY2UoXCIud2lmXCIsXCJcIik7XHJcbiAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsaWNrRmlsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucmVmcy5maWxlLmdldERPTU5vZGUoKS5jbGljaygpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgc3R5bGU9e2NvbG9yOid3aGl0ZSd9O1xyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZm9ybSgge29uU3VibWl0OnRoaXMub25TdWJtaXR9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIFwiSW1wb3J0IFdpZlwiKSxcclxuXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3R5cGU6XCJmaWxlXCIsIHJlZjpcImZpbGVcIiwgY2xhc3NOYW1lOlwid2hpdGUtZmlsZVwiLCBzdHlsZTpzdHlsZX0gKSxSZWFjdC5ET00uYnIobnVsbCksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIn0sIEljb24oIHtpY29uOlwiYm9va1wifSksIFwiIEltcG9ydFwiKVxyXG4gICAgICAgIClcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4geyAgICAgICAgICAgIHdpZnM6IFtdXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlZnJlc2hXaWY6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHt3aWZzOiBzdG9yYWdlLmxpc3RXaWZzKCl9KTtcclxuICAgIH0sXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgdGhpcy5yZWZyZXNoV2lmKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB3aWZzID0gdGhpcy5zdGF0ZS53aWZzO1xyXG5cclxuICAgICAgICB2YXIgd2lmVmlld3MgPSB3aWZzLm1hcChmdW5jdGlvbiAod2lmKSB7XHJcblxyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gbWFrZUxpbmsoaW5uZXIpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5hKCB7aHJlZjonIycgKyByb3V0aWUubG9va3VwKCd3aWYnLCB7aWQ6IHdpZi5pZH0pfSwgaW5uZXIpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiAoUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5oNChudWxsLCBtYWtlTGluayh3aWYubmFtZSkpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbnRhaW5lci1mbHVpZFwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMSgge2NsYXNzTmFtZTpcInBhZ2UtaGVhZGVyIHBhZ2UtaGVhZGVyLW1haW5cIn0sIFwiSW1wb3J0ZWQgV2lmc1wiKSxcclxuICAgICAgICAgICAgd2lmVmlld3MsXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcclxuICAgICAgICAgICAgVXBsb2FkV2lmRm9ybSgge29uVXBsb2FkOnRoaXMucmVmcmVzaFdpZn0pXHJcbiAgICAgICAgKVxyXG5cclxuICAgIH1cclxuXHJcblxyXG59KTtcclxuIl19
