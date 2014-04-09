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

    saveResult: function () {
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

        var result = stripes(this.props.appState.layerData.layers, this.props.appState.size.x);

        var nl = "\r\n";
        var colorsArray = [];
        var data = "[COLORS]" + nl;
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

        var filename = s.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data2 + data));
        pom.setAttribute('download', this.getFileName() +"_result.txt");
        pom.click();
    },

    saveImage: function () {
        alert("not implemented");
    },
    saveProject: function () {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.props.appState)));
        pom.setAttribute('download', this.getFileName() +"_project.json");
        pom.click();

    },
    render: function () {
        return React.DOM.div(null, 
            React.DOM.div( {className:"row"}, 
                    React.DOM.h4(null, "Downloads")
            ),
            React.DOM.div( {className:"row"}, 
                IconButton( {icon:"floppy-save", title:"Project", className:"download-button", onClick:this.saveProject}),
                IconButton( {icon:"picture", title:"Image", className:"download-button", onClick:this.saveImage}),
                IconButton( {icon:"list-alt", title:"Result", className:"download-button", onClick:this.saveResult} )
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
    render: function () {
        var appState = this.props.appState;
        return React.DOM.div( {className:"inspectorBox container-fluid"}, 
            ProjectDownloads( {appState:appState}),
            ProjectSizes( {size:appState.size,
                editorSize:appState.editorSize,
                onSizeChanged:this.props.onSizeChanged,
                onEditorSizeChange:this.props.onEditorSizeChange}),

            LayerList( {layerData:appState.layerData, size:appState.size, onChange:this.props.onLayerDataChange})
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

    onEditorSizeChange: function (val) {
        var fixed = Math.max(10, parseInt(val) || 100);
        this.setState({editorSize: fixed});
    },

    showNameEditor: function (show) {
        this.setState({editName: show });
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
            onEditorSizeChange:this.onEditorSizeChange}
            ),

            React.DOM.div( {className:"stripesAreaBox"}, 
                React.DOM.div(null, 
                    Renderer( {layers:this.state.layerData.layers, size:this.state.size})
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
            return SingleLineEditor( {size:s, color:layer.color, markColor:markColor, markSize:markSize,  points:scaledPoints, onChange:this.onLineChange.bind(this, i), onPointTouch:this.onPointTouch.bind(this, i)});
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
var Icon = require('./bootstrap/icon');
var storage = require('./storage');


var NavBar =React.createClass({displayName: 'NavBar',
    render: function () {
        return React.DOM.nav( {className:"navbar navbar-default", role:"navigation"}, 
            React.DOM.div( {className:"container-fluid"}, 
                React.DOM.div( {className:"navbar-header"}, 
                    React.DOM.a( {className:"navbar-brand", href:"#"}, Icon( {icon:"fire"}),
                    " Random Weave Stripes")
                ),

                React.DOM.ul( {className:"nav navbar-nav"}, 
                    React.DOM.li( {className:"active"}, React.DOM.a( {href:"#"}, "Projects"))
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
        return React.DOM.form(null, 
                    React.DOM.button( {className:"btn btn-default", onClick:this.clickFile}, Icon( {icon:"floppy-open"}), " Import Project"),
                    React.DOM.input( {type:"file", ref:"file", onChange:this.onSubmit, className:"hidden"})
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
        routie('project project/:id', function (id) {
            console.log(id);
            this.setState({currentId: id});
        }.bind(this));

        routie('*', function () {
            this.setState({currentId: null,  projects: storage.listProjects()});
        }.bind(this));
    },

    createNew: function () {
        var newId = "" + Math.floor(Math.random() * 1000000000);
        routie(routie.lookup('project', {id: newId}));
    },

    render: function () {

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

        var page;

        if (this.state.currentId) {
            page = Application( {id:this.state.currentId})
        }
        else {
            page = React.DOM.div( {className:"container-fluid"}, 
                React.DOM.h1( {className:"page-header page-header-main"}, "Saved projects"),
                projectViews,
                React.DOM.hr(null),

                    React.DOM.a( {className:"btn btn-default", onClick:this.createNew}, Icon( {icon:"plus"}), " New Project"),
                    React.DOM.br(null),React.DOM.br(null),
                    UploadForm(null)

            )
        }

        return React.DOM.div(null, NavBar(null),page)
    }
});

module.exports = ProjectPicker;
},{"./application":1,"./bootstrap/icon":3,"./result-renderer":13,"./storage":15}],12:[function(require,module,exports){
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
        var result = stripes(data.layerData.layers, data.size.x);
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
                return JSON.parse(item);
            }
        } catch (e) {
        }

        var data = dummy();
        this.save(id, data);
        return  data;
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

module.exports = function (layers, size) {
    var result = [];
    for (var f = 0; f < size; f++) {
        result.push("#fcfcfc");
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
},{"./math-utils":9}]},{},[6])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJlOlxccHJvamVjdHNcXGhvbWVcXHdlYXZlXFxyYW5kb20td2VhdmUtc3RyaXBlc1xcbm9kZV9tb2R1bGVzXFxncnVudC1icm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvYm9vdHN0cmFwL2ljb24tYnV0dG9uLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvYm9vdHN0cmFwL2ljb24uanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9kYXRhL2xheWVyLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvZGF0YS9wb2ludC5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL2luZGV4LmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvbGF5ZXItbGluZXMtZWRpdG9yLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvbGF5ZXItbGlzdC5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL21hdGgtdXRpbHMuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9uYW1lLWdlbi5qcyIsImU6L3Byb2plY3RzL2hvbWUvd2VhdmUvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL3Byb2plY3QtcGlja2VyLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvcmVuZGVyZXIuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9yZXN1bHQtcmVuZGVyZXIuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9ybmQuanMiLCJlOi9wcm9qZWN0cy9ob21lL3dlYXZlL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9zdG9yYWdlLmpzIiwiZTovcHJvamVjdHMvaG9tZS93ZWF2ZS9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvc3RyaXBlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdm5CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxudmFyIFJuZCA9IHJlcXVpcmUoJy4vcm5kJyk7XHJcblxyXG52YXIgTGF5ZXIgPSByZXF1aXJlKCcuL2RhdGEvbGF5ZXInKTtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9kYXRhL3BvaW50Jyk7XHJcblxyXG52YXIgSWNvbiA9IHJlcXVpcmUoJy4vYm9vdHN0cmFwL2ljb24nKTtcclxuXHJcbnZhciBSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKTtcclxudmFyIExheWVyTGluZXNFZGl0b3IgPSByZXF1aXJlKCcuL2xheWVyLWxpbmVzLWVkaXRvcicpO1xyXG52YXIgTGF5ZXJMaXN0ID0gcmVxdWlyZSgnLi9sYXllci1saXN0Jyk7XHJcbnZhciBJY29uQnV0dG9uID0gcmVxdWlyZSgnLi9ib290c3RyYXAvaWNvbi1idXR0b24nKTtcclxuXHJcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XHJcblxyXG52YXIgc3RyaXBlcyA9IHJlcXVpcmUoJy4vc3RyaXBlcycpO1xyXG5cclxuXHJcblxyXG52YXIgY2hhbmdlZCA9IGZ1bmN0aW9uICh0YXJnZXQsIGNoYW5nZXMpIHtcclxuICAgIHJldHVybiBfLmV4dGVuZChfLmNsb25lKHRhcmdldCksIGNoYW5nZXMpO1xyXG59O1xyXG5cclxuXHJcbnZhciBLaW5kSW5wdXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdLaW5kSW5wdXQnLFxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdmFsdWU6IHRoaXMucHJvcHMudmFsdWVcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBvbkNoYW5nZTogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB2YXIgdiA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiB2fSk7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZSh2KTtcclxuICAgIH0sXHJcblxyXG4gICAgb25CbHVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dmFsdWU6IHRoaXMucHJvcHMudmFsdWV9KTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHN0eWxlID0ge307XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnByb3BzLnZhbHVlICE9IHRoaXMuc3RhdGUudmFsdWUpIHtcclxuICAgICAgICAgICAgc3R5bGUuY29sb3IgPSAnb3JhbmdlJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhSZWFjdC5ET00uaW5wdXQoIHt2YWx1ZTp0aGlzLnN0YXRlLnZhbHVlLCBvbkNoYW5nZTp0aGlzLm9uQ2hhbmdlLCBzdHlsZTpzdHlsZSwgb25CbHVyOnRoaXMub25CbHVyfSkpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbnZhciBQcm9qZWN0RG93bmxvYWRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUHJvamVjdERvd25sb2FkcycsXHJcbiAgICBnZXRGaWxlTmFtZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBuYW1lID0gdGhpcy5wcm9wcy5hcHBTdGF0ZS5uYW1lIHx8IFwibm9uYW1lXCI7XHJcbiAgICAgICAgdmFyIGZpbGVuYW1lID0gbmFtZS5yZXBsYWNlKC9bXmEtejAtOV0vZ2ksICdfJykudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICByZXR1cm4gZmlsZW5hbWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHNhdmVSZXN1bHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBmdW5jdGlvbiBoZXhUb1JnYihoZXgpIHtcclxuICAgICAgICAgICAgLy8gRXhwYW5kIHNob3J0aGFuZCBmb3JtIChlLmcuIFwiMDNGXCIpIHRvIGZ1bGwgZm9ybSAoZS5nLiBcIjAwMzNGRlwiKVxyXG4gICAgICAgICAgICB2YXIgc2hvcnRoYW5kUmVnZXggPSAvXiM/KFthLWZcXGRdKShbYS1mXFxkXSkoW2EtZlxcZF0pJC9pO1xyXG4gICAgICAgICAgICBoZXggPSBoZXgucmVwbGFjZShzaG9ydGhhbmRSZWdleCwgZnVuY3Rpb24gKG0sIHIsIGcsIGIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByICsgciArIGcgKyBnICsgYiArIGI7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IC9eIz8oW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkkL2kuZXhlYyhoZXgpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0ID8ge1xyXG4gICAgICAgICAgICAgICAgcjogcGFyc2VJbnQocmVzdWx0WzFdLCAxNiksXHJcbiAgICAgICAgICAgICAgICBnOiBwYXJzZUludChyZXN1bHRbMl0sIDE2KSxcclxuICAgICAgICAgICAgICAgIGI6IHBhcnNlSW50KHJlc3VsdFszXSwgMTYpXHJcbiAgICAgICAgICAgIH0gOiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHN0cmlwZXModGhpcy5wcm9wcy5hcHBTdGF0ZS5sYXllckRhdGEubGF5ZXJzLCB0aGlzLnByb3BzLmFwcFN0YXRlLnNpemUueCk7XHJcblxyXG4gICAgICAgIHZhciBubCA9IFwiXFxyXFxuXCI7XHJcbiAgICAgICAgdmFyIGNvbG9yc0FycmF5ID0gW107XHJcbiAgICAgICAgdmFyIGRhdGEgPSBcIltDT0xPUlNdXCIgKyBubDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgY29sb3IgPSByZXN1bHRbaV07XHJcbiAgICAgICAgICAgIHZhciBuciA9IGNvbG9yc0FycmF5LmluZGV4T2YoY29sb3IpO1xyXG4gICAgICAgICAgICBpZiAobnIgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb2xvcnNBcnJheS5wdXNoKGNvbG9yKTtcclxuICAgICAgICAgICAgICAgIG5yID0gY29sb3JzQXJyYXkubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkYXRhICs9IChpICsgMSkgKyBcIj1cIiArIChuciArIDEpICsgbmw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZGF0YTIgPSBcIltDT0xPUiBUQUJMRV1cIiArIG5sO1xyXG5cclxuXHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb2xvcnNBcnJheS5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB2YXIgYyA9IGNvbG9yc0FycmF5W2pdO1xyXG4gICAgICAgICAgICB2YXIgcmdiID0gaGV4VG9SZ2IoYyk7XHJcbiAgICAgICAgICAgIGRhdGEyICs9IChqICsgMSkgKyBcIj1cIiArIHJnYi5yICsgXCIsXCIgKyByZ2IuZyArIFwiLFwiICsgcmdiLmIgKyBubDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBmaWxlbmFtZSA9IHMucmVwbGFjZSgvW15hLXowLTldL2dpLCAnXycpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgdmFyIHBvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICBwb20uc2V0QXR0cmlidXRlKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQoZGF0YTIgKyBkYXRhKSk7XHJcbiAgICAgICAgcG9tLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCB0aGlzLmdldEZpbGVOYW1lKCkgK1wiX3Jlc3VsdC50eHRcIik7XHJcbiAgICAgICAgcG9tLmNsaWNrKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNhdmVJbWFnZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGFsZXJ0KFwibm90IGltcGxlbWVudGVkXCIpO1xyXG4gICAgfSxcclxuICAgIHNhdmVQcm9qZWN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHBvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICBwb20uc2V0QXR0cmlidXRlKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkodGhpcy5wcm9wcy5hcHBTdGF0ZSkpKTtcclxuICAgICAgICBwb20uc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHRoaXMuZ2V0RmlsZU5hbWUoKSArXCJfcHJvamVjdC5qc29uXCIpO1xyXG4gICAgICAgIHBvbS5jbGljaygpO1xyXG5cclxuICAgIH0sXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIFwiRG93bmxvYWRzXCIpXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICAgICAgSWNvbkJ1dHRvbigge2ljb246XCJmbG9wcHktc2F2ZVwiLCB0aXRsZTpcIlByb2plY3RcIiwgY2xhc3NOYW1lOlwiZG93bmxvYWQtYnV0dG9uXCIsIG9uQ2xpY2s6dGhpcy5zYXZlUHJvamVjdH0pLFxyXG4gICAgICAgICAgICAgICAgSWNvbkJ1dHRvbigge2ljb246XCJwaWN0dXJlXCIsIHRpdGxlOlwiSW1hZ2VcIiwgY2xhc3NOYW1lOlwiZG93bmxvYWQtYnV0dG9uXCIsIG9uQ2xpY2s6dGhpcy5zYXZlSW1hZ2V9KSxcclxuICAgICAgICAgICAgICAgIEljb25CdXR0b24oIHtpY29uOlwibGlzdC1hbHRcIiwgdGl0bGU6XCJSZXN1bHRcIiwgY2xhc3NOYW1lOlwiZG93bmxvYWQtYnV0dG9uXCIsIG9uQ2xpY2s6dGhpcy5zYXZlUmVzdWx0fSApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG52YXIgUHJvamVjdFNpemVzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUHJvamVjdFNpemVzJyxcclxuICAgIG9uV2lkdGhDaGFuZ2U6IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgZml4ZWQgPSBNYXRoLm1heCgxMCwgcGFyc2VJbnQodmFsKSB8fCAxMDApO1xyXG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uU2l6ZUNoYW5nZWQoe3g6IGZpeGVkfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgb25IZWlnaHRDaGFuZ2U6IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgZml4ZWQgPSBNYXRoLm1heCgxMCwgcGFyc2VJbnQodmFsKSB8fCAxMDApO1xyXG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uU2l6ZUNoYW5nZWQoe3k6IGZpeGVkfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBpZCA9IFwiXCIgKyBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICAgIHJldHVybiAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXAgaC1zcGFjZWRcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5oNChudWxsLCBcIlNpemVzXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cFwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEtpbmRJbnB1dCgge2lkOmlkLCB0eXBlOlwidGV4dFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgIHZhbHVlOnRoaXMucHJvcHMuc2l6ZS54LCBvbkNoYW5nZTp0aGlzLm9uV2lkdGhDaGFuZ2V9ICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXAtYWRkb25cIn0sIFwieFwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgS2luZElucHV0KCB7dHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsIHZhbHVlOnRoaXMucHJvcHMuc2l6ZS55LCBvbkNoYW5nZTp0aGlzLm9uSGVpZ2h0Q2hhbmdlfSApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwLWFkZG9uXCJ9LCBcImVkaXRcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEtpbmRJbnB1dCgge3R5cGU6XCJ0ZXh0XCIsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1zbVwiLCAgdmFsdWU6dGhpcy5wcm9wcy5lZGl0b3JTaXplLCBvbkNoYW5nZTp0aGlzLnByb3BzLm9uRWRpdG9yU2l6ZUNoYW5nZX0gKVxyXG4gICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICApO1xyXG5cclxuICAgIH1cclxufSk7XHJcblxyXG5cclxudmFyIEluc3BlY3RvckJveCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0luc3BlY3RvckJveCcsXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYXBwU3RhdGUgPSB0aGlzLnByb3BzLmFwcFN0YXRlO1xyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaW5zcGVjdG9yQm94IGNvbnRhaW5lci1mbHVpZFwifSwgXHJcbiAgICAgICAgICAgIFByb2plY3REb3dubG9hZHMoIHthcHBTdGF0ZTphcHBTdGF0ZX0pLFxyXG4gICAgICAgICAgICBQcm9qZWN0U2l6ZXMoIHtzaXplOmFwcFN0YXRlLnNpemUsXHJcbiAgICAgICAgICAgICAgICBlZGl0b3JTaXplOmFwcFN0YXRlLmVkaXRvclNpemUsXHJcbiAgICAgICAgICAgICAgICBvblNpemVDaGFuZ2VkOnRoaXMucHJvcHMub25TaXplQ2hhbmdlZCxcclxuICAgICAgICAgICAgICAgIG9uRWRpdG9yU2l6ZUNoYW5nZTp0aGlzLnByb3BzLm9uRWRpdG9yU2l6ZUNoYW5nZX0pLFxyXG5cclxuICAgICAgICAgICAgTGF5ZXJMaXN0KCB7bGF5ZXJEYXRhOmFwcFN0YXRlLmxheWVyRGF0YSwgc2l6ZTphcHBTdGF0ZS5zaXplLCBvbkNoYW5nZTp0aGlzLnByb3BzLm9uTGF5ZXJEYXRhQ2hhbmdlfSlcclxuICAgICAgICApXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbnZhciBBcHBsaWNhdGlvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FwcGxpY2F0aW9uJyxcclxuICAgIG1peGluczogW1JlYWN0LmFkZG9ucy5MaW5rZWRTdGF0ZU1peGluXSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gc3RvcmFnZS5sb2FkKHRoaXMucHJvcHMuaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvbkxheWVyRGF0YUNoYW5nZTogZnVuY3Rpb24gKG5ld0xheWVyRGF0YSkge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2xheWVyRGF0YTogbmV3TGF5ZXJEYXRhfSk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICBjaGFuZ2VTaXplOiBmdW5jdGlvbiAobmV3U2l6ZSkge1xyXG4gICAgICAgIHZhciBmaXhlZFNpemUgPSBjaGFuZ2VkKHRoaXMuc3RhdGUuc2l6ZSwgbmV3U2l6ZSk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2l6ZTogZml4ZWRTaXplfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHN0b3JhZ2Uuc2F2ZSh0aGlzLnByb3BzLmlkLCB0aGlzLnN0YXRlKTtcclxuICAgICAgICBpZih0aGlzLnN0YXRlLmVkaXROYW1lKXtcclxuICAgICAgICAgICAgdmFyIG5hbWVFZGl0b3IgPSB0aGlzLnJlZnMubmFtZUVkaXRvcjtcclxuICAgICAgICAgICAgaWYgKG5hbWVFZGl0b3IpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkb21Ob2RlID0gbmFtZUVkaXRvci5nZXRET01Ob2RlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZG9tTm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRvbU5vZGUuZm9jdXMoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBvbkVkaXRvclNpemVDaGFuZ2U6IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICB2YXIgZml4ZWQgPSBNYXRoLm1heCgxMCwgcGFyc2VJbnQodmFsKSB8fCAxMDApO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2VkaXRvclNpemU6IGZpeGVkfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNob3dOYW1lRWRpdG9yOiBmdW5jdGlvbiAoc2hvdykge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2VkaXROYW1lOiBzaG93IH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWRpdG9yU2l6ZSA9IHt4OiB0aGlzLnN0YXRlLnNpemUueCwgeTogdGhpcy5zdGF0ZS5lZGl0b3JTaXplIHx8IDEwMH07XHJcbiAgICAgICAgdmFyIG5hbWVDb21wb25lbnQgPSBSZWFjdC5ET00uc3Bhbigge29uQ2xpY2s6dGhpcy5zaG93TmFtZUVkaXRvci5iaW5kKHRoaXMsIHRydWUpfSwgdGhpcy5zdGF0ZS5uYW1lKVxyXG4gICAgICAgIGlmKHRoaXMuc3RhdGUuZWRpdE5hbWUpe1xyXG4gICAgICAgICAgICBuYW1lQ29tcG9uZW50ID0gUmVhY3QuRE9NLmlucHV0KCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsIHZhbHVlTGluazp0aGlzLmxpbmtTdGF0ZSgnbmFtZScpLCByZWY6XCJuYW1lRWRpdG9yXCIsIG9uQmx1cjp0aGlzLnNob3dOYW1lRWRpdG9yLmJpbmQodGhpcywgZmFsc2UpfSApXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbnRhaW5lci1mbHVpZFwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMSgge2NsYXNzTmFtZTpcInBhZ2UtaGVhZGVyIHBhZ2UtaGVhZGVyLW1haW5cIn0sIG5hbWVDb21wb25lbnQpLFxyXG5cclxuICAgICAgICAgICAgSW5zcGVjdG9yQm94KCB7YXBwU3RhdGU6dGhpcy5zdGF0ZSxcclxuICAgICAgICAgICAgb25MYXllckRhdGFDaGFuZ2U6dGhpcy5vbkxheWVyRGF0YUNoYW5nZSxcclxuICAgICAgICAgICAgb25TaXplQ2hhbmdlZDp0aGlzLmNoYW5nZVNpemUsXHJcbiAgICAgICAgICAgIG9uRWRpdG9yU2l6ZUNoYW5nZTp0aGlzLm9uRWRpdG9yU2l6ZUNoYW5nZX1cclxuICAgICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJzdHJpcGVzQXJlYUJveFwifSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICAgICAgICAgIFJlbmRlcmVyKCB7bGF5ZXJzOnRoaXMuc3RhdGUubGF5ZXJEYXRhLmxheWVycywgc2l6ZTp0aGlzLnN0YXRlLnNpemV9KVxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgIExheWVyTGluZXNFZGl0b3IoIHtjYW5TZWxlY3Q6dGhpcy5zdGF0ZS5zZWxlY3RJbkxheWVyRWRpdG9yLCBsYXllckRhdGE6dGhpcy5zdGF0ZS5sYXllckRhdGEsIG9uQ2hhbmdlOnRoaXMub25MYXllckRhdGFDaGFuZ2UsIHNpemU6ZWRpdG9yU2l6ZX0gKSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5icihudWxsKSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3R5cGU6XCJjaGVja2JveFwiLCBjaGVja2VkTGluazp0aGlzLmxpbmtTdGF0ZSgnc2VsZWN0SW5MYXllckVkaXRvcicpfSksXG4gICAgICAgICAgICAgICAgXCIgQWxsb3cgU2VsZWN0IFwiLFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5icihudWxsKSxSZWFjdC5ET00uYnIobnVsbCksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwid2VsbFwifSwgXG4gICAgICAgICAgICAgICAgICAgIFwiIFNoaWZ0K0NsaWNrIHRvIGFkZCBwb2ludHMgXCIsXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5icihudWxsKSxcbiAgICAgICAgICAgICAgICAgICAgXCIgQ3RybCtDbGljayB0byByZW1vdmUgcG9pbnRzIFwiXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY2xlYXItZml4IGFsZXJ0IGFsZXJ0LXdhcm5pbmdcIn0sIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJXYXJuaW5nIVwiKSwgXCIgVGhpcyBpcyBhIHdvcmsgaW4gcHJvZ3Jlc3MgdGhpbmcuIERvbid0IGV4cGVjdCBhbnl0aGluZyB0byB3b3JrIGFuZCB5b3VyIGRhdGEgbWlnaHQgZGlzYXBlYXIgYXQgYW55IG1vbWVudCFcIilcclxuICAgICAgICApXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb247XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxudmFyIEljb24gPSByZXF1aXJlKCcuL2ljb24nKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhSZWFjdC5ET00uYnV0dG9uKCB7dHlwZTpcImJ1dHRvblwiLCBjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIn0sIEljb24oIHtpY29uOnRoaXMucHJvcHMuaWNvbn0pLCB0aGlzLnByb3BzLnRpdGxlP1wiIFwiICsgdGhpcy5wcm9wcy50aXRsZTonJykpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxudmFyIEljb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdJY29uJyxcclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBpY29uID0gXCJnbHlwaGljb24gZ2x5cGhpY29uLVwiICsgdGhpcy5wcm9wcy5pY29uO1xyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTppY29ufSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJY29uOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbG9yLCBwb2ludHMpIHtcclxuICAgIHRoaXMuaWQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMDAwKTtcclxuICAgIHRoaXMuc2VlZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDApKzEwO1xyXG4gICAgdGhpcy5jb2xvciA9IGNvbG9yO1xyXG4gICAgdGhpcy5wb2ludHMgPSBwb2ludHM7XHJcbiAgICBwb2ludHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgIHJldHVybiBhLnggLSBiLng7XHJcbiAgICB9KTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyAgPSAgZnVuY3Rpb24gKHgsIHkpIHtcclxuICAgIHRoaXMuaWQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMDAwKTtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG59O1xyXG5cclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblxyXG52YXIgUHJvamVjdFBpY2tlciA9IHJlcXVpcmUoJy4vcHJvamVjdC1waWNrZXInKTtcclxuXHJcblJlYWN0LnJlbmRlckNvbXBvbmVudChcclxuICAgIFByb2plY3RQaWNrZXIobnVsbCApLFxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcGxpY2F0aW9uJylcclxuKTtcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblxyXG52YXIgTWF0aFV0aWxzID0gcmVxdWlyZSgnLi9tYXRoLXV0aWxzJyk7XHJcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vZGF0YS9wb2ludCcpO1xyXG5cclxuXHJcbnZhciBJY29uQnV0dG9uID0gcmVxdWlyZSgnLi9ib290c3RyYXAvaWNvbi1idXR0b24nKTtcclxuXHJcbi8vIHRvZG86IHJldXNlP1xyXG52YXIgY2hhbmdlZD0gZnVuY3Rpb24gKHRhcmdldCwgY2hhbmdlcykge1xyXG4gICAgcmV0dXJuIF8uZXh0ZW5kKF8uY2xvbmUodGFyZ2V0KSwgY2hhbmdlcyk7XHJcbn07XHJcblxyXG52YXIgTW92YWJsZUNpcmNsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01vdmFibGVDaXJjbGUnLFxyXG4gICAgb25Nb3VzZURvd246IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgIG86IHtcclxuICAgICAgICAgICAgICAgIG94OiB0aGlzLnByb3BzLmN4LFxyXG4gICAgICAgICAgICAgICAgb3k6IHRoaXMucHJvcHMuY3ksXHJcbiAgICAgICAgICAgICAgICB4OiBlLmNsaWVudFgsXHJcbiAgICAgICAgICAgICAgICB5OiBlLmNsaWVudFlcclxuICAgICAgICAgICAgfX0pO1xyXG4gICAgICAgIHRoaXMucHJvcHMub25Nb3VzZURvd24oZSk7XHJcblxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMub25Nb3VzZU1vdmUpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLm9uTW91c2VVcCk7XHJcblxyXG4gICAgfSxcclxuICAgIG9uTW91c2VVcDogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtvOiBudWxsfSlcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VNb3ZlKTtcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgdGhpcy5vbk1vdXNlVXApO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMub25Nb3VzZU1vdmUpO1xyXG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLm9uTW91c2VVcCk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICBvbk1vdXNlTW92ZTogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB2YXIgbyA9IHRoaXMuc3RhdGUubztcclxuXHJcbiAgICAgICAgaWYgKG8pIHtcclxuICAgICAgICAgICAgdmFyIG5ld08gPSBPYmplY3QuY3JlYXRlKG8pO1xyXG4gICAgICAgICAgICBuZXdPLnggPSBlLmNsaWVudFg7XHJcbiAgICAgICAgICAgIG5ld08ueSA9IGUuY2xpZW50WTtcclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbk1vdmUoKG8ub3ggKyBlLmNsaWVudFggLSB0aGlzLnN0YXRlLm8ueCApLCAoby5veSArZS5jbGllbnRZIC0gdGhpcy5zdGF0ZS5vLnkgKSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUobmV3Tyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oUmVhY3QuRE9NLmNpcmNsZSgge29uTW91c2VEb3duOnRoaXMub25Nb3VzZURvd259KSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcblxyXG52YXIgU2luZ2xlTGluZUVkaXRvciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1NpbmdsZUxpbmVFZGl0b3InLFxyXG4gICAgb25Nb3ZlQ2lyY2xlTW92ZTogZnVuY3Rpb24gKGluZGV4LCB4LCB5KSB7XHJcbiAgICAgICAgdmFyIG5ld1BvaW50cyA9IHRoaXMucHJvcHMucG9pbnRzLnNsaWNlKCk7XHJcbiAgICAgICAgdmFyIGxlZnRQb2ludCA9IG5ld1BvaW50c1tpbmRleCAtIDFdIHx8IHt4OiAwfTtcclxuICAgICAgICB2YXIgcmlnaHRQb2ludCA9IG5ld1BvaW50c1tpbmRleCArIDFdIHx8IHt4OiB0aGlzLnByb3BzLnNpemUueH07XHJcblxyXG4gICAgICAgIG5ld1BvaW50c1tpbmRleF0gPSBuZXdQb2ludCA9IF8uY2xvbmUobmV3UG9pbnRzW2luZGV4XSk7XHJcblxyXG4gICAgICAgIG5ld1BvaW50LnggPSBNYXRoVXRpbHMuY29uc3RyYWluKHgsIGxlZnRQb2ludC54LCByaWdodFBvaW50LngpO1xyXG4gICAgICAgIG5ld1BvaW50LnkgPSBNYXRoVXRpbHMuY29uc3RyYWluKHksICAwLCB0aGlzLnByb3BzLnNpemUueSk7XHJcblxyXG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UobmV3UG9pbnRzKTtcclxuICAgIH0sXHJcblxyXG4gICAgb25Ub3VjaDogZnVuY3Rpb24gKGNpcmNsZUksIGUpIHtcclxuICAgICAgICB0aGlzLnByb3BzLm9uUG9pbnRUb3VjaChjaXJjbGVJLCBlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciBsaW5lU3R5bGUgPSB7XHJcbiAgICAgICAgICAgIHN0cm9rZTogdGhpcy5wcm9wcy5jb2xvcixcclxuICAgICAgICAgICAgJ3N0cm9rZS13aWR0aCc6IDJcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBjaXJjbGVTdHlsZSA9IHtcclxuICAgICAgICAgICAgZmlsbDogdGhpcy5wcm9wcy5tYXJrQ29sb3IsXHJcbiAgICAgICAgICAgIGN1cnNvcjogJ21vdmUnXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGxpbmVzID0gW107XHJcbiAgICAgICAgdmFyIGNpcmNsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgdmFyIGNpcmNsZSA9IGZ1bmN0aW9uIChwLCBpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNb3ZhYmxlQ2lyY2xlKCB7a2V5OnAuaWQsIGN4OnAueCwgY3k6cC55LCByOnRoaXMucHJvcHMubWFya1NpemUsIG9uTW91c2VEb3duOnRoaXMub25Ub3VjaC5iaW5kKHRoaXMsIGkpLCBvbk1vdmU6dGhpcy5vbk1vdmVDaXJjbGVNb3ZlLmJpbmQodGhpcywgaSksIHN0eWxlOmNpcmNsZVN0eWxlfSlcclxuICAgICAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5wcm9wcy5wb2ludHMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBwMSA9IHRoaXMucHJvcHMucG9pbnRzW2kgLSAxXTtcclxuICAgICAgICAgICAgdmFyIHAyID0gdGhpcy5wcm9wcy5wb2ludHNbaV07XHJcbiAgICAgICAgICAgIGlmIChpID09IDEpIHtcclxuICAgICAgICAgICAgICAgIGNpcmNsZXMucHVzaChjaXJjbGUocDEsIGkgLSAxKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGluZXMucHVzaChSZWFjdC5ET00ubGluZSgge3gxOnAxLngsIHkxOnAxLnksIHgyOnAyLngsIHkyOnAyLnksIHN0eWxlOmxpbmVTdHlsZX0pKTtcclxuICAgICAgICAgICAgY2lyY2xlcy5wdXNoKGNpcmNsZShwMiwgaSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5nKG51bGwsIFxyXG4gICAgICAgIGxpbmVzLFxyXG4gICAgICAgIGNpcmNsZXNcclxuICAgICAgICApXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gc2NhbGVQb2ludChwb2ludCwgYnkpe1xyXG4gICAgcmV0dXJuIF8uZXh0ZW5kKF8uY2xvbmUocG9pbnQpLCB7eDogcG9pbnQueCogYnkueCx5OiBwb2ludC55KiBieS55IH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzY2FsZVBvaW50cyhwb2ludHMsIGJ5KXtcclxuICAgIHJldHVybiBwb2ludHMubWFwKGZ1bmN0aW9uIChwKSB7XHJcbiAgICAgICAgcmV0dXJuIHNjYWxlUG9pbnQocCwgYnkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG52YXIgTGF5ZXJMaW5lc0VkaXRvciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0xheWVyTGluZXNFZGl0b3InLFxyXG4gICAgb25MaW5lQ2hhbmdlOiBmdW5jdGlvbiAoaW5kZXgsIHBvaW50cykge1xyXG4gICAgICAgIHZhciBzID0gdGhpcy5wcm9wcy5zaXplO1xyXG4gICAgICAgIHZhciBpcyA9ICB7eDogMS9zLngsIHk6MS8gcy55fTtcclxuICAgICAgICBwb2ludHMgPSBzY2FsZVBvaW50cyhwb2ludHMsIGlzKTtcclxuICAgICAgICB0aGlzLm9uUmF3TGluZUNoYW5nZShpbmRleCwgcG9pbnRzKTtcclxuICAgIH0sXHJcblxyXG4gICAgb25SYXdMaW5lQ2hhbmdlOiBmdW5jdGlvbiAoaW5kZXgsIHBvaW50cykge1xyXG4gICAgICAgIHZhciBuZXdMYXllcnMgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5sYXllcnMuc2xpY2UoKTtcclxuICAgICAgICB2YXIgbmV3TGF5ZXIgPSBuZXdMYXllcnNbaW5kZXhdID0gXy5jbG9uZShuZXdMYXllcnNbaW5kZXhdKTtcclxuICAgICAgICBuZXdMYXllci5wb2ludHMgPSBwb2ludHM7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShjaGFuZ2VkKHRoaXMucHJvcHMubGF5ZXJEYXRhLCB7bGF5ZXJzOiBuZXdMYXllcnN9KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uUG9pbnRUb3VjaDogZnVuY3Rpb24gKGxheWVySSwgcG9pbnRJLCBlKSB7XHJcbiAgICAgICAgaWYgKCFlLmN0cmxLZXkpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShjaGFuZ2VkKHRoaXMucHJvcHMubGF5ZXJEYXRhLCB7c2VsZWN0ZWQ6IGxheWVySX0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdQb2ludHMgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5sYXllcnNbbGF5ZXJJXS5wb2ludHMuc2xpY2UoKTtcclxuICAgICAgICAgICAgbmV3UG9pbnRzLnNwbGljZShwb2ludEksIDEpO1xyXG4gICAgICAgICAgICB0aGlzLm9uUmF3TGluZUNoYW5nZShsYXllckksbmV3UG9pbnRzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudDogZnVuY3Rpb24gKHRhcmdldCwgdHlwZSkge1xyXG4gICAgICAgIHdoaWxlKHRhcmdldCAmJiB0YXJnZXQubm9kZU5hbWUgIT0gdHlwZSl7XHJcbiAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGRQb2ludDogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBpZiAoIWUuY3RybEtleSAmJiBlLnNoaWZ0S2V5KSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMucHJvcHMubGF5ZXJEYXRhLnNlbGVjdGVkO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdQb2ludHMgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5sYXllcnNbc2VsZWN0ZWRdLnBvaW50cy5zbGljZSgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMuZ2V0UGFyZW50KGUudGFyZ2V0LCAnc3ZnJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcCA9IG5ldyBQb2ludChlLnBhZ2VYIC0gY2FudmFzLm9mZnNldExlZnQsIGUucGFnZVkgLSBjYW52YXMub2Zmc2V0VG9wKVxyXG4gICAgICAgICAgICAgICAgdmFyIHMgPSB0aGlzLnByb3BzLnNpemU7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXMgPSAge3g6IDEvcy54LCB5OjEvIHMueX07XHJcbiAgICAgICAgICAgICAgICBwID0gc2NhbGVQb2ludChwLGlzKTtcclxuICAgICAgICAgICAgICAgIG5ld1BvaW50cy5wdXNoKHApO1xyXG4gICAgICAgICAgICAgICAgbmV3UG9pbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS54IC0gYi54O1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uUmF3TGluZUNoYW5nZShzZWxlY3RlZCwgbmV3UG9pbnRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBzID0gdGhpcy5wcm9wcy5zaXplO1xyXG4gICAgICAgIHZhciBlZGl0b3JzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzLm1hcChmdW5jdGlvbiAobGF5ZXIsIGkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMucHJvcHMubGF5ZXJEYXRhLnNlbGVjdGVkID09IGk7XHJcbiAgICAgICAgICAgIHZhciBtYXJrQ29sb3IgPSBzZWxlY3RlZD8nd2hpdGUnOidncmV5JztcclxuICAgICAgICAgICAgdmFyIG1hcmtTaXplID0gMTA7XHJcblxyXG4gICAgICAgICAgICBpZighdGhpcy5wcm9wcy5jYW5TZWxlY3QgJiYgIXNlbGVjdGVkKXtcclxuICAgICAgICAgICAgICAgIG1hcmtTaXplID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHNjYWxlZFBvaW50cyA9IHNjYWxlUG9pbnRzKGxheWVyLnBvaW50cywgdGhpcy5wcm9wcy5zaXplKTtcclxuICAgICAgICAgICAgcmV0dXJuIFNpbmdsZUxpbmVFZGl0b3IoIHtzaXplOnMsIGNvbG9yOmxheWVyLmNvbG9yLCBtYXJrQ29sb3I6bWFya0NvbG9yLCBtYXJrU2l6ZTptYXJrU2l6ZSwgIHBvaW50czpzY2FsZWRQb2ludHMsIG9uQ2hhbmdlOnRoaXMub25MaW5lQ2hhbmdlLmJpbmQodGhpcywgaSksIG9uUG9pbnRUb3VjaDp0aGlzLm9uUG9pbnRUb3VjaC5iaW5kKHRoaXMsIGkpfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcblxyXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uc3ZnKCB7d2lkdGg6cy54LCBoZWlnaHQ6cy55LCBjbGFzc05hbWU6XCJsaW5lRWRpdG9yXCIsIG9uTW91c2VEb3duOnRoaXMuYWRkUG9pbnR9LCBlZGl0b3JzKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMYXllckxpbmVzRWRpdG9yOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxudmFyIFJuZCA9IHJlcXVpcmUoJy4vcm5kJyk7XHJcblxyXG52YXIgTGF5ZXIgPSByZXF1aXJlKCcuL2RhdGEvbGF5ZXInKTtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9kYXRhL3BvaW50Jyk7XHJcblxyXG52YXIgSWNvbkJ1dHRvbiA9IHJlcXVpcmUoJy4vYm9vdHN0cmFwL2ljb24tYnV0dG9uJyk7XHJcblxyXG5hcnJheU1vdmUgPSBmdW5jdGlvbihhcnJheSwgZnJvbSwgdG8pIHtcclxuICAgIGFycmF5LnNwbGljZSh0bywgMCwgYXJyYXkuc3BsaWNlKGZyb20sIDEpWzBdKTtcclxufTtcclxuXHJcbnZhciBMYXllckluc3BlY3RvciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0xheWVySW5zcGVjdG9yJyxcclxuICAgIG9uQ29sb3JDaGFuZ2U6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdGhpcy5vbk5ld0NvbG9yVmFsdWUoZS50YXJnZXQudmFsdWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvblNlZWRDaGFuZ2U6IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdGhpcy5vbk5ld1NlZWRWYWx1ZShlLnRhcmdldC52YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uTmV3Q29sb3JWYWx1ZTogZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgIHZhciBuZXdMYXllciAgPSAgXy5jbG9uZSh0aGlzLnByb3BzLmxheWVyKTtcclxuICAgICAgICBuZXdMYXllci5jb2xvciA9IHZhbDtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKG5ld0xheWVyKTtcclxuICAgIH0sXHJcblxyXG4gICAgb25OZXdTZWVkVmFsdWU6IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICB2YXIgbmV3TGF5ZXIgID0gIF8uY2xvbmUodGhpcy5wcm9wcy5sYXllcik7XHJcbiAgICAgICAgbmV3TGF5ZXIuc2VlZCA9IHZhbDtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKG5ld0xheWVyKTtcclxuICAgIH0sXHJcblxyXG4gICAgb25SYW5kb21Db2xvcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMub25OZXdDb2xvclZhbHVlKFJuZC5jb2xvcigpKTtcclxuICAgIH0sXHJcbiAgICBvblJhbmRvbVNlZWQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLm9uTmV3U2VlZFZhbHVlKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSo5MDAwMCArMTAwMDApKTtcclxuICAgIH0sXHJcblxyXG5cclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyB0b2RvOiByZXVzYWJsZSBmb3JtIGNvbXBvbmVuZXRcclxuXHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmZvcm0oIHtyb2xlOlwiZm9ybVwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoIHtmb3I6XCJsYXllckNvbG9yXCJ9LCBcIkNvbG9yXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cFwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge2lkOlwibGF5ZXJDb2xvclwiLCB0eXBlOlwidGV4dFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgdmFsdWU6dGhpcy5wcm9wcy5sYXllci5jb2xvciwgb25DaGFuZ2U6dGhpcy5vbkNvbG9yQ2hhbmdlfSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwLWJ0blwifSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcImJ0biBidG4tZGVmYXVsdCBpbnB1dC1zbVwiLCB0eXBlOlwiYnV0dG9uXCIsIG9uQ2xpY2s6dGhpcy5vblJhbmRvbUNvbG9yfSwgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uIGdseXBoaWNvbi1maXJlXCJ9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXBcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoIHtmb3I6XCJsYXllclNlZWRcIn0sIFwiU2VlZFwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge2lkOlwibGF5ZXJTZWVkXCIsIHR5cGU6XCJ0ZXh0XCIsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1zbVwiLCB2YWx1ZTp0aGlzLnByb3BzLmxheWVyLnNlZWQsIG9uQ2hhbmdlOnRoaXMub25TZWVkQ2hhbmdlfSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1idG5cIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOlwiYnRuIGJ0bi1kZWZhdWx0IGlucHV0LXNtXCIsIHR5cGU6XCJidXR0b25cIiwgb25DbGljazp0aGlzLm9uUmFuZG9tU2VlZH0sIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbiBnbHlwaGljb24tZmlyZVwifSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcbnZhciBjaGFuZ2VkPSBmdW5jdGlvbiAodGFyZ2V0LCBjaGFuZ2VzKSB7XHJcbiAgICByZXR1cm4gXy5leHRlbmQoXy5jbG9uZSh0YXJnZXQpLCBjaGFuZ2VzKTtcclxufTtcclxuXHJcbnZhciBMYXllckxpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdMYXllckxpc3QnLFxyXG5cclxuICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoY2hhbmdlZCh0aGlzLnByb3BzLmxheWVyRGF0YSwge1xyXG4gICAgICAgICAgICBzZWxlY3RlZDogaW5kZXhcclxuICAgICAgICB9KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZExheWVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHJuZFBvaW50ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KE1hdGgucmFuZG9tKCksIE1hdGgucmFuZG9tKCkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBuZXdMYXllcnMgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5sYXllcnMuc2xpY2UoKTtcclxuXHJcbiAgICAgICAgLy8gdG9kbzogcmV1c2Ugc29ydCAobW92ZSB0byBMYXllcj8pXHJcbiAgICAgICAgdmFyIGxheWVyID0gbmV3IExheWVyKFJuZC5jb2xvcigpLCBbcm5kUG9pbnQoKSwgcm5kUG9pbnQoKV0pO1xyXG4gICAgICAgIGxheWVyLnBvaW50cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhLnggLSBiLng7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgbmV3TGF5ZXJzLnB1c2gobGF5ZXIpO1xyXG5cclxuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKGNoYW5nZWQodGhpcy5wcm9wcy5sYXllckRhdGEsIHtcclxuICAgICAgICAgICAgbGF5ZXJzOiBuZXdMYXllcnMsXHJcbiAgICAgICAgICAgIHNlbGVjdGVkOiBuZXdMYXllcnMubGVuZ3RoLTFcclxuICAgICAgICB9KSk7XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlTGF5ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbmV3TGF5ZXJzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzLnNsaWNlKCk7XHJcbiAgICAgICAgbmV3TGF5ZXJzLnNwbGljZSh0aGlzLnByb3BzLmxheWVyRGF0YS5zZWxlY3RlZCwxKTtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKGNoYW5nZWQodGhpcy5wcm9wcy5sYXllckRhdGEsIHtcclxuICAgICAgICAgICAgbGF5ZXJzOiBuZXdMYXllcnNcclxuICAgICAgICB9KSk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICBvbkxheWVyQ2hhbmdlOiBmdW5jdGlvbiAobGF5ZXJJbmRleCwgbmV3TGF5ZXIpIHtcclxuXHJcbiAgICAgICAgdmFyIG5ld0xheWVycyA9IHRoaXMucHJvcHMubGF5ZXJEYXRhLmxheWVycy5zbGljZSgpO1xyXG4gICAgICAgIG5ld0xheWVyc1tsYXllckluZGV4XSA9IG5ld0xheWVyO1xyXG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoY2hhbmdlZCh0aGlzLnByb3BzLmxheWVyRGF0YSwge1xyXG4gICAgICAgICAgICBsYXllcnM6IG5ld0xheWVyc1xyXG4gICAgICAgIH0pKTtcclxuICAgIH0sXHJcblxyXG4gICAgbW92ZVVwOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5tb3ZlKDEpO1xyXG4gICAgfSxcclxuXHJcbiAgICBtb3ZlRG93bjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMubW92ZSgtMSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG1vdmU6IGZ1bmN0aW9uIChkZWx0YSkge1xyXG4gICAgICAgIHZhciBsYXllckRhdGEgPSB0aGlzLnByb3BzLmxheWVyRGF0YTtcclxuICAgICAgICB2YXIgc2VsZWN0ZWQgPSBsYXllckRhdGEuc2VsZWN0ZWQ7XHJcbiAgICAgICAgdmFyIG5ld0xheWVycyA9IGxheWVyRGF0YS5sYXllcnMuc2xpY2UoKTtcclxuICAgICAgICBhcnJheU1vdmUobmV3TGF5ZXJzLCBzZWxlY3RlZCwgc2VsZWN0ZWQrZGVsdGEpO1xyXG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoY2hhbmdlZChsYXllckRhdGEsIHtcclxuICAgICAgICAgICAgbGF5ZXJzOiBuZXdMYXllcnMsXHJcbiAgICAgICAgICAgIHNlbGVjdGVkOiBzZWxlY3RlZCtkZWx0YVxyXG4gICAgICAgIH0pKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGxheWVyRGF0YSA9IHRoaXMucHJvcHMubGF5ZXJEYXRhO1xyXG4gICAgICAgIHZhciBzZWxlY3RlZExheWVyO1xyXG5cclxuICAgICAgICB2YXIgbGF5ZXJzID0gbGF5ZXJEYXRhLmxheWVycy5tYXAoZnVuY3Rpb24gKGxheWVyLCBpKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3R5bGUgPSB7XHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6IGxheWVyLmNvbG9yLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICczMHB4J1xyXG5cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmKGkgPT0gbGF5ZXJEYXRhLnNlbGVjdGVkKXtcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkTGF5ZXIgPSBsYXllcjtcclxuICAgICAgICAgICAgICAgIHN0eWxlLmJvcmRlciA9IFwiM3B4IGRhc2hlZCAjMjcyQjMwXCJcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtzdHlsZTpzdHlsZSwgb25DbGljazp0aGlzLm9uQ2xpY2suYmluZCh0aGlzLCBpKX0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgbGF5ZXJzLnJldmVyc2UoKTtcclxuICAgICAgICB2YXIgaW5zcGVjdG9yO1xyXG4gICAgICAgIHZhciBhY3Rpb25zID0gW107XHJcblxyXG4gICAgICAgIGFjdGlvbnMucHVzaChJY29uQnV0dG9uKCB7aWNvbjpcInBsdXNcIiwgY2xhc3NOYW1lOlwiYnRuLWdyb3VwLXNwYWNlXCIsIG9uQ2xpY2s6dGhpcy5hZGRMYXllcn0gKSk7XHJcblxyXG4gICAgICAgIGlmKHNlbGVjdGVkTGF5ZXIpIHtcclxuICAgICAgICAgICAgaW5zcGVjdG9yID0gTGF5ZXJJbnNwZWN0b3IoIHtsYXllcjpzZWxlY3RlZExheWVyLCBvbkNoYW5nZTp0aGlzLm9uTGF5ZXJDaGFuZ2UuYmluZCh0aGlzLCB0aGlzLnByb3BzLmxheWVyRGF0YS5zZWxlY3RlZCl9KTtcclxuXHJcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaChSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiYnRuLWdyb3VwIGJ0bi1ncm91cC1zcGFjZVwifSwgXHJcbiAgICAgICAgICAgICAgICBJY29uQnV0dG9uKCB7aWNvbjpcImFycm93LXVwXCIsIG9uQ2xpY2s6dGhpcy5tb3ZlVXAsIGVuYWJsZWQ6bGF5ZXJEYXRhLnNlbGVjdGVkIDwgbGF5ZXJEYXRhLmxheWVycy5sZW5ndGgtMX0pLFxyXG4gICAgICAgICAgICAgICAgSWNvbkJ1dHRvbigge2ljb246XCJhcnJvdy1kb3duXCIsIG9uQ2xpY2s6dGhpcy5tb3ZlRG93biwgZW5hYmxlZDpsYXllckRhdGEuc2VsZWN0ZWQgPiAwfSlcclxuICAgICAgICAgICAgKSk7XHJcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaChJY29uQnV0dG9uKCB7aWNvbjpcInRyYXNoXCIsIGNsYXNzTmFtZTpcImJ0bi1ncm91cC1zcGFjZVwiLCBvbkNsaWNrOnRoaXMucmVtb3ZlTGF5ZXJ9ICkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaDQobnVsbCwgXCJMYXllcnNcIiksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJoLXNwYWNlZFwifSwgXHJcbiAgICAgICAgICAgICAgICBsYXllcnNcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImgtc3BhY2VkXCJ9LCBcclxuICAgICAgICAgICAgICAgIGFjdGlvbnNcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgaW5zcGVjdG9yXHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExheWVyTGlzdDsiLCJ2YXIgTWF0aFV0aWwgPSBNYXRoVXRpbCB8fCB7fTtcclxuTWF0aFV0aWwuY29uc3RyYWluID0gZnVuY3Rpb24gKHYsIG1pbiwgbWF4KSB7XHJcbiAgICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbihtYXgsIHYpKTtcclxufTtcclxuXHJcbk1hdGhVdGlsLmNvbnN0cmFpblBvaW50ID0gZnVuY3Rpb24gKHAsIG1pbiwgbWF4KSB7XHJcbiAgICBwLnggPSBNYXRoVXRpbC5jb25zdHJhaW4ocC54LCBtaW4ueCwgbWF4LngpO1xyXG4gICAgcC55ID0gTWF0aFV0aWwuY29uc3RyYWluKHAueSwgbWluLnksIG1heC55KTtcclxuICAgIHJldHVybiBwO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXRoVXRpbDsiLCJ2YXIgZGF0YSA9IHt9O1xyXG5kYXRhLmFuaW1hbHMgPSBbJ0FhcmR2YXJrJyxcclxuICAgICdBbGJhdHJvc3MnLFxyXG4gICAgJ0FsbGlnYXRvcicsXHJcbiAgICAnQWxwYWNhJyxcclxuICAgICdBbnQnLFxyXG4gICAgJ0FudGVhdGVyJyxcclxuICAgICdBbnRlbG9wZScsXHJcbiAgICAnQXBlJyxcclxuICAgICdBcm1hZGlsbG8nLFxyXG4gICAgJ0Fzcy9Eb25rZXknLFxyXG4gICAgJ0JhYm9vbicsXHJcbiAgICAnQmFkZ2VyJyxcclxuICAgICdCYXJyYWN1ZGEnLFxyXG4gICAgJ0JhdCcsXHJcbiAgICAnQmVhcicsXHJcbiAgICAnQmVhdmVyJyxcclxuICAgICdCZWUnLFxyXG4gICAgJ0Jpc29uJyxcclxuICAgICdCb2FyJyxcclxuICAgICdCdWZmYWxvJyxcclxuICAgICdCdXR0ZXJmbHknLFxyXG4gICAgJ0NhbWVsJyxcclxuICAgICdDYXB5YmFyYScsXHJcbiAgICAnQ2FyaWJvdScsXHJcbiAgICAnQ2Fzc293YXJ5JyxcclxuICAgICdDYXQnLFxyXG4gICAgJ0NhdGVycGlsbGFyJyxcclxuICAgICdDYXR0bGUnLFxyXG4gICAgJ0NoYW1vaXMnLFxyXG4gICAgJ0NoZWV0YWgnLFxyXG4gICAgJ0NoaWNrZW4nLFxyXG4gICAgJ0NoaW1wYW56ZWUnLFxyXG4gICAgJ0NoaW5jaGlsbGEnLFxyXG4gICAgJ0Nob3VnaCcsXHJcbiAgICAnQ2xhbScsXHJcbiAgICAnQ29icmEnLFxyXG4gICAgJ0NvY2tyb2FjaCcsXHJcbiAgICAnQ29kJyxcclxuICAgICdDb3Jtb3JhbnQnLFxyXG4gICAgJ0NveW90ZScsXHJcbiAgICAnQ3JhYicsXHJcbiAgICAnQ3JhbmUnLFxyXG4gICAgJ0Nyb2NvZGlsZScsXHJcbiAgICAnQ3JvdycsXHJcbiAgICAnQ3VybGV3JyxcclxuICAgICdEZWVyJyxcclxuICAgICdEaW5vc2F1cicsXHJcbiAgICAnRG9nJyxcclxuICAgICdEb2dmaXNoJyxcclxuICAgICdEb2xwaGluJyxcclxuICAgICdEb25rZXknLFxyXG4gICAgJ0RvdHRlcmVsJyxcclxuICAgICdEb3ZlJyxcclxuICAgICdEcmFnb25mbHknLFxyXG4gICAgJ0R1Y2snLFxyXG4gICAgJ0R1Z29uZycsXHJcbiAgICAnRHVubGluJyxcclxuICAgICdFYWdsZScsXHJcbiAgICAnRWNoaWRuYScsXHJcbiAgICAnRWVsJyxcclxuICAgICdFbGFuZCcsXHJcbiAgICAnRWxlcGhhbnQnLFxyXG4gICAgJ0VsZXBoYW50IHNlYWwnLFxyXG4gICAgJ0VsaycsXHJcbiAgICAnRW11JyxcclxuICAgICdGYWxjb24nLFxyXG4gICAgJ0ZlcnJldCcsXHJcbiAgICAnRmluY2gnLFxyXG4gICAgJ0Zpc2gnLFxyXG4gICAgJ0ZsYW1pbmdvJyxcclxuICAgICdGbHknLFxyXG4gICAgJ0ZveCcsXHJcbiAgICAnRnJvZycsXHJcbiAgICAnR2F1cicsXHJcbiAgICAnR2F6ZWxsZScsXHJcbiAgICAnR2VyYmlsJyxcclxuICAgICdHaWFudCBQYW5kYScsXHJcbiAgICAnR2lyYWZmZScsXHJcbiAgICAnR25hdCcsXHJcbiAgICAnR251JyxcclxuICAgICdHb2F0JyxcclxuICAgICdHb29zZScsXHJcbiAgICAnR29sZGZpbmNoJyxcclxuICAgICdHb2xkZmlzaCcsXHJcbiAgICAnR29yaWxsYScsXHJcbiAgICAnR29zaGF3aycsXHJcbiAgICAnR3Jhc3Nob3BwZXInLFxyXG4gICAgJ0dyb3VzZScsXHJcbiAgICAnR3VhbmFjbycsXHJcbiAgICAnR3VpbmVhIGZvd2wnLFxyXG4gICAgJ0d1aW5lYSBwaWcnLFxyXG4gICAgJ0d1bGwnLFxyXG4gICAgJ0hhcmUnLFxyXG4gICAgJ0hhd2snLFxyXG4gICAgJ0hlZGdlaG9nJyxcclxuICAgICdIZXJvbicsXHJcbiAgICAnSGVycmluZycsXHJcbiAgICAnSGlwcG9wb3RhbXVzJyxcclxuICAgICdIb3JuZXQnLFxyXG4gICAgJ0hvcnNlJyxcclxuICAgICdIdW1hbicsXHJcbiAgICAnSHVtbWluZ2JpcmQnLFxyXG4gICAgJ0h5ZW5hJyxcclxuICAgICdJYmV4JyxcclxuICAgICdJYmlzJyxcclxuICAgICdKYWNrYWwnLFxyXG4gICAgJ0phZ3VhcicsXHJcbiAgICAnSmF5JyxcclxuICAgICdKZWxseWZpc2gnLFxyXG4gICAgJ0thbmdhcm9vJyxcclxuICAgICdLaW5nZmlzaGVyJyxcclxuICAgICdLb2FsYScsXHJcbiAgICAnS29tb2RvIGRyYWdvbicsXHJcbiAgICAnS29va2FidXJhJyxcclxuICAgICdLb3VwcmV5JyxcclxuICAgICdLdWR1JyxcclxuICAgICdMYXB3aW5nJyxcclxuICAgICdMYXJrJyxcclxuICAgICdMZW11cicsXHJcbiAgICAnTGVvcGFyZCcsXHJcbiAgICAnTGlvbicsXHJcbiAgICAnTGxhbWEnLFxyXG4gICAgJ0xvYnN0ZXInLFxyXG4gICAgJ0xvY3VzdCcsXHJcbiAgICAnTG9yaXMnLFxyXG4gICAgJ0xvdXNlJyxcclxuICAgICdMeXJlYmlyZCcsXHJcbiAgICAnTWFncGllJyxcclxuICAgICdNYWxsYXJkJyxcclxuICAgICdNYW5hdGVlJyxcclxuICAgICdNYW5kcmlsbCcsXHJcbiAgICAnTWFudGlzJyxcclxuICAgICdNYXJ0ZW4nLFxyXG4gICAgJ01lZXJrYXQnLFxyXG4gICAgJ01pbmsnLFxyXG4gICAgJ01vbGUnLFxyXG4gICAgJ01vbmdvb3NlJyxcclxuICAgICdNb25rZXknLFxyXG4gICAgJ01vb3NlJyxcclxuICAgICdNb3VzZScsXHJcbiAgICAnTW9zcXVpdG8nLFxyXG4gICAgJ011bGUnLFxyXG4gICAgJ05hcndoYWwnLFxyXG4gICAgJ05ld3QnLFxyXG4gICAgJ05pZ2h0aW5nYWxlJyxcclxuICAgICdPY3RvcHVzJyxcclxuICAgICdPa2FwaScsXHJcbiAgICAnT3Bvc3N1bScsXHJcbiAgICAnT3J5eCcsXHJcbiAgICAnT3N0cmljaCcsXHJcbiAgICAnT3R0ZXInLFxyXG4gICAgJ093bCcsXHJcbiAgICAnT3gnLFxyXG4gICAgJ095c3RlcicsXHJcbiAgICAnUGFycm90JyxcclxuICAgICdQYXJ0cmlkZ2UnLFxyXG4gICAgJ1BlYWZvd2wnLFxyXG4gICAgJ1BlbGljYW4nLFxyXG4gICAgJ1Blbmd1aW4nLFxyXG4gICAgJ1BoZWFzYW50JyxcclxuICAgICdQaWcnLFxyXG4gICAgJ1BpZ2VvbicsXHJcbiAgICAnUG9sYXIgQmVhcicsXHJcbiAgICAnUG9ueS0gU2VlIEhvcnNlJyxcclxuICAgICdQb3JjdXBpbmUnLFxyXG4gICAgJ1BvcnBvaXNlJyxcclxuICAgICdQcmFpcmllIERvZycsXHJcbiAgICAnUXVhaWwnLFxyXG4gICAgJ1F1ZWxlYScsXHJcbiAgICAnUXVldHphbCcsXHJcbiAgICAnUmFiYml0JyxcclxuICAgICdSYWNjb29uJyxcclxuICAgICdSYWlsJyxcclxuICAgICdSYW0nLFxyXG4gICAgJ1JhdCcsXHJcbiAgICAnUmF2ZW4nLFxyXG4gICAgJ1JlZCBkZWVyJyxcclxuICAgICdSZWQgcGFuZGEnLFxyXG4gICAgJ1JlaW5kZWVyJyxcclxuICAgICdSaGlub2Nlcm9zJyxcclxuICAgICdSb29rJyxcclxuICAgICdTYWxhbWFuZGVyJyxcclxuICAgICdTYWxtb24nLFxyXG4gICAgJ1NhbmQgRG9sbGFyJyxcclxuICAgICdTYW5kcGlwZXInLFxyXG4gICAgJ1NhcmRpbmUnLFxyXG4gICAgJ1Njb3JwaW9uJyxcclxuICAgICdTZWEgbGlvbicsXHJcbiAgICAnU2VhIFVyY2hpbicsXHJcbiAgICAnU2VhaG9yc2UnLFxyXG4gICAgJ1NlYWwnLFxyXG4gICAgJ1NoYXJrJyxcclxuICAgICdTaGVlcCcsXHJcbiAgICAnU2hyZXcnLFxyXG4gICAgJ1NrdW5rJyxcclxuICAgICdTbmFpbCcsXHJcbiAgICAnU25ha2UnLFxyXG4gICAgJ1NwYXJyb3cnLFxyXG4gICAgJ1NwaWRlcicsXHJcbiAgICAnU3Bvb25iaWxsJyxcclxuICAgICdTcXVpZCcsXHJcbiAgICAnU3F1aXJyZWwnLFxyXG4gICAgJ1N0YXJsaW5nJyxcclxuICAgICdTdGluZ3JheScsXHJcbiAgICAnU3RpbmtidWcnLFxyXG4gICAgJ1N0b3JrJyxcclxuICAgICdTd2FsbG93JyxcclxuICAgICdTd2FuJyxcclxuICAgICdUYXBpcicsXHJcbiAgICAnVGFyc2llcicsXHJcbiAgICAnVGVybWl0ZScsXHJcbiAgICAnVGlnZXInLFxyXG4gICAgJ1RvYWQnLFxyXG4gICAgJ1Ryb3V0JyxcclxuICAgICdUdXJrZXknLFxyXG4gICAgJ1R1cnRsZScsXHJcbiAgICAnVmlwZXInLFxyXG4gICAgJ1Z1bHR1cmUnLFxyXG4gICAgJ1dhbGxhYnknLFxyXG4gICAgJ1dhbHJ1cycsXHJcbiAgICAnV2FzcCcsXHJcbiAgICAnV2F0ZXIgYnVmZmFsbycsXHJcbiAgICAnV2Vhc2VsJyxcclxuICAgICdXaGFsZScsXHJcbiAgICAnV29sZicsXHJcbiAgICAnV29sdmVyaW5lJyxcclxuICAgICdXb21iYXQnLFxyXG4gICAgJ1dvb2Rjb2NrJyxcclxuICAgICdXb29kcGVja2VyJyxcclxuICAgICdXb3JtJyxcclxuICAgICdXcmVuJyxcclxuICAgICdZYWsnLFxyXG4gICAgJ1plYnJhJyxcclxuXTtcclxuXHJcblxyXG5cclxuZGF0YS5jb2xvcnMgPSBbJ0FjaWQgR3JlZW4nLFxyXG4gICAgJ0Flcm8nLFxyXG4gICAgJ0Flcm8gQmx1ZScsXHJcbiAgICAnQWZyaWNhbiBWaW9sZXQnLFxyXG4gICAgJ0FsYWJhbWEgQ3JpbXNvbicsXHJcbiAgICAnQWxpY2UgQmx1ZScsXHJcbiAgICAnQWxpemFyaW4gQ3JpbXNvbicsXHJcbiAgICAnQWxsb3kgT3JhbmdlJyxcclxuICAgICdBbG1vbmQnLFxyXG4gICAgJ0FtYXJhbnRoJyxcclxuICAgICdBbWFyYW50aCBQaW5rJyxcclxuICAgICdBbWFyYW50aCBQdXJwbGUnLFxyXG4gICAgJ0FtYXpvbicsXHJcbiAgICAnQW1iZXInLFxyXG4gICAgJ0FtZXJpY2FuIFJvc2UnLFxyXG4gICAgJ0FtZXRoeXN0JyxcclxuICAgICdBbmRyb2lkIEdyZWVuJyxcclxuICAgICdBbnRpLUZsYXNoIFdoaXRlJyxcclxuICAgICdBbnRpcXVlIEJyYXNzJyxcclxuICAgICdBbnRpcXVlIEJyb256ZScsXHJcbiAgICAnQW50aXF1ZSBGdWNoc2lhJyxcclxuICAgICdBbnRpcXVlIFJ1YnknLFxyXG4gICAgJ0FudGlxdWUgV2hpdGUnLFxyXG4gICAgJ0FwcGxlIEdyZWVuJyxcclxuICAgICdBcHJpY290JyxcclxuICAgICdBcXVhJyxcclxuICAgICdBcXVhbWFyaW5lJyxcclxuICAgICdBcm15IEdyZWVuJyxcclxuICAgICdBcnNlbmljJyxcclxuICAgICdBcnRpY2hva2UnLFxyXG4gICAgJ0FyeWxpZGUgWWVsbG93JyxcclxuICAgICdBc2ggR3JleScsXHJcbiAgICAnQXNwYXJhZ3VzJyxcclxuICAgICdBdG9taWMgVGFuZ2VyaW5lJyxcclxuICAgICdBdXJlb2xpbicsXHJcbiAgICAnQXVyb01ldGFsU2F1cnVzJyxcclxuICAgICdBdm9jYWRvJyxcclxuICAgICdBenVyZScsXHJcbiAgICAnQXp1cmUgTWlzdCcsXHJcbiAgICAnRGF6emxlZCBCbHVlJyxcclxuICAgICdCYWJ5IEJsdWUnLFxyXG4gICAgJ0JhYnkgQmx1ZSBFeWVzJyxcclxuICAgICdCYWJ5IFBpbmsnLFxyXG4gICAgJ0JhYnkgUG93ZGVyJyxcclxuICAgICdCYWtlci1NaWxsZXIgUGluaycsXHJcbiAgICAnQmFsbCBCbHVlJyxcclxuICAgICdCYW5hbmEgTWFuaWEnLFxyXG4gICAgJ0JhbmFuYSBZZWxsb3cnLFxyXG4gICAgJ0JhbmdsYWRlc2ggR3JlZW4nLFxyXG4gICAgJ0JhcmJpZSBQaW5rJyxcclxuICAgICdCYXJuIFJlZCcsXHJcbiAgICAnQmF0dGxlc2hpcCBHcmV5JyxcclxuICAgICdCYXphYXInLFxyXG4gICAgJ0JlYXUgQmx1ZScsXHJcbiAgICAnQmVhdmVyJyxcclxuICAgICdCZWlnZScsXHJcbiAgICAnQmlzcXVlJyxcclxuICAgICdCaXR0ZXIgTGVtb24nLFxyXG4gICAgJ0JpdHRlciBMaW1lJyxcclxuICAgICdCaXR0ZXJzd2VldCcsXHJcbiAgICAnQml0dGVyc3dlZXQgU2hpbW1lcicsXHJcbiAgICAnQmxhY2snLFxyXG4gICAgJ0JsYWNrIEJlYW4nLFxyXG4gICAgJ0JsYWNrIExlYXRoZXIgSmFja2V0JyxcclxuICAgICdCbGFjayBPbGl2ZScsXHJcbiAgICAnQmxhbmNoZWQgQWxtb25kJyxcclxuICAgICdCbGFzdC1PZmYgQnJvbnplJyxcclxuICAgICdCbGV1IERlIEZyYW5jZScsXHJcbiAgICAnQmxpenphcmQgQmx1ZScsXHJcbiAgICAnQmxvbmQnLFxyXG4gICAgJ0JsdWUnLFxyXG4gICAgJ0JsdWUgQmVsbCcsXHJcbiAgICAnQmx1ZSBTYXBwaGlyZScsXHJcbiAgICAnQmx1ZSBZb25kZXInLFxyXG4gICAgJ0JsdWUtR3JheScsXHJcbiAgICAnQmx1ZS1HcmVlbicsXHJcbiAgICAnQmx1ZS1WaW9sZXQnLFxyXG4gICAgJ0JsdWViZXJyeScsXHJcbiAgICAnQmx1ZWJvbm5ldCcsXHJcbiAgICAnQmx1c2gnLFxyXG4gICAgJ0JvbGUnLFxyXG4gICAgJ0JvbmRpIEJsdWUnLFxyXG4gICAgJ0JvbmUnLFxyXG4gICAgJ0Jvc3RvbiBVbml2ZXJzaXR5IFJlZCcsXHJcbiAgICAnQm90dGxlIEdyZWVuJyxcclxuICAgICdCb3lzZW5iZXJyeScsXHJcbiAgICAnQnJhbmRlaXMgQmx1ZScsXHJcbiAgICAnQnJhc3MnLFxyXG4gICAgJ0JyaWNrIFJlZCcsXHJcbiAgICAnQnJpZ2h0IENlcnVsZWFuJyxcclxuICAgICdCcmlnaHQgR3JlZW4nLFxyXG4gICAgJ0JyaWdodCBMYXZlbmRlcicsXHJcbiAgICAnQnJpZ2h0IExpbGFjJyxcclxuICAgICdCcmlnaHQgTWFyb29uJyxcclxuICAgICdCcmlnaHQgTmF2eSBCbHVlJyxcclxuICAgICdCcmlnaHQgUGluaycsXHJcbiAgICAnQnJpZ2h0IFR1cnF1b2lzZScsXHJcbiAgICAnQnJpZ2h0IFViZScsXHJcbiAgICAnQnJpbGxpYW50IExhdmVuZGVyJyxcclxuICAgICdCcmlsbGlhbnQgUm9zZScsXHJcbiAgICAnQnJpbmsgUGluaycsXHJcbiAgICAnQnJpdGlzaCBSYWNpbmcgR3JlZW4nLFxyXG4gICAgJ0Jyb256ZScsXHJcbiAgICAnQnJvbnplIFllbGxvdycsXHJcbiAgICAnQnJvd24tTm9zZScsXHJcbiAgICAnQnJ1bnN3aWNrIEdyZWVuJyxcclxuICAgICdCdWJibGUgR3VtJyxcclxuICAgICdCdWJibGVzJyxcclxuICAgICdCdWQgR3JlZW4nLFxyXG4gICAgJ0J1ZmYnLFxyXG4gICAgJ0J1bGdhcmlhbiBSb3NlJyxcclxuICAgICdCdXJndW5keScsXHJcbiAgICAnQnVybHl3b29kJyxcclxuICAgICdCdXJudCBPcmFuZ2UnLFxyXG4gICAgJ0J1cm50IFNpZW5uYScsXHJcbiAgICAnQnVybnQgVW1iZXInLFxyXG4gICAgJ0J5emFudGluZScsXHJcbiAgICAnQnl6YW50aXVtJyxcclxuICAgICdDYWRldCcsXHJcbiAgICAnQ2FkZXQgQmx1ZScsXHJcbiAgICAnQ2FkZXQgR3JleScsXHJcbiAgICAnQ2FkbWl1bSBHcmVlbicsXHJcbiAgICAnQ2FkbWl1bSBPcmFuZ2UnLFxyXG4gICAgJ0NhZG1pdW0gUmVkJyxcclxuICAgICdDYWRtaXVtIFllbGxvdycsXHJcbiAgICAnQ2Fmw6kgQXUgTGFpdCcsXHJcbiAgICAnQ2Fmw6kgTm9pcicsXHJcbiAgICAnQ2FsIFBvbHkgUG9tb25hIEdyZWVuJyxcclxuICAgICdDYW1icmlkZ2UgQmx1ZScsXHJcbiAgICAnQ2FtZWwnLFxyXG4gICAgJ0NhbWVvIFBpbmsnLFxyXG4gICAgJ0NhbW91ZmxhZ2UgR3JlZW4nLFxyXG4gICAgJ0NhbmFyeSBZZWxsb3cnLFxyXG4gICAgJ0NhbmR5IEFwcGxlIFJlZCcsXHJcbiAgICAnQ2FuZHkgUGluaycsXHJcbiAgICAnQ2FwcmknLFxyXG4gICAgJ0NhcHV0IE1vcnR1dW0nLFxyXG4gICAgJ0NhcmRpbmFsJyxcclxuICAgICdDYXJpYmJlYW4gR3JlZW4nLFxyXG4gICAgJ0Nhcm1pbmUnLFxyXG4gICAgJ0Nhcm1pbmUgUGluaycsXHJcbiAgICAnQ2FybWluZSBSZWQnLFxyXG4gICAgJ0Nhcm5hdGlvbiBQaW5rJyxcclxuICAgICdDYXJuZWxpYW4nLFxyXG4gICAgJ0Nhcm9saW5hIEJsdWUnLFxyXG4gICAgJ0NhcnJvdCBPcmFuZ2UnLFxyXG4gICAgJ0Nhc3RsZXRvbiBHcmVlbicsXHJcbiAgICAnQ2F0YWxpbmEgQmx1ZScsXHJcbiAgICAnQ2F0YXdiYScsXHJcbiAgICAnQ2VkYXIgQ2hlc3QnLFxyXG4gICAgJ0NlaWwnLFxyXG4gICAgJ0NlbGFkb24nLFxyXG4gICAgJ0NlbGFkb24gQmx1ZScsXHJcbiAgICAnQ2VsYWRvbiBHcmVlbicsXHJcbiAgICAnQ2VsZXN0ZScsXHJcbiAgICAnQ2VsZXN0aWFsIEJsdWUnLFxyXG4gICAgJ0NlcmlzZScsXHJcbiAgICAnQ2VyaXNlIFBpbmsnLFxyXG4gICAgJ0NlcnVsZWFuJyxcclxuICAgICdDZXJ1bGVhbiBCbHVlJyxcclxuICAgICdDZXJ1bGVhbiBGcm9zdCcsXHJcbiAgICAnQ0cgQmx1ZScsXHJcbiAgICAnQ0cgUmVkJyxcclxuICAgICdDaGFtb2lzZWUnLFxyXG4gICAgJ0NoYW1wYWduZScsXHJcbiAgICAnQ2hhcmNvYWwnLFxyXG4gICAgJ0NoYXJsZXN0b24gR3JlZW4nLFxyXG4gICAgJ0NoYXJtIFBpbmsnLFxyXG4gICAgJ0NoZXJyeScsXHJcbiAgICAnQ2hlcnJ5IEJsb3Nzb20gUGluaycsXHJcbiAgICAnQ2hlc3RudXQnLFxyXG4gICAgJ0NoaW5hIFBpbmsnLFxyXG4gICAgJ0NoaW5hIFJvc2UnLFxyXG4gICAgJ0NoaW5lc2UgUmVkJyxcclxuICAgICdDaGluZXNlIFZpb2xldCcsXHJcbiAgICAnQ2hyb21lIFllbGxvdycsXHJcbiAgICAnQ2luZXJlb3VzJyxcclxuICAgICdDaW5uYWJhcicsXHJcbiAgICAnQ2lubmFtb25bQ2l0YXRpb24gTmVlZGVkXScsXHJcbiAgICAnQ2l0cmluZScsXHJcbiAgICAnQ2l0cm9uJyxcclxuICAgICdDbGFyZXQnLFxyXG4gICAgJ0NsYXNzaWMgUm9zZScsXHJcbiAgICAnQ29iYWx0JyxcclxuICAgICdDb2NvYSBCcm93bicsXHJcbiAgICAnQ29jb251dCcsXHJcbiAgICAnQ29mZmVlJyxcclxuICAgICdDb2x1bWJpYSBCbHVlJyxcclxuICAgICdDb25nbyBQaW5rJyxcclxuICAgICdDb29sIEJsYWNrJyxcclxuICAgICdDb29sIEdyZXknLFxyXG4gICAgJ0NvcHBlcicsXHJcbiAgICAnQ29wcGVyIFBlbm55JyxcclxuICAgICdDb3BwZXIgUmVkJyxcclxuICAgICdDb3BwZXIgUm9zZScsXHJcbiAgICAnQ29xdWVsaWNvdCcsXHJcbiAgICAnQ29yYWwnLFxyXG4gICAgJ0NvcmFsIFBpbmsnLFxyXG4gICAgJ0NvcmFsIFJlZCcsXHJcbiAgICAnQ29yZG92YW4nLFxyXG4gICAgJ0Nvcm4nLFxyXG4gICAgJ0Nvcm5lbGwgUmVkJyxcclxuICAgICdDb3JuZmxvd2VyIEJsdWUnLFxyXG4gICAgJ0Nvcm5zaWxrJyxcclxuICAgICdDb3NtaWMgTGF0dGUnLFxyXG4gICAgJ0NvdHRvbiBDYW5keScsXHJcbiAgICAnQ3JlYW0nLFxyXG4gICAgJ0NyaW1zb24nLFxyXG4gICAgJ0NyaW1zb24gR2xvcnknLFxyXG4gICAgJ0N5YW4nLFxyXG4gICAgJ0N5YmVyIEdyYXBlJyxcclxuICAgICdDeWJlciBZZWxsb3cnLFxyXG4gICAgJ0RhZmZvZGlsJyxcclxuICAgICdEYW5kZWxpb24nLFxyXG4gICAgJ0RhcmsgQmx1ZScsXHJcbiAgICAnRGFyayBCbHVlLUdyYXknLFxyXG4gICAgJ0RhcmsgQnJvd24nLFxyXG4gICAgJ0RhcmsgQnl6YW50aXVtJyxcclxuICAgICdEYXJrIENhbmR5IEFwcGxlIFJlZCcsXHJcbiAgICAnRGFyayBDZXJ1bGVhbicsXHJcbiAgICAnRGFyayBDaGVzdG51dCcsXHJcbiAgICAnRGFyayBDb3JhbCcsXHJcbiAgICAnRGFyayBDeWFuJyxcclxuICAgICdEYXJrIEVsZWN0cmljIEJsdWUnLFxyXG4gICAgJ0RhcmsgR29sZGVucm9kJyxcclxuICAgICdEYXJrIEdyZWVuJyxcclxuICAgICdEYXJrIEltcGVyaWFsIEJsdWUnLFxyXG4gICAgJ0RhcmsgSnVuZ2xlIEdyZWVuJyxcclxuICAgICdEYXJrIEtoYWtpJyxcclxuICAgICdEYXJrIExhdmEnLFxyXG4gICAgJ0RhcmsgTGF2ZW5kZXInLFxyXG4gICAgJ0RhcmsgTGl2ZXInLFxyXG4gICAgJ0RhcmsgTWFnZW50YScsXHJcbiAgICAnRGFyayBNZWRpdW0gR3JheScsXHJcbiAgICAnRGFyayBNaWRuaWdodCBCbHVlJyxcclxuICAgICdEYXJrIE1vc3MgR3JlZW4nLFxyXG4gICAgJ0RhcmsgT2xpdmUgR3JlZW4nLFxyXG4gICAgJ0RhcmsgT3JhbmdlJyxcclxuICAgICdEYXJrIE9yY2hpZCcsXHJcbiAgICAnRGFyayBQYXN0ZWwgQmx1ZScsXHJcbiAgICAnRGFyayBQYXN0ZWwgR3JlZW4nLFxyXG4gICAgJ0RhcmsgUGFzdGVsIFB1cnBsZScsXHJcbiAgICAnRGFyayBQYXN0ZWwgUmVkJyxcclxuICAgICdEYXJrIFBpbmsnLFxyXG4gICAgJ0RhcmsgUG93ZGVyIEJsdWUnLFxyXG4gICAgJ0RhcmsgUHVjZScsXHJcbiAgICAnRGFyayBSYXNwYmVycnknLFxyXG4gICAgJ0RhcmsgUmVkJyxcclxuICAgICdEYXJrIFNhbG1vbicsXHJcbiAgICAnRGFyayBTY2FybGV0JyxcclxuICAgICdEYXJrIFNlYSBHcmVlbicsXHJcbiAgICAnRGFyayBTaWVubmEnLFxyXG4gICAgJ0RhcmsgU2t5IEJsdWUnLFxyXG4gICAgJ0RhcmsgU2xhdGUgQmx1ZScsXHJcbiAgICAnRGFyayBTbGF0ZSBHcmF5JyxcclxuICAgICdEYXJrIFNwcmluZyBHcmVlbicsXHJcbiAgICAnRGFyayBUYW4nLFxyXG4gICAgJ0RhcmsgVGFuZ2VyaW5lJyxcclxuICAgICdEYXJrIFRhdXBlJyxcclxuICAgICdEYXJrIFRlcnJhIENvdHRhJyxcclxuICAgICdEYXJrIFR1cnF1b2lzZScsXHJcbiAgICAnRGFyayBWYW5pbGxhJyxcclxuICAgICdEYXJrIFZpb2xldCcsXHJcbiAgICAnRGFyayBZZWxsb3cnLFxyXG4gICAgJ0RhcnRtb3V0aCBHcmVlbicsXHJcbiAgICAnRGViaWFuIFJlZCcsXHJcbiAgICAnRGVlcCBDYXJtaW5lJyxcclxuICAgICdEZWVwIENhcm1pbmUgUGluaycsXHJcbiAgICAnRGVlcCBDYXJyb3QgT3JhbmdlJyxcclxuICAgICdEZWVwIENlcmlzZScsXHJcbiAgICAnRGVlcCBDaGFtcGFnbmUnLFxyXG4gICAgJ0RlZXAgQ2hlc3RudXQnLFxyXG4gICAgJ0RlZXAgQ29mZmVlJyxcclxuICAgICdEZWVwIEZ1Y2hzaWEnLFxyXG4gICAgJ0RlZXAgSnVuZ2xlIEdyZWVuJyxcclxuICAgICdEZWVwIExlbW9uJyxcclxuICAgICdEZWVwIExpbGFjJyxcclxuICAgICdEZWVwIE1hZ2VudGEnLFxyXG4gICAgJ0RlZXAgTWF1dmUnLFxyXG4gICAgJ0RlZXAgTW9zcyBHcmVlbicsXHJcbiAgICAnRGVlcCBQZWFjaCcsXHJcbiAgICAnRGVlcCBQaW5rJyxcclxuICAgICdEZWVwIFB1Y2UnLFxyXG4gICAgJ0RlZXAgUnVieScsXHJcbiAgICAnRGVlcCBTYWZmcm9uJyxcclxuICAgICdEZWVwIFNreSBCbHVlJyxcclxuICAgICdEZWVwIFNwYWNlIFNwYXJrbGUnLFxyXG4gICAgJ0RlZXAgVGF1cGUnLFxyXG4gICAgJ0RlZXAgVHVzY2FuIFJlZCcsXHJcbiAgICAnRGVlcicsXHJcbiAgICAnRGVuaW0nLFxyXG4gICAgJ0Rlc2VydCcsXHJcbiAgICAnRGVzZXJ0IFNhbmQnLFxyXG4gICAgJ0Rlc2lyZScsXHJcbiAgICAnRGlhbW9uZCcsXHJcbiAgICAnRGltIEdyYXknLFxyXG4gICAgJ0RpcnQnLFxyXG4gICAgJ0RvZGdlciBCbHVlJyxcclxuICAgICdEb2d3b29kIFJvc2UnLFxyXG4gICAgJ0RvbGxhciBCaWxsJyxcclxuICAgICdEb25rZXkgQnJvd24nLFxyXG4gICAgJ0RyYWInLFxyXG4gICAgJ0R1a2UgQmx1ZScsXHJcbiAgICAnRHVzdCBTdG9ybScsXHJcbiAgICAnRHV0Y2ggV2hpdGUnLFxyXG4gICAgJ0VhcnRoIFllbGxvdycsXHJcbiAgICAnRWJvbnknLFxyXG4gICAgJ0VjcnUnLFxyXG4gICAgJ0VlcmllIEJsYWNrJyxcclxuICAgICdFZ2dwbGFudCcsXHJcbiAgICAnRWdnc2hlbGwnLFxyXG4gICAgJ0VneXB0aWFuIEJsdWUnLFxyXG4gICAgJ0VsZWN0cmljIEJsdWUnLFxyXG4gICAgJ0VsZWN0cmljIENyaW1zb24nLFxyXG4gICAgJ0VsZWN0cmljIEN5YW4nLFxyXG4gICAgJ0VsZWN0cmljIEdyZWVuJyxcclxuICAgICdFbGVjdHJpYyBJbmRpZ28nLFxyXG4gICAgJ0VsZWN0cmljIExhdmVuZGVyJyxcclxuICAgICdFbGVjdHJpYyBMaW1lJyxcclxuICAgICdFbGVjdHJpYyBQdXJwbGUnLFxyXG4gICAgJ0VsZWN0cmljIFVsdHJhbWFyaW5lJyxcclxuICAgICdFbGVjdHJpYyBWaW9sZXQnLFxyXG4gICAgJ0VsZWN0cmljIFllbGxvdycsXHJcbiAgICAnRW1lcmFsZCcsXHJcbiAgICAnRW1pbmVuY2UnLFxyXG4gICAgJ0VuZ2xpc2ggR3JlZW4nLFxyXG4gICAgJ0VuZ2xpc2ggTGF2ZW5kZXInLFxyXG4gICAgJ0VuZ2xpc2ggUmVkJyxcclxuICAgICdFbmdsaXNoIFZpb2xldCcsXHJcbiAgICAnRXRvbiBCbHVlJyxcclxuICAgICdFdWNhbHlwdHVzJyxcclxuICAgICdGYWxsb3cnLFxyXG4gICAgJ0ZhbHUgUmVkJyxcclxuICAgICdGYW5kYW5nbycsXHJcbiAgICAnRmFuZGFuZ28gUGluaycsXHJcbiAgICAnRmFzaGlvbiBGdWNoc2lhJyxcclxuICAgICdGYXduJyxcclxuICAgICdGZWxkZ3JhdScsXHJcbiAgICAnRmVsZHNwYXInLFxyXG4gICAgJ0Zlcm4gR3JlZW4nLFxyXG4gICAgJ0ZlcnJhcmkgUmVkJyxcclxuICAgICdGaWVsZCBEcmFiJyxcclxuICAgICdGaXJlIEVuZ2luZSBSZWQnLFxyXG4gICAgJ0ZpcmVicmljaycsXHJcbiAgICAnRmxhbWUnLFxyXG4gICAgJ0ZsYW1pbmdvIFBpbmsnLFxyXG4gICAgJ0ZsYXR0ZXJ5JyxcclxuICAgICdGbGF2ZXNjZW50JyxcclxuICAgICdGbGF4JyxcclxuICAgICdGbGlydCcsXHJcbiAgICAnRmxvcmFsIFdoaXRlJyxcclxuICAgICdGbHVvcmVzY2VudCBPcmFuZ2UnLFxyXG4gICAgJ0ZsdW9yZXNjZW50IFBpbmsnLFxyXG4gICAgJ0ZsdW9yZXNjZW50IFllbGxvdycsXHJcbiAgICAnRm9sbHknLFxyXG4gICAgJ0ZyZW5jaCBCZWlnZScsXHJcbiAgICAnRnJlbmNoIEJpc3RyZScsXHJcbiAgICAnRnJlbmNoIEJsdWUnLFxyXG4gICAgJ0ZyZW5jaCBGdWNoc2lhJyxcclxuICAgICdGcmVuY2ggTGlsYWMnLFxyXG4gICAgJ0ZyZW5jaCBMaW1lJyxcclxuICAgICdGcmVuY2ggTWF1dmUnLFxyXG4gICAgJ0ZyZW5jaCBQaW5rJyxcclxuICAgICdGcmVuY2ggUGx1bScsXHJcbiAgICAnRnJlbmNoIFB1Y2UnLFxyXG4gICAgJ0ZyZW5jaCBSYXNwYmVycnknLFxyXG4gICAgJ0ZyZW5jaCBSb3NlJyxcclxuICAgICdGcmVuY2ggU2t5IEJsdWUnLFxyXG4gICAgJ0ZyZW5jaCBWaW9sZXQnLFxyXG4gICAgJ0ZyZW5jaCBXaW5lJyxcclxuICAgICdGcmVzaCBBaXInLFxyXG4gICAgJ0Z1Y2hzaWEnLFxyXG4gICAgJ0Z1Y2hzaWEgUGluaycsXHJcbiAgICAnRnVjaHNpYSBQdXJwbGUnLFxyXG4gICAgJ0Z1Y2hzaWEgUm9zZScsXHJcbiAgICAnRnVsdm91cycsXHJcbiAgICAnRnV6enkgV3V6enknLFxyXG5dO1xyXG5cclxuZnVuY3Rpb24gcmFuZG9tKGxpc3Qpe1xyXG4gICAgcmV0dXJuIGxpc3RbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmxpc3QubGVuZ3RoKV07XHJcbn1cclxuXHJcbmV4cG9ydHMuY29sb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gcmFuZG9tKGRhdGEuY29sb3JzKTtcclxufTtcclxuXHJcbmV4cG9ydHMuYW5pbWFsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHJhbmRvbShkYXRhLmFuaW1hbHMpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5jb2xvckFuaW1hbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLmNvbG9yKCkgKyBcIiBcIiArIHRoaXMuYW5pbWFsKCk7XHJcbn07IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblxyXG5cclxudmFyIEFwcGxpY2F0aW9uID0gcmVxdWlyZSgnLi9hcHBsaWNhdGlvbicpO1xyXG52YXIgUmVzdWx0UmVuZGVyZXIgPSByZXF1aXJlKCcuL3Jlc3VsdC1yZW5kZXJlcicpO1xyXG52YXIgSWNvbiA9IHJlcXVpcmUoJy4vYm9vdHN0cmFwL2ljb24nKTtcclxudmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuXHJcblxyXG52YXIgTmF2QmFyID1SZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdOYXZCYXInLFxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5uYXYoIHtjbGFzc05hbWU6XCJuYXZiYXIgbmF2YmFyLWRlZmF1bHRcIiwgcm9sZTpcIm5hdmlnYXRpb25cIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29udGFpbmVyLWZsdWlkXCJ9LCBcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJuYXZiYXItaGVhZGVyXCJ9LCBcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYSgge2NsYXNzTmFtZTpcIm5hdmJhci1icmFuZFwiLCBocmVmOlwiI1wifSwgSWNvbigge2ljb246XCJmaXJlXCJ9KSxcbiAgICAgICAgICAgICAgICAgICAgXCIgUmFuZG9tIFdlYXZlIFN0cmlwZXNcIilcclxuICAgICAgICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibmF2IG5hdmJhci1uYXZcIn0sIFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5saSgge2NsYXNzTmFtZTpcImFjdGl2ZVwifSwgUmVhY3QuRE9NLmEoIHtocmVmOlwiI1wifSwgXCJQcm9qZWN0c1wiKSlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxudmFyIFVwbG9hZEZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdVcGxvYWRGb3JtJyxcclxuICAgIG9uU3VibWl0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcblxyXG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICAgICAgaWYoZXZ0LnRhcmdldC5yZWFkeVN0YXRlICE9IDIpIHJldHVybjtcclxuICAgICAgICAgICAgaWYoZXZ0LnRhcmdldC5lcnJvcikge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoJ0Vycm9yIHdoaWxlIHJlYWRpbmcgZmlsZScpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmaWxlY29udGVudCA9IGV2dC50YXJnZXQucmVzdWx0O1xyXG5cclxuICAgICAgICAgICAgdmFyIG5ld0lkID0gXCJcIiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwMDApO1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IEpTT04ucGFyc2UoZXZ0LnRhcmdldC5yZXN1bHQpO1xyXG4gICAgICAgICAgICBkYXRhLm5hbWUgPSBkYXRhLm5hbWUgKyBcIiBbSW1wb3J0ZWRdXCI7XHJcbiAgICAgICAgICAgIHN0b3JhZ2Uuc2F2ZShuZXdJZCwgZGF0YSk7XHJcbiAgICAgICAgICAgIHJvdXRpZShyb3V0aWUubG9va3VwKCdwcm9qZWN0Jywge2lkOiBuZXdJZH0pKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZWFkZXIucmVhZEFzVGV4dCh0aGlzLnJlZnMuZmlsZS5nZXRET01Ob2RlKCkuZmlsZXNbMF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGlja0ZpbGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnJlZnMuZmlsZS5nZXRET01Ob2RlKCkuY2xpY2soKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5mb3JtKG51bGwsIFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIiwgb25DbGljazp0aGlzLmNsaWNrRmlsZX0sIEljb24oIHtpY29uOlwiZmxvcHB5LW9wZW5cIn0pLCBcIiBJbXBvcnQgUHJvamVjdFwiKSxcclxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwiZmlsZVwiLCByZWY6XCJmaWxlXCIsIG9uQ2hhbmdlOnRoaXMub25TdWJtaXQsIGNsYXNzTmFtZTpcImhpZGRlblwifSlcclxuICAgICAgICAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVkIGJ5IGthandpXzAwMCBvbiAyMDE0LTA0LTA3LlxyXG4gKi9cclxudmFyIFByb2plY3RQaWNrZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQcm9qZWN0UGlja2VyJyxcclxuXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcHJvamVjdHM6IFtdXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByb3V0aWUoJ3Byb2plY3QgcHJvamVjdC86aWQnLCBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coaWQpO1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjdXJyZW50SWQ6IGlkfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgcm91dGllKCcqJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtjdXJyZW50SWQ6IG51bGwsICBwcm9qZWN0czogc3RvcmFnZS5saXN0UHJvamVjdHMoKX0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNyZWF0ZU5ldzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBuZXdJZCA9IFwiXCIgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMDAwKTtcclxuICAgICAgICByb3V0aWUocm91dGllLmxvb2t1cCgncHJvamVjdCcsIHtpZDogbmV3SWR9KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgcHJvamVjdHMgPSB0aGlzLnN0YXRlLnByb2plY3RzLnNsaWNlKCk7XHJcbiAgICAgICAgcHJvamVjdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgICAgICB2YXIgb25lID0gKGIubGFzdENoYW5nZSB8fCAwKSAtIChhLmxhc3RDaGFuZ2UgfHwgMCkgO1xyXG5cclxuICAgICAgICAgICAgaWYob25lID09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9uZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIHByb2plY3RWaWV3cyA9IHByb2plY3RzLm1hcChmdW5jdGlvbiAocHJvamVjdCkge1xyXG4gICAgICAgICAgICB2YXIgcHJldmlldztcclxuICAgICAgICAgICAgaWYocHJvamVjdC5yZXN1bHQpe1xyXG4gICAgICAgICAgICAgICAgcHJldmlldyA9IFJlc3VsdFJlbmRlcmVyKCB7cmVzdWx0OnByb2plY3QucmVzdWx0LCBoZWlnaHQ6XCIyMFwifSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIG1ha2VMaW5rKGlubmVyKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBSZWFjdC5ET00uYSgge2hyZWY6JyMnICsgcm91dGllLmxvb2t1cCgncHJvamVjdCcsIHtpZDogcHJvamVjdC5pZH0pfSwgaW5uZXIpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiAoUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIG1ha2VMaW5rKHByb2plY3QubmFtZSkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWtlTGluayhwcmV2aWV3KVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHZhciBwYWdlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5jdXJyZW50SWQpIHtcclxuICAgICAgICAgICAgcGFnZSA9IEFwcGxpY2F0aW9uKCB7aWQ6dGhpcy5zdGF0ZS5jdXJyZW50SWR9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcGFnZSA9IFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb250YWluZXItZmx1aWRcIn0sIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmgxKCB7Y2xhc3NOYW1lOlwicGFnZS1oZWFkZXIgcGFnZS1oZWFkZXItbWFpblwifSwgXCJTYXZlZCBwcm9qZWN0c1wiKSxcclxuICAgICAgICAgICAgICAgIHByb2plY3RWaWV3cyxcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmEoIHtjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIiwgb25DbGljazp0aGlzLmNyZWF0ZU5ld30sIEljb24oIHtpY29uOlwicGx1c1wifSksIFwiIE5ldyBQcm9qZWN0XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5icihudWxsKSxSZWFjdC5ET00uYnIobnVsbCksXHJcbiAgICAgICAgICAgICAgICAgICAgVXBsb2FkRm9ybShudWxsKVxyXG5cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYobnVsbCwgTmF2QmFyKG51bGwpLHBhZ2UpXHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcm9qZWN0UGlja2VyOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxuXHJcblxyXG52YXIgc3RyaXBlcyA9IHJlcXVpcmUoJy4vc3RyaXBlcycpO1xyXG5cclxuXHJcbnZhciBSZW5kZXJlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1JlbmRlcmVyJyxcclxuICAgIGN0eDogbnVsbCxcclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJQb2ludHModGhpcy5wcm9wcyk7XHJcbiAgICB9LFxyXG5cclxuLy8gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbiAocHJvcHMpIHtcclxuLy8gICAgICAgIHRoaXMucmVuZGVyUG9pbnRzKHByb3BzKTtcclxuLy8gICAgICAgIHJldHVybiBmYWxzZTtcclxuLy8gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcm9wcykge1xyXG4gICAgICAgIHRoaXMucmVuZGVyUG9pbnRzKHRoaXMucHJvcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXJQb2ludHM6IGZ1bmN0aW9uIChwcm9wcykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBzdHJpcGVzKHByb3BzLmxheWVycywgdGhpcy5wcm9wcy5zaXplLngpO1xyXG5cclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRET01Ob2RlKCkuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICAgICAgdmFyIHNpemU9IHRoaXMucHJvcHMuc2l6ZTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gJ2dyZXknO1xyXG4gICAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCBzaXplLngsIHNpemUueSk7XHJcblxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gcmVzdWx0W2ldO1xyXG4gICAgICAgICAgICBjdHguZmlsbFJlY3QoaSwgMCwgMSwgc2l6ZS55KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4vLyAgICAgICAgcmV0dXJuIDxkaXY+aGVsbG88L2Rpdj5cclxuICAgICAgICByZXR1cm4gIFJlYWN0LkRPTS5jYW52YXMoIHt3aWR0aDp0aGlzLnByb3BzLnNpemUueCwgaGVpZ2h0OnRoaXMucHJvcHMuc2l6ZS55fSlcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cclxuXHJcblxyXG52YXIgc3RyaXBlcyA9IHJlcXVpcmUoJy4vc3RyaXBlcycpO1xyXG5cclxuXHJcbnZhciBSZW5kZXJlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1JlbmRlcmVyJyxcclxuICAgIGN0eDogbnVsbCxcclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJQb2ludHModGhpcy5wcm9wcyk7XHJcbiAgICB9LFxyXG5cclxuLy8gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbiAocHJvcHMpIHtcclxuLy8gICAgICAgIHRoaXMucmVuZGVyUG9pbnRzKHByb3BzKTtcclxuLy8gICAgICAgIHJldHVybiBmYWxzZTtcclxuLy8gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcm9wcykge1xyXG4gICAgICAgIHRoaXMucmVuZGVyUG9pbnRzKHRoaXMucHJvcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXJQb2ludHM6IGZ1bmN0aW9uIChwcm9wcykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBwcm9wcy5yZXN1bHQ7XHJcblxyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldERPTU5vZGUoKS5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgICAgICB2YXIgc2l6ZT0gdGhpcy5wcm9wcy5zaXplO1xyXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSAncGluayc7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIHJlc3VsdC5sZW5ndGgsIHByb3BzLmhlaWdodCk7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSByZXN1bHRbaV07XHJcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdChpLCAwLCAxLCBwcm9wcy5oZWlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHJldHVybiAgUmVhY3QuRE9NLmNhbnZhcygge3dpZHRoOnRoaXMucHJvcHMucmVzdWx0Lmxlbmd0aCwgaGVpZ2h0OnRoaXMucHJvcHMuaGVpZ2h0fSlcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyOyIsInZhciBSbmQgPSB7fTtcclxuXHJcblJuZC5jb2xvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBjb2xvciA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDE2Nzc3MjE2KS50b1N0cmluZygxNik7XHJcbiAgICByZXR1cm4gJyMwMDAwMDAnLnNsaWNlKDAsIC1jb2xvci5sZW5ndGgpICsgY29sb3I7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJuZDtcclxuIiwidmFyIFJuZCA9IHJlcXVpcmUoJy4vcm5kJyk7XHJcbnZhciBOYW1lR2VuID0gcmVxdWlyZSgnLi9uYW1lLWdlbicpO1xyXG52YXIgTGF5ZXIgPSByZXF1aXJlKCcuL2RhdGEvbGF5ZXInKTtcclxudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9kYXRhL3BvaW50Jyk7XHJcblxyXG52YXIgc3RyaXBlcyA9IHJlcXVpcmUoJy4vc3RyaXBlcycpO1xyXG5cclxudmFyIGR1bW15ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBuYW1lOiBOYW1lR2VuLmNvbG9yQW5pbWFsKCksXHJcbiAgICAgICAgc2l6ZToge1xyXG4gICAgICAgICAgICB4OiA4MDAsXHJcbiAgICAgICAgICAgIHk6IDIwMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZWRpdG9yU2l6ZTogMzAwLFxyXG4gICAgICAgIGxheWVyRGF0YToge1xyXG4gICAgICAgICAgICBzZWxlY3RlZDoxLFxyXG4gICAgICAgICAgICBsYXllcnM6IFtcclxuICAgICAgICAgICAgICAgIG5ldyBMYXllcihSbmQuY29sb3IoKSwgW1xyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBQb2ludChNYXRoLnJhbmRvbSgpLCBNYXRoLnJhbmRvbSgpKSxcclxuICAgICAgICAgICAgICAgICAgICBuZXcgUG9pbnQoTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSksXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IFBvaW50KE1hdGgucmFuZG9tKCksIE1hdGgucmFuZG9tKCkpXHJcbiAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgIG5ldyBMYXllcihSbmQuY29sb3IoKSwgW1xyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBQb2ludChNYXRoLnJhbmRvbSgpLCBNYXRoLnJhbmRvbSgpKSxcclxuICAgICAgICAgICAgICAgICAgICBuZXcgUG9pbnQoTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSlcclxuICAgICAgICAgICAgICAgIF0pXVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5cclxudmFyIHByb2plY3RQcmVmaXggPSBcInJhbmRvbS13ZWF2ZS1cIjtcclxudmFyIHN0b3JhZ2UgPSB7XHJcbiAgICBzYXZlOiBmdW5jdGlvbiAoaWQsIGRhdGEpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gc3RyaXBlcyhkYXRhLmxheWVyRGF0YS5sYXllcnMsIGRhdGEuc2l6ZS54KTtcclxuICAgICAgICB2YXIgZGVzYyA9IHtcclxuICAgICAgICAgICAgICAgIGlkOiBpZCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IGRhdGEubmFtZSxcclxuICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgbGFzdENoYW5nZTogRGF0ZS5ub3coKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLWRhdGEtXCIgKyBpZCwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi1kZXNjLVwiICsgaWQsIEpTT04uc3RyaW5naWZ5KGRlc2MpKTtcclxuICAgIH0sXHJcbiAgICBsb2FkOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgaXRlbSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi1kYXRhLVwiICsgaWQpO1xyXG4gICAgICAgICAgICBpZiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoaXRlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IGR1bW15KCk7XHJcbiAgICAgICAgdGhpcy5zYXZlKGlkLCBkYXRhKTtcclxuICAgICAgICByZXR1cm4gIGRhdGE7XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItZGF0YS1cIiArIGlkLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLWRlc2MtXCIgKyBpZCwgSlNPTi5zdHJpbmdpZnkoZGVzYykpO1xyXG4gICAgfSxcclxuICAgIGxpc3RQcm9qZWN0czogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwcm9qZWN0cyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG9jYWxTdG9yYWdlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpO1xyXG4gICAgICAgICAgICBpZihrZXkuaW5kZXhPZihwcm9qZWN0UHJlZml4ICsgXCItZGVzYy1cIikgPT09IDApe1xyXG4gICAgICAgICAgICAgICAgdmFyIGRlc2MgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpXHJcbiAgICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKGRlc2MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvamVjdHM7XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHM9IHN0b3JhZ2U7XHJcbiIsInZhciBNYXRoVXRpbHMgPSByZXF1aXJlKCcuL21hdGgtdXRpbHMnKTtcclxuXHJcbnZhciBzZWVkUmFuZG9tID0gZnVuY3Rpb24gKHNlZWQpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHggPSBNYXRoLnNpbihzZWVkKyspICogMTAwMDA7XHJcbiAgICAgICAgcmV0dXJuIHggLSBNYXRoLmZsb29yKHgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobGF5ZXJzLCBzaXplKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICBmb3IgKHZhciBmID0gMDsgZiA8IHNpemU7IGYrKykge1xyXG4gICAgICAgIHJlc3VsdC5wdXNoKFwiI2ZjZmNmY1wiKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgc2NhbGUgPSBmdW5jdGlvbiAocCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6IHAueCAqIHNpemUsXHJcbiAgICAgICAgICAgIHk6IDEgLSBwLnlcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxuXHJcbiAgICBmb3IgKHZhciBsaSA9IDA7IGxpIDwgbGF5ZXJzLmxlbmd0aDsgbGkrKykge1xyXG4gICAgICAgIHZhciBsYXllciA9IGxheWVyc1tsaV07XHJcblxyXG4gICAgICAgIHJuZCA9IHNlZWRSYW5kb20obGF5ZXIuc2VlZCB8fCBsaSsxKTtcclxuICAgICAgICB2YXIgcG9pbnRzID0gbGF5ZXIucG9pbnRzO1xyXG5cclxuICAgICAgICB2YXIgemVybyA9IHt4OjAsIHk6MH07XHJcbiAgICAgICAgdmFyIG1heCA9IHt4OiBzaXplLTEsIHk6MX07XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBwb2ludHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHAxID0gc2NhbGUocG9pbnRzW2kgLSAxXSk7XHJcbiAgICAgICAgICAgIHZhciBwMiA9IHNjYWxlKHBvaW50c1tpXSk7XHJcbiAgICAgICAgICAgIE1hdGhVdGlscy5jb25zdHJhaW5Qb2ludChwMSwgemVybywgbWF4KTtcclxuICAgICAgICAgICAgTWF0aFV0aWxzLmNvbnN0cmFpblBvaW50KHAyLCB6ZXJvLCBtYXgpO1xyXG4gICAgICAgICAgICBwMS54ID0gTWF0aC5mbG9vcihwMS54KTtcclxuICAgICAgICAgICAgcDIueCA9IE1hdGguZmxvb3IocDIueCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbSA9IChwMi55IC0gcDEueSkgLyAocDIueCAtIHAxLngpO1xyXG4gICAgICAgICAgICB2YXIgYiA9IHAxLnkgLSBtICogcDEueDtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSBwMS54OyBqIDw9IHAyLng7IGorKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJuZFZhbCA9IHJuZCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHkgPSBtICogaiArIGI7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJuZFZhbCA8PSB5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2pdID0gbGF5ZXIuY29sb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59OyJdfQ==
