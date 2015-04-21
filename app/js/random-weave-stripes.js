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
var KindInput = require('./kind-input');

var storage = require('./storage');

var stripes = require('./stripes');



var changed = function (target, changes) {
    return _.extend(_.clone(target), changes);
};




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

},{"./bootstrap/icon":3,"./bootstrap/icon-button":2,"./data/layer":4,"./data/point":5,"./kind-input":8,"./layer-lines-editor":9,"./layer-list":10,"./renderer":14,"./rnd":16,"./storage":17,"./stripes":18}],2:[function(require,module,exports){
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


var In = React.createClass({displayName: 'In',
    getInitialState: function () {
        return {
            value: null,
            active: false
        };
    },

    onChange: function (e) {
        var v = e.target.value;
        this.setState({value: v, active: true});
    },

    onBlur: function () {
        this.props.onChange && this.props.onChange(this.state.value);
        this.setState({active: false});
    },
    onFocus: function () {
        this.setState({value: this.props.value, active: true});
    },

    render: function () {
        var style = {};

        var value = this.props.value;
        if(this.state.active){
            value = this.state.value;
            if (this.props.value != this.state.value) {
                style.color = 'orange';
            }
        }


        return this.transferPropsTo(React.DOM.input( {value:value, onChange:this.onChange, style:style, onBlur:this.onBlur, onFocus:this.onFocus}));
    }
});

module.exports = In;
},{}],7:[function(require,module,exports){
/** @jsx React.DOM */

var ProjectPicker = require('./project-picker');

React.renderComponent(
    ProjectPicker(null ),
    document.getElementById('application')
);

},{"./project-picker":13}],8:[function(require,module,exports){
/** @jsx React.DOM */


var KindInput = React.createClass({displayName: 'KindInput',
    getInitialState: function () {
        return {
            value: this.props.value
        };
    },

    onChange: function (e) {
        var v = e.target.value;
        this.setState({value: v});
        this.props.onChange && this.props.onChange(v);
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

module.exports = KindInput;
},{}],9:[function(require,module,exports){
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
},{"./bootstrap/icon-button":2,"./data/point":5,"./math-utils":11}],10:[function(require,module,exports){
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
},{"./bootstrap/icon-button":2,"./data/layer":4,"./data/point":5,"./rnd":16}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
/** @jsx React.DOM */


var Application = require('./application');
var Stripifier = require('./stripifier/stripifier');
var ResultRenderer = require('./result-renderer');
var WifEditor = require('./wif-editor');
var WifList = require('./wif-list');
var Icon = require('./bootstrap/icon');
var storage = require('./storage');


var NavBar = React.createClass({displayName: 'NavBar',
    render: function () {
        var proActive = this.props.page == 'projects'?'active':'';
        var wifActive = this.props.page == 'wifs'?'active':'';
        var stripifierActive = this.props.page == 'stripifier'?'active':'';
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
                ),
                React.DOM.ul( {className:"nav navbar-nav"}, 
                    React.DOM.li( {className:stripifierActive}, React.DOM.a( {href:"#stripifier"}, "Image Stripifier"))
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
        routie('stripifier stripifier', function (id) {
            this.setState({pageGroup: 'stripifier', page: 'stripifier', id: id});
        }.bind(this));

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
        else if (this.state.page == 'stripifier') {
            page = Stripifier(null)
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
},{"./application":1,"./bootstrap/icon":3,"./result-renderer":15,"./storage":17,"./stripifier/stripifier":20,"./wif-editor":21,"./wif-list":22}],14:[function(require,module,exports){
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
},{"./stripes":18}],15:[function(require,module,exports){
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
        return  React.DOM.canvas( {width:this.props.result.length, height:this.props.height})
    }
});

module.exports = Renderer;
},{"./stripes":18}],16:[function(require,module,exports){
var Rnd = {};

Rnd.color = function () {
    var color = Math.floor(Math.random() * 16777216).toString(16);
    return '#000000'.slice(0, -color.length) + color;
};

module.exports = Rnd;

},{}],17:[function(require,module,exports){
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

},{"./data/layer":4,"./data/point":5,"./name-gen":12,"./rnd":16,"./stripes":18}],18:[function(require,module,exports){
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
},{"./math-utils":11}],19:[function(require,module,exports){
/** @jsx React.DOM */

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}



var Renderer = React.createClass({displayName: 'Renderer',
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
                this.props.onImageWidth(imageObj.width);
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
        return  React.DOM.canvas( {width:this.props.width, height:this.props.height, onMouseMove:this.onMouse,
        onMouseDown:this.onMouseDown,
        onMouseUp:this.onMouseUp}
        )
    }
});

module.exports = Renderer;
},{}],20:[function(require,module,exports){
/** @jsx React.DOM */

var ResultRenderer = require('./../result-renderer.js');
var Extractor = require('./pixel-extractor.js');
var Icon = require('../bootstrap/icon');
var DelayedInput = require('../delayed-input');
var IconButton = require('../bootstrap/icon-button');

var UploadForm = React.createClass({displayName: 'UploadForm',
    onSubmit: function () {
        var reader = new FileReader();

        reader.onloadend = function(evt) {
            if(evt.target.error) {
                alert('Error while reading file');
                return;
            }

            filecontent = evt.target.result;

            this.props.onLoad(evt.target.result)


        }.bind(this);

        reader.readAsDataURL(this.refs.file.getDOMNode().files[0]);
    },

    clickFile: function () {
        this.refs.file.getDOMNode().click();
    },

    render: function () {
        var style={color:'white'};
        return React.DOM.form( {onSubmit:this.onSubmit}, 
            React.DOM.h4(null, "Load image"),

            React.DOM.input( {type:"file", ref:"file", className:"white-file", style:style} ),React.DOM.br(null),
            React.DOM.button( {className:"btn btn-default"}, Icon( {icon:"floppy-open"}), " Load")
        )
    }
});

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function hexToRgbStr(hex) {
    var result = hexToRgb(hex);
    return result?[result.r,result.g,result.b].join(","):null
}

var TextResultDisplay = React.createClass({displayName: 'TextResultDisplay',
    render: function () {
        var colorsArray = [];

        var colorsText =  "[COLORS]\n" + this.props.result.map(function (r, i) {
            var nr = colorsArray.indexOf(r);
            if(nr < 0){
                colorsArray.push(r);
                nr = colorsArray.length - 1;
            }
            return (i + 1) + "=" + (nr + 1);

        }).join("\n");
        //text += JSON.stringify(this.props.result);

        var tableText = "[COLOR TABLE]\n" + colorsArray.map(function (c, i) {
                return (i + 1) + "=" + hexToRgbStr(c);
            }).join("\n");

        return React.DOM.textarea( {col:"100", rows:this.props.result.length + colorsArray.length + 4, value:tableText + "\n\n" +colorsText})
    }
});


var Stripifier = React.createClass({displayName: 'Stripifier',

    getInitialState: function () {
        return {result: [], imageURL: null, width: 800, height: 200, output: 200};
    },

    resultChanged: function (result) {
        this.setState({result: result});
    },
    onImageLoad: function (imageURL) {
        this.setState({imageURL: imageURL});
    },

    onWidthChange: function (v) {
        this.setState({width: v});
    },

    onHeightChange: function (v) {
        this.setState({height: v});
    },

    onOutHeightChange: function (v) {
        this.setState({output: v});
    },

    saveImage: function () {
        var pom = document.createElement('a');
        pom.setAttribute('href', window._hack_strip.toDataURL('image/png'));
        pom.setAttribute('download', "stripifier_image.png");
        pom.click();
    },

    imageWidthChanged: function (width) {
        this.onWidthChange(width);
    },

    render: function () {
        var inputStyle = {width: 300};

        return React.DOM.div( {className:"container-fluid"}, 
            UploadForm( {onLoad:this.onImageLoad}),
                React.DOM.div( {className:"form-group h-spaced"}, 
                React.DOM.h4(null, "Width"),
                    React.DOM.div( {className:"input-group", style:inputStyle}, 
                        DelayedInput( {type:"text", className:"form-control input-sm",  value:this.state.width, onChange:this.onWidthChange} ),
                        React.DOM.span( {className:"input-group-addon"}, "x"),
                        DelayedInput( {type:"text", className:"form-control input-sm", value:this.state.height, onChange:this.onHeightChange} ),
                        React.DOM.span( {className:"input-group-addon"}, "output"),
                        DelayedInput( {type:"text", className:"form-control input-sm",  value:this.state.output, onChange:this.onOutHeightChange} )
                    )
                ),

            React.DOM.div(null, 
                Extractor( {width:this.state.width, height:this.state.height, imageURL:this.state.imageURL, resultChanged:this.resultChanged, onImageWidth:this.imageWidthChanged})
            ),
            ResultRenderer( {result:this.state.result, height:this.state.output, hack:"_hack_strip"}),

            React.DOM.div(null, 
                IconButton( {icon:"picture", title:"Save", className:"download-button", onClick:this.saveImage}),
                React.DOM.br(null),
                IconButton( {icon:"list", title:"Color data", className:"download-button", onClick:this.showData})
            ),
            TextResultDisplay( {result:this.state.result} )
        )
    }
});

module.exports = Stripifier;



},{"../bootstrap/icon":3,"../bootstrap/icon-button":2,"../delayed-input":6,"./../result-renderer.js":15,"./pixel-extractor.js":19}],21:[function(require,module,exports){
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

},{"./storage":17}],22:[function(require,module,exports){
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

},{"./bootstrap/icon":3,"./storage":17}]},{},[7])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxQcm9qZWN0c1xcaG9iYnlcXGhhbm5haFxcYXNkZlxccmFuZG9tLXdlYXZlLXN0cmlwZXNcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJjOi9Qcm9qZWN0cy9ob2JieS9oYW5uYWgvYXNkZi9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvYXBwbGljYXRpb24uanMiLCJjOi9Qcm9qZWN0cy9ob2JieS9oYW5uYWgvYXNkZi9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvYm9vdHN0cmFwL2ljb24tYnV0dG9uLmpzIiwiYzovUHJvamVjdHMvaG9iYnkvaGFubmFoL2FzZGYvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL2Jvb3RzdHJhcC9pY29uLmpzIiwiYzovUHJvamVjdHMvaG9iYnkvaGFubmFoL2FzZGYvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL2RhdGEvbGF5ZXIuanMiLCJjOi9Qcm9qZWN0cy9ob2JieS9oYW5uYWgvYXNkZi9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvZGF0YS9wb2ludC5qcyIsImM6L1Byb2plY3RzL2hvYmJ5L2hhbm5haC9hc2RmL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9kZWxheWVkLWlucHV0LmpzIiwiYzovUHJvamVjdHMvaG9iYnkvaGFubmFoL2FzZGYvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL2luZGV4LmpzIiwiYzovUHJvamVjdHMvaG9iYnkvaGFubmFoL2FzZGYvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL2tpbmQtaW5wdXQuanMiLCJjOi9Qcm9qZWN0cy9ob2JieS9oYW5uYWgvYXNkZi9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvbGF5ZXItbGluZXMtZWRpdG9yLmpzIiwiYzovUHJvamVjdHMvaG9iYnkvaGFubmFoL2FzZGYvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL2xheWVyLWxpc3QuanMiLCJjOi9Qcm9qZWN0cy9ob2JieS9oYW5uYWgvYXNkZi9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvbWF0aC11dGlscy5qcyIsImM6L1Byb2plY3RzL2hvYmJ5L2hhbm5haC9hc2RmL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9uYW1lLWdlbi5qcyIsImM6L1Byb2plY3RzL2hvYmJ5L2hhbm5haC9hc2RmL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9wcm9qZWN0LXBpY2tlci5qcyIsImM6L1Byb2plY3RzL2hvYmJ5L2hhbm5haC9hc2RmL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9yZW5kZXJlci5qcyIsImM6L1Byb2plY3RzL2hvYmJ5L2hhbm5haC9hc2RmL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9yZXN1bHQtcmVuZGVyZXIuanMiLCJjOi9Qcm9qZWN0cy9ob2JieS9oYW5uYWgvYXNkZi9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvcm5kLmpzIiwiYzovUHJvamVjdHMvaG9iYnkvaGFubmFoL2FzZGYvcmFuZG9tLXdlYXZlLXN0cmlwZXMvc3JjL2pzL3N0b3JhZ2UuanMiLCJjOi9Qcm9qZWN0cy9ob2JieS9oYW5uYWgvYXNkZi9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvc3RyaXBlcy5qcyIsImM6L1Byb2plY3RzL2hvYmJ5L2hhbm5haC9hc2RmL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9zdHJpcGlmaWVyL3BpeGVsLWV4dHJhY3Rvci5qcyIsImM6L1Byb2plY3RzL2hvYmJ5L2hhbm5haC9hc2RmL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy9zdHJpcGlmaWVyL3N0cmlwaWZpZXIuanMiLCJjOi9Qcm9qZWN0cy9ob2JieS9oYW5uYWgvYXNkZi9yYW5kb20td2VhdmUtc3RyaXBlcy9zcmMvanMvd2lmLWVkaXRvci5qcyIsImM6L1Byb2plY3RzL2hvYmJ5L2hhbm5haC9hc2RmL3JhbmRvbS13ZWF2ZS1zdHJpcGVzL3NyYy9qcy93aWYtbGlzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2bkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJuZCA9IHJlcXVpcmUoJy4vcm5kJyk7XG5cbnZhciBMYXllciA9IHJlcXVpcmUoJy4vZGF0YS9sYXllcicpO1xudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9kYXRhL3BvaW50Jyk7XG5cbnZhciBJY29uID0gcmVxdWlyZSgnLi9ib290c3RyYXAvaWNvbicpO1xuXG52YXIgUmVuZGVyZXIgPSByZXF1aXJlKCcuL3JlbmRlcmVyJyk7XG52YXIgTGF5ZXJMaW5lc0VkaXRvciA9IHJlcXVpcmUoJy4vbGF5ZXItbGluZXMtZWRpdG9yJyk7XG52YXIgTGF5ZXJMaXN0ID0gcmVxdWlyZSgnLi9sYXllci1saXN0Jyk7XG52YXIgSWNvbkJ1dHRvbiA9IHJlcXVpcmUoJy4vYm9vdHN0cmFwL2ljb24tYnV0dG9uJyk7XG52YXIgS2luZElucHV0ID0gcmVxdWlyZSgnLi9raW5kLWlucHV0Jyk7XG5cbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XG5cbnZhciBzdHJpcGVzID0gcmVxdWlyZSgnLi9zdHJpcGVzJyk7XG5cblxuXG52YXIgY2hhbmdlZCA9IGZ1bmN0aW9uICh0YXJnZXQsIGNoYW5nZXMpIHtcbiAgICByZXR1cm4gXy5leHRlbmQoXy5jbG9uZSh0YXJnZXQpLCBjaGFuZ2VzKTtcbn07XG5cblxuXG5cbnZhciBQcm9qZWN0RG93bmxvYWRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUHJvamVjdERvd25sb2FkcycsXG4gICAgZ2V0RmlsZU5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5hbWUgPSB0aGlzLnByb3BzLmFwcFN0YXRlLm5hbWUgfHwgXCJub25hbWVcIjtcbiAgICAgICAgdmFyIGZpbGVuYW1lID0gbmFtZS5yZXBsYWNlKC9bXmEtejAtOV0vZ2ksICdfJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIGZpbGVuYW1lO1xuICAgIH0sXG5cbiAgICBzYXZlSW1hZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgcG9tLnNldEF0dHJpYnV0ZSgnaHJlZicsIHdpbmRvdy5faGFjay5jYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKSk7XG4gICAgICAgIHBvbS5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgdGhpcy5nZXRGaWxlTmFtZSgpICtcIl9pbWFnZS5wbmdcIik7XG4gICAgICAgIHBvbS5jbGljaygpO1xuXG4gICAgfSxcbiAgICBzYXZlUHJvamVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBwb20uc2V0QXR0cmlidXRlKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkodGhpcy5wcm9wcy5hcHBTdGF0ZSkpKTtcbiAgICAgICAgcG9tLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCB0aGlzLmdldEZpbGVOYW1lKCkgK1wiX3Byb2plY3QuanNvblwiKTtcbiAgICAgICAgcG9tLmNsaWNrKCk7XG5cbiAgICB9LFxuICAgIHNhdmVNb2RpZmllZFdpZjogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIGZ1bmN0aW9uIGhleFRvUmdiKGhleCkge1xuICAgICAgICAgICAgLy8gRXhwYW5kIHNob3J0aGFuZCBmb3JtIChlLmcuIFwiMDNGXCIpIHRvIGZ1bGwgZm9ybSAoZS5nLiBcIjAwMzNGRlwiKVxuICAgICAgICAgICAgdmFyIHNob3J0aGFuZFJlZ2V4ID0gL14jPyhbYS1mXFxkXSkoW2EtZlxcZF0pKFthLWZcXGRdKSQvaTtcbiAgICAgICAgICAgIGhleCA9IGhleC5yZXBsYWNlKHNob3J0aGFuZFJlZ2V4LCBmdW5jdGlvbiAobSwgciwgZywgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiByICsgciArIGcgKyBnICsgYiArIGI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IC9eIz8oW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkkL2kuZXhlYyhoZXgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdCA/IHtcbiAgICAgICAgICAgICAgICByOiBwYXJzZUludChyZXN1bHRbMV0sIDE2KSxcbiAgICAgICAgICAgICAgICBnOiBwYXJzZUludChyZXN1bHRbMl0sIDE2KSxcbiAgICAgICAgICAgICAgICBiOiBwYXJzZUludChyZXN1bHRbM10sIDE2KVxuICAgICAgICAgICAgfSA6IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICB2YXIgbG9hZFdpZiA9IHN0b3JhZ2UubG9hZFdpZihpZCk7XG5cbiAgICAgICAgdmFyIHJlc3VsdCA9IHN0cmlwZXModGhpcy5wcm9wcy5hcHBTdGF0ZS5sYXllckRhdGEubGF5ZXJzLCB0aGlzLnByb3BzLmFwcFN0YXRlLnNpemUueCwgdGhpcy5wcm9wcy5hcHBTdGF0ZS5iYWNrZ3JvdW5kQ29sb3IpO1xuXG4gICAgICAgIHZhciBubCA9IFwiXFxyXFxuXCI7XG4gICAgICAgIHZhciBjb2xvcnNBcnJheSA9IFtdO1xuICAgICAgICB2YXIgZGF0YSA9IFwiXCI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY29sb3IgPSByZXN1bHRbaV07XG4gICAgICAgICAgICB2YXIgbnIgPSBjb2xvcnNBcnJheS5pbmRleE9mKGNvbG9yKTtcbiAgICAgICAgICAgIGlmIChuciA8IDApIHtcbiAgICAgICAgICAgICAgICBjb2xvcnNBcnJheS5wdXNoKGNvbG9yKTtcbiAgICAgICAgICAgICAgICBuciA9IGNvbG9yc0FycmF5Lmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkYXRhICs9IChpICsgMSkgKyBcIj1cIiArIChuciArIDEpICsgbmw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGF0YTIgPSBcIltDT0xPUiBUQUJMRV1cIiArIG5sO1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY29sb3JzQXJyYXkubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBjID0gY29sb3JzQXJyYXlbal07XG4gICAgICAgICAgICB2YXIgcmdiID0gaGV4VG9SZ2IoYyk7XG4gICAgICAgICAgICBkYXRhMiArPSAoaiArIDEpICsgXCI9XCIgKyByZ2IuciArIFwiLFwiICsgcmdiLmcgKyBcIixcIiArIHJnYi5iICsgbmw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2VjdGlvblNwbGl0ID0gbG9hZFdpZi5kYXRhLnNwbGl0KFwiW1wiKTtcbiAgICAgICAgdmFyIHJlcztcblxuICAgICAgICBzZWN0aW9uU3BsaXQuZm9yRWFjaChmdW5jdGlvbiAoc2VjKSB7XG4gICAgICAgICAgICBpZihzZWMuaW5kZXhPZignQ09MT1IgUEFMRVRURV0nKSA9PSAwKXtcbiAgICAgICAgICAgICAgICByZXMgKz0gJ1tDT0xPUiBQQUxFVFRFXScgKyBubDtcbiAgICAgICAgICAgICAgICByZXMgKz0gJ0VudHJpZXM9JyArIGNvbG9yc0FycmF5Lmxlbmd0aCArIG5sO1xuICAgICAgICAgICAgICAgIHJlcyArPSAnRm9ybT1SR0InICsgbmw7XG4gICAgICAgICAgICAgICAgcmVzICs9ICdSYW5nZT0wLDI1NScgKyBubDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoc2VjLmluZGV4T2YoJ0NPTE9SIFRBQkxFXScpPT0gMCl7XG4gICAgICAgICAgICAgICAgcmVzICs9IGRhdGEyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihzZWMuaW5kZXhPZignV0FSUCBDT0xPUlNdJyk9PSAwKXtcbiAgICAgICAgICAgICAgICByZXMgKz0gJ1tXQVJQIENPTE9SU10nICsgbmw7XG4gICAgICAgICAgICAgICAgcmVzKz0gZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoc2VjLmluZGV4T2YoJ1dBUlBdJyk9PSAwKXtcblxuICAgICAgICAgICAgICAgIHJlcyArPSAoJ1snICsgc2VjKS5yZXBsYWNlKC9UaHJlYWRzPVxcZCovLCdUaHJlYWRzPScgKyByZXN1bHQubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcyArPSAnWycgKyBzZWM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgcG9tLnNldEF0dHJpYnV0ZSgnaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlcykpO1xuICAgICAgICBwb20uc2V0QXR0cmlidXRlKCdkb3dubG9hZCcsIHRoaXMuZ2V0RmlsZU5hbWUoKSsgXCJfbW9kaWZpZWRfd2lmX1wiK2xvYWRXaWYubmFtZStcIi53aWZcIik7XG4gICAgICAgIHBvbS5jbGljaygpO1xuXG4gICAgfSxcbiAgICBjaGFuZ2VXaWY6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkV2lmOiBlLnRhcmdldC52YWx1ZX0pXG4gICAgfSxcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB3aWZzID0gdGhpcy5wcm9wcy5hcHBTdGF0ZS53aWZzIHx8IFtdO1xuICAgICAgICB2YXIgZmlyc3QgPSBudWxsO1xuICAgICAgICB2YXIgd2lmT3B0cyA9IHdpZnMubWFwKGZ1bmN0aW9uICh3aWYpIHtcbiAgICAgICAgICAgIGZpcnN0ID0gZmlyc3QgfHwgd2lmLmlkO1xuICAgICAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5vcHRpb24oIHt2YWx1ZTp3aWYuaWR9LCB3aWYubmFtZSlcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBzZWxlY3RlZCA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRXaWYgfHwgZmlyc3Q7XG5cbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIFwiRG93bmxvYWRzXCIpXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXG4gICAgICAgICAgICAgICAgSWNvbkJ1dHRvbigge2ljb246XCJmbG9wcHktc2F2ZVwiLCB0aXRsZTpcIlByb2plY3RcIiwgY2xhc3NOYW1lOlwiZG93bmxvYWQtYnV0dG9uXCIsIG9uQ2xpY2s6dGhpcy5zYXZlUHJvamVjdH0pLFxuICAgICAgICAgICAgICAgIEljb25CdXR0b24oIHtpY29uOlwicGljdHVyZVwiLCB0aXRsZTpcIkltYWdlXCIsIGNsYXNzTmFtZTpcImRvd25sb2FkLWJ1dHRvblwiLCBvbkNsaWNrOnRoaXMuc2F2ZUltYWdlfSksXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIFwiU2VsZWN0IHdpZlwiKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc2VsZWN0KCB7dmFsdWU6c2VsZWN0ZWQsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBoLXNwYWNlZFwiLCBvbkNoYW5nZTp0aGlzLmNoYW5nZVdpZn0sIFxuICAgICAgICAgICAgICAgICAgICB3aWZPcHRzXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBJY29uQnV0dG9uKCB7aWNvbjpcInJhbmRvbVwiLCB0aXRsZTpcIk1vZGlmeSBhbmQgRG93bmxvYWRcIiwgY2xhc3NOYW1lOlwiZG93bmxvYWQtYnV0dG9uXCIsIG9uQ2xpY2s6dGhpcy5zYXZlTW9kaWZpZWRXaWYuYmluZCh0aGlzLCBzZWxlY3RlZCl9IClcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICB9XG59KTtcblxuXG52YXIgUHJvamVjdFNpemVzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUHJvamVjdFNpemVzJyxcbiAgICBvbldpZHRoQ2hhbmdlOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgZml4ZWQgPSBNYXRoLm1heCgxMCwgcGFyc2VJbnQodmFsKSB8fCAxMDApO1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vblNpemVDaGFuZ2VkKHt4OiBmaXhlZH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25IZWlnaHRDaGFuZ2U6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBmaXhlZCA9IE1hdGgubWF4KDEwLCBwYXJzZUludCh2YWwpIHx8IDEwMCk7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uU2l6ZUNoYW5nZWQoe3k6IGZpeGVkfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpZCA9IFwiXCIgKyBNYXRoLnJhbmRvbSgpO1xuICAgICAgICByZXR1cm4gIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwIGgtc3BhY2VkXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIFwiU2l6ZXNcIiksXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cFwifSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBLaW5kSW5wdXQoIHtpZDppZCwgdHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsICB2YWx1ZTp0aGlzLnByb3BzLnNpemUueCwgb25DaGFuZ2U6dGhpcy5vbldpZHRoQ2hhbmdlfSApLFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1hZGRvblwifSwgXCJ4XCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgS2luZElucHV0KCB7dHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsIHZhbHVlOnRoaXMucHJvcHMuc2l6ZS55LCBvbkNoYW5nZTp0aGlzLm9uSGVpZ2h0Q2hhbmdlfSApLFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1hZGRvblwifSwgXCJlZGl0XCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgS2luZElucHV0KCB7dHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsICB2YWx1ZTp0aGlzLnByb3BzLmVkaXRvclNpemUsIG9uQ2hhbmdlOnRoaXMucHJvcHMub25FZGl0b3JTaXplQ2hhbmdlfSApXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICk7XG5cbiAgICB9XG59KTtcblxuXG52YXIgSW5zcGVjdG9yQm94ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSW5zcGVjdG9yQm94JyxcbiAgICBvblJhbmRvbUNvbG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMub25OZXdDb2xvcihSbmQuY29sb3IoKSk7XG4gICAgfSxcblxuICAgIG9uQ29sb3JDaGFuZ2U6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoaXMub25OZXdDb2xvcihlLnRhcmdldC52YWx1ZSk7XG4gICAgfSxcblxuICAgIG9uTmV3Q29sb3I6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHRoaXMucHJvcHMub25CYWNrZ3JvdW5kQ29sb3JDaGFuZ2Uodik7XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge3RhYjogc3RvcmFnZS5nZXRPcGVuVGFiKCl9O1xuICAgIH0sXG5cbiAgICBjaGFuZ2VUYWI6IGZ1bmN0aW9uICh0YWIpIHtcbiAgICAgICAgc3RvcmFnZS5zZXRPcGVuVGFiKHRhYik7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3RhYjogdGFifSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXBwU3RhdGUgPSB0aGlzLnByb3BzLmFwcFN0YXRlO1xuICAgICAgICB2YXIgdGFiID0gdGhpcy5zdGF0ZS50YWJ8fCdwcm9qZWN0JztcbiAgICAgICAgdmFyIHRhYkRhdGE7XG4gICAgICAgIGlmKHRhYiA9PSAnY29sb3JzJyl7XG4gICAgICAgICAgICB0YWJEYXRhID0gUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uZm9ybSgge3JvbGU6XCJmb3JtXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXBcIn0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmg0KCB7Zm9yOlwibGF5ZXJDb2xvclwifSwgXCJCYWNrZ3JvdW5kIGNvbG9yXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtpZDpcImxheWVyQ29sb3JcIiwgdHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsIHZhbHVlOnRoaXMucHJvcHMuYXBwU3RhdGUuYmFja2dyb3VuZENvbG9yLCBvbkNoYW5nZTp0aGlzLm9uQ29sb3JDaGFuZ2V9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwLWJ0blwifSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHQgaW5wdXQtc21cIiwgdHlwZTpcImJ1dHRvblwiLCBvbkNsaWNrOnRoaXMub25SYW5kb21Db2xvcn0sIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbiBnbHlwaGljb24tZmlyZVwifSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIExheWVyTGlzdCgge2xheWVyRGF0YTphcHBTdGF0ZS5sYXllckRhdGEsIHNpemU6YXBwU3RhdGUuc2l6ZSwgb25DaGFuZ2U6dGhpcy5wcm9wcy5vbkxheWVyRGF0YUNoYW5nZX0pXG4gICAgICAgICAgICApXG5cbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgdGFiRGF0YSA9IFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgICAgICAgICAgUHJvamVjdFNpemVzKCB7c2l6ZTphcHBTdGF0ZS5zaXplLFxuICAgICAgICAgICAgICAgIGVkaXRvclNpemU6YXBwU3RhdGUuZWRpdG9yU2l6ZSxcbiAgICAgICAgICAgICAgICBvblNpemVDaGFuZ2VkOnRoaXMucHJvcHMub25TaXplQ2hhbmdlZCxcbiAgICAgICAgICAgICAgICBvbkVkaXRvclNpemVDaGFuZ2U6dGhpcy5wcm9wcy5vbkVkaXRvclNpemVDaGFuZ2V9KSxcbiAgICAgICAgICAgICAgICBQcm9qZWN0RG93bmxvYWRzKCB7YXBwU3RhdGU6YXBwU3RhdGV9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJpbnNwZWN0b3JCb3ggY29udGFpbmVyLWZsdWlkXCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibmF2IG5hdi10YWJzXCJ9LCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6dGFiPT0ncHJvamVjdCcgJiYgJ2FjdGl2ZSd9LCBSZWFjdC5ET00uYSgge29uQ2xpY2s6dGhpcy5jaGFuZ2VUYWIuYmluZCh0aGlzLCAncHJvamVjdCcpfSwgXCJQcm9qZWN0XCIpKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6dGFiPT0nY29sb3JzJyAmJiAnYWN0aXZlJ30sIFJlYWN0LkRPTS5hKCB7b25DbGljazp0aGlzLmNoYW5nZVRhYi5iaW5kKHRoaXMsICdjb2xvcnMnKX0sIFwiQ29sb3JzXCIpKVxuXG4gICAgICAgICAgICApXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgdGFiRGF0YVxuICAgICAgICApXG4gICAgfVxufSk7XG5cblxudmFyIEFwcGxpY2F0aW9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQXBwbGljYXRpb24nLFxuICAgIG1peGluczogW1JlYWN0LmFkZG9ucy5MaW5rZWRTdGF0ZU1peGluXSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc3RvcmFnZS5sb2FkKHRoaXMucHJvcHMuaWQpO1xuICAgIH0sXG5cbiAgICBvbkxheWVyRGF0YUNoYW5nZTogZnVuY3Rpb24gKG5ld0xheWVyRGF0YSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtsYXllckRhdGE6IG5ld0xheWVyRGF0YX0pO1xuICAgIH0sXG5cblxuICAgIGNoYW5nZVNpemU6IGZ1bmN0aW9uIChuZXdTaXplKSB7XG4gICAgICAgIHZhciBmaXhlZFNpemUgPSBjaGFuZ2VkKHRoaXMuc3RhdGUuc2l6ZSwgbmV3U2l6ZSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3NpemU6IGZpeGVkU2l6ZX0pO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvcHkgPSBfLmNsb25lKHRoaXMuc3RhdGUpO1xuICAgICAgICBkZWxldGUgY29weS53aWZzO1xuICAgICAgICBzdG9yYWdlLnNhdmUodGhpcy5wcm9wcy5pZCwgdGhpcy5zdGF0ZSk7XG4gICAgICAgIGlmKHRoaXMuc3RhdGUuZWRpdE5hbWUpe1xuICAgICAgICAgICAgdmFyIG5hbWVFZGl0b3IgPSB0aGlzLnJlZnMubmFtZUVkaXRvcjtcbiAgICAgICAgICAgIGlmIChuYW1lRWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRvbU5vZGUgPSBuYW1lRWRpdG9yLmdldERPTU5vZGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9tTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBkb21Ob2RlLmZvY3VzKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25CYWNrZ3JvdW5kQ29sb3JDaGFuZ2U6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7YmFja2dyb3VuZENvbG9yOiB2YWx9KTtcbiAgICB9LFxuXG4gICAgb25FZGl0b3JTaXplQ2hhbmdlOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIHZhciBmaXhlZCA9IE1hdGgubWF4KDEwLCBwYXJzZUludCh2YWwpIHx8IDEwMCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2VkaXRvclNpemU6IGZpeGVkfSk7XG4gICAgfSxcblxuICAgIHNob3dOYW1lRWRpdG9yOiBmdW5jdGlvbiAoc2hvdykge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtlZGl0TmFtZTogc2hvdyB9KTtcbiAgICB9LFxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3dpZnM6IHN0b3JhZ2UubGlzdFdpZnMoKX0pO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVkaXRvclNpemUgPSB7eDogdGhpcy5zdGF0ZS5zaXplLngsIHk6IHRoaXMuc3RhdGUuZWRpdG9yU2l6ZSB8fCAxMDB9O1xuICAgICAgICB2YXIgbmFtZUNvbXBvbmVudCA9IFJlYWN0LkRPTS5zcGFuKCB7b25DbGljazp0aGlzLnNob3dOYW1lRWRpdG9yLmJpbmQodGhpcywgdHJ1ZSl9LCB0aGlzLnN0YXRlLm5hbWUpXG4gICAgICAgIGlmKHRoaXMuc3RhdGUuZWRpdE5hbWUpe1xuICAgICAgICAgICAgbmFtZUNvbXBvbmVudCA9IFJlYWN0LkRPTS5pbnB1dCgge2NsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1zbVwiLCB2YWx1ZUxpbms6dGhpcy5saW5rU3RhdGUoJ25hbWUnKSwgcmVmOlwibmFtZUVkaXRvclwiLCBvbkJsdXI6dGhpcy5zaG93TmFtZUVkaXRvci5iaW5kKHRoaXMsIGZhbHNlKX0gKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb250YWluZXItZmx1aWRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmgxKCB7Y2xhc3NOYW1lOlwicGFnZS1oZWFkZXIgcGFnZS1oZWFkZXItbWFpblwifSwgbmFtZUNvbXBvbmVudCksXG5cbiAgICAgICAgICAgIEluc3BlY3RvckJveCgge2FwcFN0YXRlOnRoaXMuc3RhdGUsXG4gICAgICAgICAgICBvbkxheWVyRGF0YUNoYW5nZTp0aGlzLm9uTGF5ZXJEYXRhQ2hhbmdlLFxuICAgICAgICAgICAgb25TaXplQ2hhbmdlZDp0aGlzLmNoYW5nZVNpemUsXG4gICAgICAgICAgICBvbkVkaXRvclNpemVDaGFuZ2U6dGhpcy5vbkVkaXRvclNpemVDaGFuZ2UsXG4gICAgICAgICAgICBvbkJhY2tncm91bmRDb2xvckNoYW5nZTp0aGlzLm9uQmFja2dyb3VuZENvbG9yQ2hhbmdlfVxuICAgICAgICAgICAgKSxcblxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInN0cmlwZXNBcmVhQm94XCJ9LCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxuICAgICAgICAgICAgICAgICAgICBSZW5kZXJlcigge2xheWVyczp0aGlzLnN0YXRlLmxheWVyRGF0YS5sYXllcnMsIHNpemU6dGhpcy5zdGF0ZS5zaXplLCBiYWNrZ3JvdW5kQ29sb3I6dGhpcy5zdGF0ZS5iYWNrZ3JvdW5kQ29sb3J9KVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgTGF5ZXJMaW5lc0VkaXRvcigge2NhblNlbGVjdDp0aGlzLnN0YXRlLnNlbGVjdEluTGF5ZXJFZGl0b3IsIGxheWVyRGF0YTp0aGlzLnN0YXRlLmxheWVyRGF0YSwgb25DaGFuZ2U6dGhpcy5vbkxheWVyRGF0YUNoYW5nZSwgc2l6ZTplZGl0b3JTaXplfSApLFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5icihudWxsKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwiY2hlY2tib3hcIiwgY2hlY2tlZExpbms6dGhpcy5saW5rU3RhdGUoJ3NlbGVjdEluTGF5ZXJFZGl0b3InKX0pLFxuICAgICAgICAgICAgICAgIFwiIEFsbG93IFNlbGVjdCBcIixcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnIobnVsbCksUmVhY3QuRE9NLmJyKG51bGwpLFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ3ZWxsXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgXCIgU2hpZnQrQ2xpY2sgdG8gYWRkIHBvaW50cyBcIixcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmJyKG51bGwpLFxuICAgICAgICAgICAgICAgICAgICBcIiBDdHJsK0NsaWNrIHRvIHJlbW92ZSBwb2ludHMgXCJcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNsZWFyLWZpeCBhbGVydCBhbGVydC13YXJuaW5nXCJ9LCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiV2FybmluZyFcIiksIFwiIFRoaXMgaXMgYSB3b3JrIGluIHByb2dyZXNzIHRoaW5nLiBEb24ndCBleHBlY3QgYW55dGhpbmcgdG8gd29yayBhbmQgeW91ciBkYXRhIG1pZ2h0IGRpc2FwZWFyIGF0IGFueSBtb21lbnQhXCIpXG4gICAgICAgIClcbiAgICB9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcGxpY2F0aW9uO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBJY29uID0gcmVxdWlyZSgnLi9pY29uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhSZWFjdC5ET00uYnV0dG9uKCB7dHlwZTpcImJ1dHRvblwiLCBjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIn0sIEljb24oIHtpY29uOnRoaXMucHJvcHMuaWNvbn0pLCB0aGlzLnByb3BzLnRpdGxlP1wiIFwiICsgdGhpcy5wcm9wcy50aXRsZTonJykpO1xuICAgIH1cbn0pO1xuXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIEljb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdJY29uJyxcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGljb24gPSBcImdseXBoaWNvbiBnbHlwaGljb24tXCIgKyB0aGlzLnByb3BzLmljb247XG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTppY29ufSk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSWNvbjsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb2xvciwgcG9pbnRzKSB7XG4gICAgdGhpcy5pZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwMDApO1xuICAgIHRoaXMuc2VlZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDApKzEwO1xuICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICB0aGlzLnBvaW50cyA9IHBvaW50cztcbiAgICBwb2ludHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gYS54IC0gYi54O1xuICAgIH0pO1xufTsiLCJtb2R1bGUuZXhwb3J0cyAgPSAgZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB0aGlzLmlkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwMDAwMCk7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xufTtcblxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cblxudmFyIEluID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSW4nLFxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICBhY3RpdmU6IGZhbHNlXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgdiA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHt2YWx1ZTogdiwgYWN0aXZlOiB0cnVlfSk7XG4gICAgfSxcblxuICAgIG9uQmx1cjogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlICYmIHRoaXMucHJvcHMub25DaGFuZ2UodGhpcy5zdGF0ZS52YWx1ZSk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2FjdGl2ZTogZmFsc2V9KTtcbiAgICB9LFxuICAgIG9uRm9jdXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dmFsdWU6IHRoaXMucHJvcHMudmFsdWUsIGFjdGl2ZTogdHJ1ZX0pO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0eWxlID0ge307XG5cbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5wcm9wcy52YWx1ZTtcbiAgICAgICAgaWYodGhpcy5zdGF0ZS5hY3RpdmUpe1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLnN0YXRlLnZhbHVlO1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMudmFsdWUgIT0gdGhpcy5zdGF0ZS52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHN0eWxlLmNvbG9yID0gJ29yYW5nZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhSZWFjdC5ET00uaW5wdXQoIHt2YWx1ZTp2YWx1ZSwgb25DaGFuZ2U6dGhpcy5vbkNoYW5nZSwgc3R5bGU6c3R5bGUsIG9uQmx1cjp0aGlzLm9uQmx1ciwgb25Gb2N1czp0aGlzLm9uRm9jdXN9KSk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW47IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBQcm9qZWN0UGlja2VyID0gcmVxdWlyZSgnLi9wcm9qZWN0LXBpY2tlcicpO1xuXG5SZWFjdC5yZW5kZXJDb21wb25lbnQoXG4gICAgUHJvamVjdFBpY2tlcihudWxsICksXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcGxpY2F0aW9uJylcbik7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxuXG52YXIgS2luZElucHV0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnS2luZElucHV0JyxcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLnByb3BzLnZhbHVlXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG9uQ2hhbmdlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgdiA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHt2YWx1ZTogdn0pO1xuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlICYmIHRoaXMucHJvcHMub25DaGFuZ2Uodik7XG4gICAgfSxcblxuICAgIG9uQmx1cjogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHt2YWx1ZTogdGhpcy5wcm9wcy52YWx1ZX0pO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0eWxlID0ge307XG5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMudmFsdWUgIT0gdGhpcy5zdGF0ZS52YWx1ZSkge1xuICAgICAgICAgICAgc3R5bGUuY29sb3IgPSAnb3JhbmdlJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhSZWFjdC5ET00uaW5wdXQoIHt2YWx1ZTp0aGlzLnN0YXRlLnZhbHVlLCBvbkNoYW5nZTp0aGlzLm9uQ2hhbmdlLCBzdHlsZTpzdHlsZSwgb25CbHVyOnRoaXMub25CbHVyfSkpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEtpbmRJbnB1dDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIE1hdGhVdGlscyA9IHJlcXVpcmUoJy4vbWF0aC11dGlscycpO1xudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9kYXRhL3BvaW50Jyk7XG5cblxudmFyIEljb25CdXR0b24gPSByZXF1aXJlKCcuL2Jvb3RzdHJhcC9pY29uLWJ1dHRvbicpO1xuXG4vLyB0b2RvOiByZXVzZT9cbnZhciBjaGFuZ2VkPSBmdW5jdGlvbiAodGFyZ2V0LCBjaGFuZ2VzKSB7XG4gICAgcmV0dXJuIF8uZXh0ZW5kKF8uY2xvbmUodGFyZ2V0KSwgY2hhbmdlcyk7XG59O1xuXG52YXIgTW92YWJsZUNpcmNsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01vdmFibGVDaXJjbGUnLFxuICAgIG9uTW91c2VEb3duOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgbzoge1xuICAgICAgICAgICAgICAgIG94OiB0aGlzLnByb3BzLmN4LFxuICAgICAgICAgICAgICAgIG95OiB0aGlzLnByb3BzLmN5LFxuICAgICAgICAgICAgICAgIHg6IGUuY2xpZW50WCxcbiAgICAgICAgICAgICAgICB5OiBlLmNsaWVudFlcbiAgICAgICAgICAgIH19KTtcbiAgICAgICAgdGhpcy5wcm9wcy5vbk1vdXNlRG93bihlKTtcblxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VNb3ZlKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIHRoaXMub25Nb3VzZVVwKTtcblxuICAgIH0sXG4gICAgb25Nb3VzZVVwOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtvOiBudWxsfSlcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5vbk1vdXNlTW92ZSk7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLm9uTW91c2VVcCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMub25Nb3VzZU1vdmUpO1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgdGhpcy5vbk1vdXNlVXApO1xuICAgIH0sXG5cblxuICAgIG9uTW91c2VNb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgbyA9IHRoaXMuc3RhdGUubztcblxuICAgICAgICBpZiAobykge1xuICAgICAgICAgICAgdmFyIG5ld08gPSBPYmplY3QuY3JlYXRlKG8pO1xuICAgICAgICAgICAgbmV3Ty54ID0gZS5jbGllbnRYO1xuICAgICAgICAgICAgbmV3Ty55ID0gZS5jbGllbnRZO1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbk1vdmUoKG8ub3ggKyBlLmNsaWVudFggLSB0aGlzLnN0YXRlLm8ueCApLCAoby5veSArZS5jbGllbnRZIC0gdGhpcy5zdGF0ZS5vLnkgKSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKG5ld08pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oUmVhY3QuRE9NLmNpcmNsZSgge29uTW91c2VEb3duOnRoaXMub25Nb3VzZURvd259KSk7XG4gICAgfVxufSk7XG5cblxuXG52YXIgU2luZ2xlTGluZUVkaXRvciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1NpbmdsZUxpbmVFZGl0b3InLFxuICAgIG9uTW92ZUNpcmNsZU1vdmU6IGZ1bmN0aW9uIChpbmRleCwgeCwgeSkge1xuICAgICAgICB2YXIgbmV3UG9pbnRzID0gdGhpcy5wcm9wcy5wb2ludHMuc2xpY2UoKTtcbiAgICAgICAgdmFyIGxlZnRQb2ludCA9IG5ld1BvaW50c1tpbmRleCAtIDFdIHx8IHt4OiAwfTtcbiAgICAgICAgdmFyIHJpZ2h0UG9pbnQgPSBuZXdQb2ludHNbaW5kZXggKyAxXSB8fCB7eDogdGhpcy5wcm9wcy5zaXplLnh9O1xuXG4gICAgICAgIG5ld1BvaW50c1tpbmRleF0gPSBuZXdQb2ludCA9IF8uY2xvbmUobmV3UG9pbnRzW2luZGV4XSk7XG5cbiAgICAgICAgbmV3UG9pbnQueCA9IE1hdGhVdGlscy5jb25zdHJhaW4oeCwgbGVmdFBvaW50LngsIHJpZ2h0UG9pbnQueCk7XG4gICAgICAgIG5ld1BvaW50LnkgPSBNYXRoVXRpbHMuY29uc3RyYWluKHksICAwLCB0aGlzLnByb3BzLnNpemUueSk7XG5cbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShuZXdQb2ludHMpO1xuICAgIH0sXG5cbiAgICBvblRvdWNoOiBmdW5jdGlvbiAoY2lyY2xlSSwgZSkge1xuICAgICAgICB0aGlzLnByb3BzLm9uUG9pbnRUb3VjaChjaXJjbGVJLCBlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdmFyIGxpbmVTdHlsZSA9IHtcbiAgICAgICAgICAgIHN0cm9rZTogdGhpcy5wcm9wcy5jb2xvcixcbiAgICAgICAgICAgICdzdHJva2Utd2lkdGgnOiAyXG4gICAgICAgIH07XG4gICAgICAgIHZhciBjaXJjbGVTdHlsZSA9IHtcbiAgICAgICAgICAgIGZpbGw6IHRoaXMucHJvcHMubWFya0NvbG9yLFxuICAgICAgICAgICAgY3Vyc29yOiAnbW92ZSdcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbGluZXMgPSBbXTtcbiAgICAgICAgdmFyIGNpcmNsZXMgPSBbXTtcblxuICAgICAgICB2YXIgY2lyY2xlID0gZnVuY3Rpb24gKHAsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiBNb3ZhYmxlQ2lyY2xlKCB7a2V5OnAuaWQsIGN4OnAueCwgY3k6cC55LCByOnRoaXMucHJvcHMubWFya1NpemUsIG9uTW91c2VEb3duOnRoaXMub25Ub3VjaC5iaW5kKHRoaXMsIGkpLCBvbk1vdmU6dGhpcy5vbk1vdmVDaXJjbGVNb3ZlLmJpbmQodGhpcywgaSksIHN0eWxlOmNpcmNsZVN0eWxlfSlcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5wcm9wcy5wb2ludHMubGVuZ3RoOyBpKyspIHtcblxuICAgICAgICAgICAgdmFyIHAxID0gdGhpcy5wcm9wcy5wb2ludHNbaSAtIDFdO1xuICAgICAgICAgICAgdmFyIHAyID0gdGhpcy5wcm9wcy5wb2ludHNbaV07XG4gICAgICAgICAgICBpZiAoaSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgY2lyY2xlcy5wdXNoKGNpcmNsZShwMSwgaSAtIDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxpbmVzLnB1c2goUmVhY3QuRE9NLmxpbmUoIHt4MTpwMS54LCB5MTpwMS55LCB4MjpwMi54LCB5MjpwMi55LCBzdHlsZTpsaW5lU3R5bGV9KSk7XG4gICAgICAgICAgICBjaXJjbGVzLnB1c2goY2lyY2xlKHAyLCBpKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmcobnVsbCwgXG4gICAgICAgIGxpbmVzLFxuICAgICAgICBjaXJjbGVzXG4gICAgICAgIClcbiAgICB9XG59KTtcblxuZnVuY3Rpb24gc2NhbGVQb2ludChwb2ludCwgYnkpe1xuICAgIHJldHVybiBfLmV4dGVuZChfLmNsb25lKHBvaW50KSwge3g6IHBvaW50LngqIGJ5LngseTogcG9pbnQueSogYnkueSB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbGVQb2ludHMocG9pbnRzLCBieSl7XG4gICAgcmV0dXJuIHBvaW50cy5tYXAoZnVuY3Rpb24gKHApIHtcbiAgICAgICAgcmV0dXJuIHNjYWxlUG9pbnQocCwgYnkpO1xuICAgIH0pO1xufVxuXG5cbnZhciBMYXllckxpbmVzRWRpdG9yID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTGF5ZXJMaW5lc0VkaXRvcicsXG4gICAgb25MaW5lQ2hhbmdlOiBmdW5jdGlvbiAoaW5kZXgsIHBvaW50cykge1xuICAgICAgICB2YXIgcyA9IHRoaXMucHJvcHMuc2l6ZTtcbiAgICAgICAgdmFyIGlzID0gIHt4OiAxL3MueCwgeToxLyBzLnl9O1xuICAgICAgICBwb2ludHMgPSBzY2FsZVBvaW50cyhwb2ludHMsIGlzKTtcbiAgICAgICAgdGhpcy5vblJhd0xpbmVDaGFuZ2UoaW5kZXgsIHBvaW50cyk7XG4gICAgfSxcblxuICAgIG9uUmF3TGluZUNoYW5nZTogZnVuY3Rpb24gKGluZGV4LCBwb2ludHMpIHtcbiAgICAgICAgdmFyIG5ld0xheWVycyA9IHRoaXMucHJvcHMubGF5ZXJEYXRhLmxheWVycy5zbGljZSgpO1xuICAgICAgICB2YXIgbmV3TGF5ZXIgPSBuZXdMYXllcnNbaW5kZXhdID0gXy5jbG9uZShuZXdMYXllcnNbaW5kZXhdKTtcbiAgICAgICAgbmV3TGF5ZXIucG9pbnRzID0gcG9pbnRzO1xuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKGNoYW5nZWQodGhpcy5wcm9wcy5sYXllckRhdGEsIHtsYXllcnM6IG5ld0xheWVyc30pKTtcbiAgICB9LFxuXG4gICAgb25Qb2ludFRvdWNoOiBmdW5jdGlvbiAobGF5ZXJJLCBwb2ludEksIGUpIHtcbiAgICAgICAgaWYgKCFlLmN0cmxLZXkpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoY2hhbmdlZCh0aGlzLnByb3BzLmxheWVyRGF0YSwge3NlbGVjdGVkOiBsYXllckl9KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbmV3UG9pbnRzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzW2xheWVySV0ucG9pbnRzLnNsaWNlKCk7XG4gICAgICAgICAgICBuZXdQb2ludHMuc3BsaWNlKHBvaW50SSwgMSk7XG4gICAgICAgICAgICB0aGlzLm9uUmF3TGluZUNoYW5nZShsYXllckksbmV3UG9pbnRzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRQYXJlbnQ6IGZ1bmN0aW9uICh0YXJnZXQsIHR5cGUpIHtcbiAgICAgICAgd2hpbGUodGFyZ2V0ICYmIHRhcmdldC5ub2RlTmFtZSAhPSB0eXBlKXtcbiAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfSxcblxuICAgIGFkZFBvaW50OiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoIWUuY3RybEtleSAmJiBlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5zZWxlY3RlZDtcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgIHZhciBuZXdQb2ludHMgPSB0aGlzLnByb3BzLmxheWVyRGF0YS5sYXllcnNbc2VsZWN0ZWRdLnBvaW50cy5zbGljZSgpO1xuICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSB0aGlzLmdldFBhcmVudChlLnRhcmdldCwgJ3N2ZycpO1xuICAgICAgICAgICAgICAgIHZhciBwID0gbmV3IFBvaW50KGUucGFnZVggLSBjYW52YXMub2Zmc2V0TGVmdCwgZS5wYWdlWSAtIGNhbnZhcy5vZmZzZXRUb3ApXG4gICAgICAgICAgICAgICAgdmFyIHMgPSB0aGlzLnByb3BzLnNpemU7XG4gICAgICAgICAgICAgICAgdmFyIGlzID0gIHt4OiAxL3MueCwgeToxLyBzLnl9O1xuICAgICAgICAgICAgICAgIHAgPSBzY2FsZVBvaW50KHAsaXMpO1xuICAgICAgICAgICAgICAgIG5ld1BvaW50cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgIG5ld1BvaW50cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhLnggLSBiLng7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5vblJhd0xpbmVDaGFuZ2Uoc2VsZWN0ZWQsIG5ld1BvaW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHMgPSB0aGlzLnByb3BzLnNpemU7XG4gICAgICAgIHZhciBlZGl0b3JzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzLm1hcChmdW5jdGlvbiAobGF5ZXIsIGkpIHtcblxuICAgICAgICAgICAgdmFyIHNlbGVjdGVkID0gdGhpcy5wcm9wcy5sYXllckRhdGEuc2VsZWN0ZWQgPT0gaTtcbiAgICAgICAgICAgIHZhciBtYXJrQ29sb3IgPSBzZWxlY3RlZD8nd2hpdGUnOidncmV5JztcbiAgICAgICAgICAgIHZhciBtYXJrU2l6ZSA9IDEwO1xuXG4gICAgICAgICAgICBpZighdGhpcy5wcm9wcy5jYW5TZWxlY3QgJiYgIXNlbGVjdGVkKXtcbiAgICAgICAgICAgICAgICBtYXJrU2l6ZSA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzY2FsZWRQb2ludHMgPSBzY2FsZVBvaW50cyhsYXllci5wb2ludHMsIHRoaXMucHJvcHMuc2l6ZSk7XG4gICAgICAgICAgICByZXR1cm4gU2luZ2xlTGluZUVkaXRvciggIHtzaXplOnMsIGNvbG9yOmxheWVyLmNvbG9yLCBtYXJrQ29sb3I6bWFya0NvbG9yLCBtYXJrU2l6ZTptYXJrU2l6ZSwgIHBvaW50czpzY2FsZWRQb2ludHMsIG9uQ2hhbmdlOnRoaXMub25MaW5lQ2hhbmdlLmJpbmQodGhpcywgaSksIG9uUG9pbnRUb3VjaDp0aGlzLm9uUG9pbnRUb3VjaC5iaW5kKHRoaXMsIGkpfSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cblxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLnN2Zygge3dpZHRoOnMueCwgaGVpZ2h0OnMueSwgY2xhc3NOYW1lOlwibGluZUVkaXRvclwiLCBvbk1vdXNlRG93bjp0aGlzLmFkZFBvaW50fSwgZWRpdG9ycyk7XG4gICAgfVxufSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBMYXllckxpbmVzRWRpdG9yOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUm5kID0gcmVxdWlyZSgnLi9ybmQnKTtcblxudmFyIExheWVyID0gcmVxdWlyZSgnLi9kYXRhL2xheWVyJyk7XG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL2RhdGEvcG9pbnQnKTtcblxudmFyIEljb25CdXR0b24gPSByZXF1aXJlKCcuL2Jvb3RzdHJhcC9pY29uLWJ1dHRvbicpO1xuXG5hcnJheU1vdmUgPSBmdW5jdGlvbihhcnJheSwgZnJvbSwgdG8pIHtcbiAgICBhcnJheS5zcGxpY2UodG8sIDAsIGFycmF5LnNwbGljZShmcm9tLCAxKVswXSk7XG59O1xuXG52YXIgTGF5ZXJJbnNwZWN0b3IgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdMYXllckluc3BlY3RvcicsXG4gICAgb25Db2xvckNoYW5nZTogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdGhpcy5vbk5ld0NvbG9yVmFsdWUoZS50YXJnZXQudmFsdWUpO1xuICAgIH0sXG5cbiAgICBvblNlZWRDaGFuZ2U6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoaXMub25OZXdTZWVkVmFsdWUoZS50YXJnZXQudmFsdWUpO1xuICAgIH0sXG5cbiAgICBvbk5ld0NvbG9yVmFsdWU6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgdmFyIG5ld0xheWVyICA9ICBfLmNsb25lKHRoaXMucHJvcHMubGF5ZXIpO1xuICAgICAgICBuZXdMYXllci5jb2xvciA9IHZhbDtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShuZXdMYXllcik7XG4gICAgfSxcblxuICAgIG9uTmV3U2VlZFZhbHVlOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIHZhciBuZXdMYXllciAgPSAgXy5jbG9uZSh0aGlzLnByb3BzLmxheWVyKTtcbiAgICAgICAgbmV3TGF5ZXIuc2VlZCA9IHZhbDtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShuZXdMYXllcik7XG4gICAgfSxcblxuICAgIG9uUmFuZG9tQ29sb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5vbk5ld0NvbG9yVmFsdWUoUm5kLmNvbG9yKCkpO1xuICAgIH0sXG4gICAgb25SYW5kb21TZWVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMub25OZXdTZWVkVmFsdWUoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjkwMDAwICsxMDAwMCkpO1xuICAgIH0sXG5cblxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIHRvZG86IHJldXNhYmxlIGZvcm0gY29tcG9uZW5ldFxuXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KG51bGwsIFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZm9ybSgge3JvbGU6XCJmb3JtXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKCB7Zm9yOlwibGF5ZXJDb2xvclwifSwgXCJDb2xvclwiKSxcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge2lkOlwibGF5ZXJDb2xvclwiLCB0eXBlOlwidGV4dFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgdmFsdWU6dGhpcy5wcm9wcy5sYXllci5jb2xvciwgb25DaGFuZ2U6dGhpcy5vbkNvbG9yQ2hhbmdlfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1idG5cIn0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOlwiYnRuIGJ0bi1kZWZhdWx0IGlucHV0LXNtXCIsIHR5cGU6XCJidXR0b25cIiwgb25DbGljazp0aGlzLm9uUmFuZG9tQ29sb3J9LCBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24gZ2x5cGhpY29uLWZpcmVcIn0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXBcIn0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKCB7Zm9yOlwibGF5ZXJTZWVkXCJ9LCBcIlNlZWRcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXBcIn0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge2lkOlwibGF5ZXJTZWVkXCIsIHR5cGU6XCJ0ZXh0XCIsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1zbVwiLCB2YWx1ZTp0aGlzLnByb3BzLmxheWVyLnNlZWQsIG9uQ2hhbmdlOnRoaXMub25TZWVkQ2hhbmdlfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXAtYnRuXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHQgaW5wdXQtc21cIiwgdHlwZTpcImJ1dHRvblwiLCBvbkNsaWNrOnRoaXMub25SYW5kb21TZWVkfSwgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uIGdseXBoaWNvbi1maXJlXCJ9KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIClcbiAgICB9XG59KTtcblxudmFyIGNoYW5nZWQ9IGZ1bmN0aW9uICh0YXJnZXQsIGNoYW5nZXMpIHtcbiAgICByZXR1cm4gXy5leHRlbmQoXy5jbG9uZSh0YXJnZXQpLCBjaGFuZ2VzKTtcbn07XG5cbnZhciBMYXllckxpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdMYXllckxpc3QnLFxuXG4gICAgb25DbGljazogZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UoY2hhbmdlZCh0aGlzLnByb3BzLmxheWVyRGF0YSwge1xuICAgICAgICAgICAgc2VsZWN0ZWQ6IGluZGV4XG4gICAgICAgIH0pKTtcbiAgICB9LFxuXG4gICAgYWRkTGF5ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJuZFBvaW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludChNYXRoLnJhbmRvbSgpLCBNYXRoLnJhbmRvbSgpKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbmV3TGF5ZXJzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzLnNsaWNlKCk7XG5cbiAgICAgICAgLy8gdG9kbzogcmV1c2Ugc29ydCAobW92ZSB0byBMYXllcj8pXG4gICAgICAgIHZhciBsYXllciA9IG5ldyBMYXllcihSbmQuY29sb3IoKSwgW3JuZFBvaW50KCksIHJuZFBvaW50KCldKTtcbiAgICAgICAgbGF5ZXIucG9pbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhLnggLSBiLng7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdMYXllcnMucHVzaChsYXllcik7XG5cbiAgICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZShjaGFuZ2VkKHRoaXMucHJvcHMubGF5ZXJEYXRhLCB7XG4gICAgICAgICAgICBsYXllcnM6IG5ld0xheWVycyxcbiAgICAgICAgICAgIHNlbGVjdGVkOiBuZXdMYXllcnMubGVuZ3RoLTFcbiAgICAgICAgfSkpO1xuICAgIH0sXG4gICAgcmVtb3ZlTGF5ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5ld0xheWVycyA9IHRoaXMucHJvcHMubGF5ZXJEYXRhLmxheWVycy5zbGljZSgpO1xuICAgICAgICBuZXdMYXllcnMuc3BsaWNlKHRoaXMucHJvcHMubGF5ZXJEYXRhLnNlbGVjdGVkLDEpO1xuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKGNoYW5nZWQodGhpcy5wcm9wcy5sYXllckRhdGEsIHtcbiAgICAgICAgICAgIGxheWVyczogbmV3TGF5ZXJzXG4gICAgICAgIH0pKTtcbiAgICB9LFxuXG5cbiAgICBvbkxheWVyQ2hhbmdlOiBmdW5jdGlvbiAobGF5ZXJJbmRleCwgbmV3TGF5ZXIpIHtcblxuICAgICAgICB2YXIgbmV3TGF5ZXJzID0gdGhpcy5wcm9wcy5sYXllckRhdGEubGF5ZXJzLnNsaWNlKCk7XG4gICAgICAgIG5ld0xheWVyc1tsYXllckluZGV4XSA9IG5ld0xheWVyO1xuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKGNoYW5nZWQodGhpcy5wcm9wcy5sYXllckRhdGEsIHtcbiAgICAgICAgICAgIGxheWVyczogbmV3TGF5ZXJzXG4gICAgICAgIH0pKTtcbiAgICB9LFxuXG4gICAgbW92ZVVwOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubW92ZSgxKTtcbiAgICB9LFxuXG4gICAgbW92ZURvd246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5tb3ZlKC0xKTtcbiAgICB9LFxuXG4gICAgbW92ZTogZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgICAgIHZhciBsYXllckRhdGEgPSB0aGlzLnByb3BzLmxheWVyRGF0YTtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gbGF5ZXJEYXRhLnNlbGVjdGVkO1xuICAgICAgICB2YXIgbmV3TGF5ZXJzID0gbGF5ZXJEYXRhLmxheWVycy5zbGljZSgpO1xuICAgICAgICBhcnJheU1vdmUobmV3TGF5ZXJzLCBzZWxlY3RlZCwgc2VsZWN0ZWQrZGVsdGEpO1xuICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKGNoYW5nZWQobGF5ZXJEYXRhLCB7XG4gICAgICAgICAgICBsYXllcnM6IG5ld0xheWVycyxcbiAgICAgICAgICAgIHNlbGVjdGVkOiBzZWxlY3RlZCtkZWx0YVxuICAgICAgICB9KSk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbGF5ZXJEYXRhID0gdGhpcy5wcm9wcy5sYXllckRhdGE7XG4gICAgICAgIHZhciBzZWxlY3RlZExheWVyO1xuXG4gICAgICAgIHZhciBsYXllcnMgPSBsYXllckRhdGEubGF5ZXJzLm1hcChmdW5jdGlvbiAobGF5ZXIsIGkpIHtcblxuICAgICAgICAgICAgdmFyIHN0eWxlID0ge1xuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogbGF5ZXIuY29sb3IsXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICczMHB4J1xuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZihpID09IGxheWVyRGF0YS5zZWxlY3RlZCl7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRMYXllciA9IGxheWVyO1xuICAgICAgICAgICAgICAgIHN0eWxlLmJvcmRlciA9IFwiM3B4IGRhc2hlZCAjMjcyQjMwXCJcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtzdHlsZTpzdHlsZSwgb25DbGljazp0aGlzLm9uQ2xpY2suYmluZCh0aGlzLCBpKX0pO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICBsYXllcnMucmV2ZXJzZSgpO1xuICAgICAgICB2YXIgaW5zcGVjdG9yO1xuICAgICAgICB2YXIgYWN0aW9ucyA9IFtdO1xuXG4gICAgICAgIGFjdGlvbnMucHVzaChJY29uQnV0dG9uKCB7aWNvbjpcInBsdXNcIiwgY2xhc3NOYW1lOlwiYnRuLWdyb3VwLXNwYWNlXCIsIG9uQ2xpY2s6dGhpcy5hZGRMYXllcn0gKSk7XG5cbiAgICAgICAgaWYoc2VsZWN0ZWRMYXllcikge1xuICAgICAgICAgICAgaW5zcGVjdG9yID0gTGF5ZXJJbnNwZWN0b3IoIHtsYXllcjpzZWxlY3RlZExheWVyLCBvbkNoYW5nZTp0aGlzLm9uTGF5ZXJDaGFuZ2UuYmluZCh0aGlzLCB0aGlzLnByb3BzLmxheWVyRGF0YS5zZWxlY3RlZCl9KTtcblxuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJidG4tZ3JvdXAgYnRuLWdyb3VwLXNwYWNlXCJ9LCBcbiAgICAgICAgICAgICAgICBJY29uQnV0dG9uKCB7aWNvbjpcImFycm93LXVwXCIsIG9uQ2xpY2s6dGhpcy5tb3ZlVXAsIGVuYWJsZWQ6bGF5ZXJEYXRhLnNlbGVjdGVkIDwgbGF5ZXJEYXRhLmxheWVycy5sZW5ndGgtMX0pLFxuICAgICAgICAgICAgICAgIEljb25CdXR0b24oIHtpY29uOlwiYXJyb3ctZG93blwiLCBvbkNsaWNrOnRoaXMubW92ZURvd24sIGVuYWJsZWQ6bGF5ZXJEYXRhLnNlbGVjdGVkID4gMH0pXG4gICAgICAgICAgICApKTtcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaChJY29uQnV0dG9uKCB7aWNvbjpcInRyYXNoXCIsIGNsYXNzTmFtZTpcImJ0bi1ncm91cC1zcGFjZVwiLCBvbkNsaWNrOnRoaXMucmVtb3ZlTGF5ZXJ9ICkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmg0KG51bGwsIFwiTGF5ZXJzXCIpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImgtc3BhY2VkXCJ9LCBcbiAgICAgICAgICAgICAgICBsYXllcnNcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaC1zcGFjZWRcIn0sIFxuICAgICAgICAgICAgICAgIGFjdGlvbnNcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBpbnNwZWN0b3JcbiAgICAgICAgKVxuICAgIH1cbn0pO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gTGF5ZXJMaXN0OyIsInZhciBNYXRoVXRpbCA9IE1hdGhVdGlsIHx8IHt9O1xuTWF0aFV0aWwuY29uc3RyYWluID0gZnVuY3Rpb24gKHYsIG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCB2KSk7XG59O1xuXG5NYXRoVXRpbC5jb25zdHJhaW5Qb2ludCA9IGZ1bmN0aW9uIChwLCBtaW4sIG1heCkge1xuICAgIHAueCA9IE1hdGhVdGlsLmNvbnN0cmFpbihwLngsIG1pbi54LCBtYXgueCk7XG4gICAgcC55ID0gTWF0aFV0aWwuY29uc3RyYWluKHAueSwgbWluLnksIG1heC55KTtcbiAgICByZXR1cm4gcDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWF0aFV0aWw7IiwidmFyIGRhdGEgPSB7fTtcbmRhdGEuYW5pbWFscyA9IFsnQWFyZHZhcmsnLFxuICAgICdBbGJhdHJvc3MnLFxuICAgICdBbGxpZ2F0b3InLFxuICAgICdBbHBhY2EnLFxuICAgICdBbnQnLFxuICAgICdBbnRlYXRlcicsXG4gICAgJ0FudGVsb3BlJyxcbiAgICAnQXBlJyxcbiAgICAnQXJtYWRpbGxvJyxcbiAgICAnQXNzL0RvbmtleScsXG4gICAgJ0JhYm9vbicsXG4gICAgJ0JhZGdlcicsXG4gICAgJ0JhcnJhY3VkYScsXG4gICAgJ0JhdCcsXG4gICAgJ0JlYXInLFxuICAgICdCZWF2ZXInLFxuICAgICdCZWUnLFxuICAgICdCaXNvbicsXG4gICAgJ0JvYXInLFxuICAgICdCdWZmYWxvJyxcbiAgICAnQnV0dGVyZmx5JyxcbiAgICAnQ2FtZWwnLFxuICAgICdDYXB5YmFyYScsXG4gICAgJ0Nhcmlib3UnLFxuICAgICdDYXNzb3dhcnknLFxuICAgICdDYXQnLFxuICAgICdDYXRlcnBpbGxhcicsXG4gICAgJ0NhdHRsZScsXG4gICAgJ0NoYW1vaXMnLFxuICAgICdDaGVldGFoJyxcbiAgICAnQ2hpY2tlbicsXG4gICAgJ0NoaW1wYW56ZWUnLFxuICAgICdDaGluY2hpbGxhJyxcbiAgICAnQ2hvdWdoJyxcbiAgICAnQ2xhbScsXG4gICAgJ0NvYnJhJyxcbiAgICAnQ29ja3JvYWNoJyxcbiAgICAnQ29kJyxcbiAgICAnQ29ybW9yYW50JyxcbiAgICAnQ295b3RlJyxcbiAgICAnQ3JhYicsXG4gICAgJ0NyYW5lJyxcbiAgICAnQ3JvY29kaWxlJyxcbiAgICAnQ3JvdycsXG4gICAgJ0N1cmxldycsXG4gICAgJ0RlZXInLFxuICAgICdEaW5vc2F1cicsXG4gICAgJ0RvZycsXG4gICAgJ0RvZ2Zpc2gnLFxuICAgICdEb2xwaGluJyxcbiAgICAnRG9ua2V5JyxcbiAgICAnRG90dGVyZWwnLFxuICAgICdEb3ZlJyxcbiAgICAnRHJhZ29uZmx5JyxcbiAgICAnRHVjaycsXG4gICAgJ0R1Z29uZycsXG4gICAgJ0R1bmxpbicsXG4gICAgJ0VhZ2xlJyxcbiAgICAnRWNoaWRuYScsXG4gICAgJ0VlbCcsXG4gICAgJ0VsYW5kJyxcbiAgICAnRWxlcGhhbnQnLFxuICAgICdFbGVwaGFudCBzZWFsJyxcbiAgICAnRWxrJyxcbiAgICAnRW11JyxcbiAgICAnRmFsY29uJyxcbiAgICAnRmVycmV0JyxcbiAgICAnRmluY2gnLFxuICAgICdGaXNoJyxcbiAgICAnRmxhbWluZ28nLFxuICAgICdGbHknLFxuICAgICdGb3gnLFxuICAgICdGcm9nJyxcbiAgICAnR2F1cicsXG4gICAgJ0dhemVsbGUnLFxuICAgICdHZXJiaWwnLFxuICAgICdHaWFudCBQYW5kYScsXG4gICAgJ0dpcmFmZmUnLFxuICAgICdHbmF0JyxcbiAgICAnR251JyxcbiAgICAnR29hdCcsXG4gICAgJ0dvb3NlJyxcbiAgICAnR29sZGZpbmNoJyxcbiAgICAnR29sZGZpc2gnLFxuICAgICdHb3JpbGxhJyxcbiAgICAnR29zaGF3aycsXG4gICAgJ0dyYXNzaG9wcGVyJyxcbiAgICAnR3JvdXNlJyxcbiAgICAnR3VhbmFjbycsXG4gICAgJ0d1aW5lYSBmb3dsJyxcbiAgICAnR3VpbmVhIHBpZycsXG4gICAgJ0d1bGwnLFxuICAgICdIYXJlJyxcbiAgICAnSGF3aycsXG4gICAgJ0hlZGdlaG9nJyxcbiAgICAnSGVyb24nLFxuICAgICdIZXJyaW5nJyxcbiAgICAnSGlwcG9wb3RhbXVzJyxcbiAgICAnSG9ybmV0JyxcbiAgICAnSG9yc2UnLFxuICAgICdIdW1hbicsXG4gICAgJ0h1bW1pbmdiaXJkJyxcbiAgICAnSHllbmEnLFxuICAgICdJYmV4JyxcbiAgICAnSWJpcycsXG4gICAgJ0phY2thbCcsXG4gICAgJ0phZ3VhcicsXG4gICAgJ0pheScsXG4gICAgJ0plbGx5ZmlzaCcsXG4gICAgJ0thbmdhcm9vJyxcbiAgICAnS2luZ2Zpc2hlcicsXG4gICAgJ0tvYWxhJyxcbiAgICAnS29tb2RvIGRyYWdvbicsXG4gICAgJ0tvb2thYnVyYScsXG4gICAgJ0tvdXByZXknLFxuICAgICdLdWR1JyxcbiAgICAnTGFwd2luZycsXG4gICAgJ0xhcmsnLFxuICAgICdMZW11cicsXG4gICAgJ0xlb3BhcmQnLFxuICAgICdMaW9uJyxcbiAgICAnTGxhbWEnLFxuICAgICdMb2JzdGVyJyxcbiAgICAnTG9jdXN0JyxcbiAgICAnTG9yaXMnLFxuICAgICdMb3VzZScsXG4gICAgJ0x5cmViaXJkJyxcbiAgICAnTWFncGllJyxcbiAgICAnTWFsbGFyZCcsXG4gICAgJ01hbmF0ZWUnLFxuICAgICdNYW5kcmlsbCcsXG4gICAgJ01hbnRpcycsXG4gICAgJ01hcnRlbicsXG4gICAgJ01lZXJrYXQnLFxuICAgICdNaW5rJyxcbiAgICAnTW9sZScsXG4gICAgJ01vbmdvb3NlJyxcbiAgICAnTW9ua2V5JyxcbiAgICAnTW9vc2UnLFxuICAgICdNb3VzZScsXG4gICAgJ01vc3F1aXRvJyxcbiAgICAnTXVsZScsXG4gICAgJ05hcndoYWwnLFxuICAgICdOZXd0JyxcbiAgICAnTmlnaHRpbmdhbGUnLFxuICAgICdPY3RvcHVzJyxcbiAgICAnT2thcGknLFxuICAgICdPcG9zc3VtJyxcbiAgICAnT3J5eCcsXG4gICAgJ09zdHJpY2gnLFxuICAgICdPdHRlcicsXG4gICAgJ093bCcsXG4gICAgJ094JyxcbiAgICAnT3lzdGVyJyxcbiAgICAnUGFycm90JyxcbiAgICAnUGFydHJpZGdlJyxcbiAgICAnUGVhZm93bCcsXG4gICAgJ1BlbGljYW4nLFxuICAgICdQZW5ndWluJyxcbiAgICAnUGhlYXNhbnQnLFxuICAgICdQaWcnLFxuICAgICdQaWdlb24nLFxuICAgICdQb2xhciBCZWFyJyxcbiAgICAnUG9ueS0gU2VlIEhvcnNlJyxcbiAgICAnUG9yY3VwaW5lJyxcbiAgICAnUG9ycG9pc2UnLFxuICAgICdQcmFpcmllIERvZycsXG4gICAgJ1F1YWlsJyxcbiAgICAnUXVlbGVhJyxcbiAgICAnUXVldHphbCcsXG4gICAgJ1JhYmJpdCcsXG4gICAgJ1JhY2Nvb24nLFxuICAgICdSYWlsJyxcbiAgICAnUmFtJyxcbiAgICAnUmF0JyxcbiAgICAnUmF2ZW4nLFxuICAgICdSZWQgZGVlcicsXG4gICAgJ1JlZCBwYW5kYScsXG4gICAgJ1JlaW5kZWVyJyxcbiAgICAnUmhpbm9jZXJvcycsXG4gICAgJ1Jvb2snLFxuICAgICdTYWxhbWFuZGVyJyxcbiAgICAnU2FsbW9uJyxcbiAgICAnU2FuZCBEb2xsYXInLFxuICAgICdTYW5kcGlwZXInLFxuICAgICdTYXJkaW5lJyxcbiAgICAnU2NvcnBpb24nLFxuICAgICdTZWEgbGlvbicsXG4gICAgJ1NlYSBVcmNoaW4nLFxuICAgICdTZWFob3JzZScsXG4gICAgJ1NlYWwnLFxuICAgICdTaGFyaycsXG4gICAgJ1NoZWVwJyxcbiAgICAnU2hyZXcnLFxuICAgICdTa3VuaycsXG4gICAgJ1NuYWlsJyxcbiAgICAnU25ha2UnLFxuICAgICdTcGFycm93JyxcbiAgICAnU3BpZGVyJyxcbiAgICAnU3Bvb25iaWxsJyxcbiAgICAnU3F1aWQnLFxuICAgICdTcXVpcnJlbCcsXG4gICAgJ1N0YXJsaW5nJyxcbiAgICAnU3RpbmdyYXknLFxuICAgICdTdGlua2J1ZycsXG4gICAgJ1N0b3JrJyxcbiAgICAnU3dhbGxvdycsXG4gICAgJ1N3YW4nLFxuICAgICdUYXBpcicsXG4gICAgJ1RhcnNpZXInLFxuICAgICdUZXJtaXRlJyxcbiAgICAnVGlnZXInLFxuICAgICdUb2FkJyxcbiAgICAnVHJvdXQnLFxuICAgICdUdXJrZXknLFxuICAgICdUdXJ0bGUnLFxuICAgICdWaXBlcicsXG4gICAgJ1Z1bHR1cmUnLFxuICAgICdXYWxsYWJ5JyxcbiAgICAnV2FscnVzJyxcbiAgICAnV2FzcCcsXG4gICAgJ1dhdGVyIGJ1ZmZhbG8nLFxuICAgICdXZWFzZWwnLFxuICAgICdXaGFsZScsXG4gICAgJ1dvbGYnLFxuICAgICdXb2x2ZXJpbmUnLFxuICAgICdXb21iYXQnLFxuICAgICdXb29kY29jaycsXG4gICAgJ1dvb2RwZWNrZXInLFxuICAgICdXb3JtJyxcbiAgICAnV3JlbicsXG4gICAgJ1lhaycsXG4gICAgJ1plYnJhJyxcbl07XG5cblxuXG5kYXRhLmNvbG9ycyA9IFsnQWNpZCBHcmVlbicsXG4gICAgJ0Flcm8nLFxuICAgICdBZXJvIEJsdWUnLFxuICAgICdBZnJpY2FuIFZpb2xldCcsXG4gICAgJ0FsYWJhbWEgQ3JpbXNvbicsXG4gICAgJ0FsaWNlIEJsdWUnLFxuICAgICdBbGl6YXJpbiBDcmltc29uJyxcbiAgICAnQWxsb3kgT3JhbmdlJyxcbiAgICAnQWxtb25kJyxcbiAgICAnQW1hcmFudGgnLFxuICAgICdBbWFyYW50aCBQaW5rJyxcbiAgICAnQW1hcmFudGggUHVycGxlJyxcbiAgICAnQW1hem9uJyxcbiAgICAnQW1iZXInLFxuICAgICdBbWVyaWNhbiBSb3NlJyxcbiAgICAnQW1ldGh5c3QnLFxuICAgICdBbmRyb2lkIEdyZWVuJyxcbiAgICAnQW50aS1GbGFzaCBXaGl0ZScsXG4gICAgJ0FudGlxdWUgQnJhc3MnLFxuICAgICdBbnRpcXVlIEJyb256ZScsXG4gICAgJ0FudGlxdWUgRnVjaHNpYScsXG4gICAgJ0FudGlxdWUgUnVieScsXG4gICAgJ0FudGlxdWUgV2hpdGUnLFxuICAgICdBcHBsZSBHcmVlbicsXG4gICAgJ0Fwcmljb3QnLFxuICAgICdBcXVhJyxcbiAgICAnQXF1YW1hcmluZScsXG4gICAgJ0FybXkgR3JlZW4nLFxuICAgICdBcnNlbmljJyxcbiAgICAnQXJ0aWNob2tlJyxcbiAgICAnQXJ5bGlkZSBZZWxsb3cnLFxuICAgICdBc2ggR3JleScsXG4gICAgJ0FzcGFyYWd1cycsXG4gICAgJ0F0b21pYyBUYW5nZXJpbmUnLFxuICAgICdBdXJlb2xpbicsXG4gICAgJ0F1cm9NZXRhbFNhdXJ1cycsXG4gICAgJ0F2b2NhZG8nLFxuICAgICdBenVyZScsXG4gICAgJ0F6dXJlIE1pc3QnLFxuICAgICdEYXp6bGVkIEJsdWUnLFxuICAgICdCYWJ5IEJsdWUnLFxuICAgICdCYWJ5IEJsdWUgRXllcycsXG4gICAgJ0JhYnkgUGluaycsXG4gICAgJ0JhYnkgUG93ZGVyJyxcbiAgICAnQmFrZXItTWlsbGVyIFBpbmsnLFxuICAgICdCYWxsIEJsdWUnLFxuICAgICdCYW5hbmEgTWFuaWEnLFxuICAgICdCYW5hbmEgWWVsbG93JyxcbiAgICAnQmFuZ2xhZGVzaCBHcmVlbicsXG4gICAgJ0JhcmJpZSBQaW5rJyxcbiAgICAnQmFybiBSZWQnLFxuICAgICdCYXR0bGVzaGlwIEdyZXknLFxuICAgICdCYXphYXInLFxuICAgICdCZWF1IEJsdWUnLFxuICAgICdCZWF2ZXInLFxuICAgICdCZWlnZScsXG4gICAgJ0Jpc3F1ZScsXG4gICAgJ0JpdHRlciBMZW1vbicsXG4gICAgJ0JpdHRlciBMaW1lJyxcbiAgICAnQml0dGVyc3dlZXQnLFxuICAgICdCaXR0ZXJzd2VldCBTaGltbWVyJyxcbiAgICAnQmxhY2snLFxuICAgICdCbGFjayBCZWFuJyxcbiAgICAnQmxhY2sgTGVhdGhlciBKYWNrZXQnLFxuICAgICdCbGFjayBPbGl2ZScsXG4gICAgJ0JsYW5jaGVkIEFsbW9uZCcsXG4gICAgJ0JsYXN0LU9mZiBCcm9uemUnLFxuICAgICdCbGV1IERlIEZyYW5jZScsXG4gICAgJ0JsaXp6YXJkIEJsdWUnLFxuICAgICdCbG9uZCcsXG4gICAgJ0JsdWUnLFxuICAgICdCbHVlIEJlbGwnLFxuICAgICdCbHVlIFNhcHBoaXJlJyxcbiAgICAnQmx1ZSBZb25kZXInLFxuICAgICdCbHVlLUdyYXknLFxuICAgICdCbHVlLUdyZWVuJyxcbiAgICAnQmx1ZS1WaW9sZXQnLFxuICAgICdCbHVlYmVycnknLFxuICAgICdCbHVlYm9ubmV0JyxcbiAgICAnQmx1c2gnLFxuICAgICdCb2xlJyxcbiAgICAnQm9uZGkgQmx1ZScsXG4gICAgJ0JvbmUnLFxuICAgICdCb3N0b24gVW5pdmVyc2l0eSBSZWQnLFxuICAgICdCb3R0bGUgR3JlZW4nLFxuICAgICdCb3lzZW5iZXJyeScsXG4gICAgJ0JyYW5kZWlzIEJsdWUnLFxuICAgICdCcmFzcycsXG4gICAgJ0JyaWNrIFJlZCcsXG4gICAgJ0JyaWdodCBDZXJ1bGVhbicsXG4gICAgJ0JyaWdodCBHcmVlbicsXG4gICAgJ0JyaWdodCBMYXZlbmRlcicsXG4gICAgJ0JyaWdodCBMaWxhYycsXG4gICAgJ0JyaWdodCBNYXJvb24nLFxuICAgICdCcmlnaHQgTmF2eSBCbHVlJyxcbiAgICAnQnJpZ2h0IFBpbmsnLFxuICAgICdCcmlnaHQgVHVycXVvaXNlJyxcbiAgICAnQnJpZ2h0IFViZScsXG4gICAgJ0JyaWxsaWFudCBMYXZlbmRlcicsXG4gICAgJ0JyaWxsaWFudCBSb3NlJyxcbiAgICAnQnJpbmsgUGluaycsXG4gICAgJ0JyaXRpc2ggUmFjaW5nIEdyZWVuJyxcbiAgICAnQnJvbnplJyxcbiAgICAnQnJvbnplIFllbGxvdycsXG4gICAgJ0Jyb3duLU5vc2UnLFxuICAgICdCcnVuc3dpY2sgR3JlZW4nLFxuICAgICdCdWJibGUgR3VtJyxcbiAgICAnQnViYmxlcycsXG4gICAgJ0J1ZCBHcmVlbicsXG4gICAgJ0J1ZmYnLFxuICAgICdCdWxnYXJpYW4gUm9zZScsXG4gICAgJ0J1cmd1bmR5JyxcbiAgICAnQnVybHl3b29kJyxcbiAgICAnQnVybnQgT3JhbmdlJyxcbiAgICAnQnVybnQgU2llbm5hJyxcbiAgICAnQnVybnQgVW1iZXInLFxuICAgICdCeXphbnRpbmUnLFxuICAgICdCeXphbnRpdW0nLFxuICAgICdDYWRldCcsXG4gICAgJ0NhZGV0IEJsdWUnLFxuICAgICdDYWRldCBHcmV5JyxcbiAgICAnQ2FkbWl1bSBHcmVlbicsXG4gICAgJ0NhZG1pdW0gT3JhbmdlJyxcbiAgICAnQ2FkbWl1bSBSZWQnLFxuICAgICdDYWRtaXVtIFllbGxvdycsXG4gICAgJ0NhZsOpIEF1IExhaXQnLFxuICAgICdDYWbDqSBOb2lyJyxcbiAgICAnQ2FsIFBvbHkgUG9tb25hIEdyZWVuJyxcbiAgICAnQ2FtYnJpZGdlIEJsdWUnLFxuICAgICdDYW1lbCcsXG4gICAgJ0NhbWVvIFBpbmsnLFxuICAgICdDYW1vdWZsYWdlIEdyZWVuJyxcbiAgICAnQ2FuYXJ5IFllbGxvdycsXG4gICAgJ0NhbmR5IEFwcGxlIFJlZCcsXG4gICAgJ0NhbmR5IFBpbmsnLFxuICAgICdDYXByaScsXG4gICAgJ0NhcHV0IE1vcnR1dW0nLFxuICAgICdDYXJkaW5hbCcsXG4gICAgJ0NhcmliYmVhbiBHcmVlbicsXG4gICAgJ0Nhcm1pbmUnLFxuICAgICdDYXJtaW5lIFBpbmsnLFxuICAgICdDYXJtaW5lIFJlZCcsXG4gICAgJ0Nhcm5hdGlvbiBQaW5rJyxcbiAgICAnQ2FybmVsaWFuJyxcbiAgICAnQ2Fyb2xpbmEgQmx1ZScsXG4gICAgJ0NhcnJvdCBPcmFuZ2UnLFxuICAgICdDYXN0bGV0b24gR3JlZW4nLFxuICAgICdDYXRhbGluYSBCbHVlJyxcbiAgICAnQ2F0YXdiYScsXG4gICAgJ0NlZGFyIENoZXN0JyxcbiAgICAnQ2VpbCcsXG4gICAgJ0NlbGFkb24nLFxuICAgICdDZWxhZG9uIEJsdWUnLFxuICAgICdDZWxhZG9uIEdyZWVuJyxcbiAgICAnQ2VsZXN0ZScsXG4gICAgJ0NlbGVzdGlhbCBCbHVlJyxcbiAgICAnQ2VyaXNlJyxcbiAgICAnQ2VyaXNlIFBpbmsnLFxuICAgICdDZXJ1bGVhbicsXG4gICAgJ0NlcnVsZWFuIEJsdWUnLFxuICAgICdDZXJ1bGVhbiBGcm9zdCcsXG4gICAgJ0NHIEJsdWUnLFxuICAgICdDRyBSZWQnLFxuICAgICdDaGFtb2lzZWUnLFxuICAgICdDaGFtcGFnbmUnLFxuICAgICdDaGFyY29hbCcsXG4gICAgJ0NoYXJsZXN0b24gR3JlZW4nLFxuICAgICdDaGFybSBQaW5rJyxcbiAgICAnQ2hlcnJ5JyxcbiAgICAnQ2hlcnJ5IEJsb3Nzb20gUGluaycsXG4gICAgJ0NoZXN0bnV0JyxcbiAgICAnQ2hpbmEgUGluaycsXG4gICAgJ0NoaW5hIFJvc2UnLFxuICAgICdDaGluZXNlIFJlZCcsXG4gICAgJ0NoaW5lc2UgVmlvbGV0JyxcbiAgICAnQ2hyb21lIFllbGxvdycsXG4gICAgJ0NpbmVyZW91cycsXG4gICAgJ0Npbm5hYmFyJyxcbiAgICAnQ2lubmFtb25bQ2l0YXRpb24gTmVlZGVkXScsXG4gICAgJ0NpdHJpbmUnLFxuICAgICdDaXRyb24nLFxuICAgICdDbGFyZXQnLFxuICAgICdDbGFzc2ljIFJvc2UnLFxuICAgICdDb2JhbHQnLFxuICAgICdDb2NvYSBCcm93bicsXG4gICAgJ0NvY29udXQnLFxuICAgICdDb2ZmZWUnLFxuICAgICdDb2x1bWJpYSBCbHVlJyxcbiAgICAnQ29uZ28gUGluaycsXG4gICAgJ0Nvb2wgQmxhY2snLFxuICAgICdDb29sIEdyZXknLFxuICAgICdDb3BwZXInLFxuICAgICdDb3BwZXIgUGVubnknLFxuICAgICdDb3BwZXIgUmVkJyxcbiAgICAnQ29wcGVyIFJvc2UnLFxuICAgICdDb3F1ZWxpY290JyxcbiAgICAnQ29yYWwnLFxuICAgICdDb3JhbCBQaW5rJyxcbiAgICAnQ29yYWwgUmVkJyxcbiAgICAnQ29yZG92YW4nLFxuICAgICdDb3JuJyxcbiAgICAnQ29ybmVsbCBSZWQnLFxuICAgICdDb3JuZmxvd2VyIEJsdWUnLFxuICAgICdDb3Juc2lsaycsXG4gICAgJ0Nvc21pYyBMYXR0ZScsXG4gICAgJ0NvdHRvbiBDYW5keScsXG4gICAgJ0NyZWFtJyxcbiAgICAnQ3JpbXNvbicsXG4gICAgJ0NyaW1zb24gR2xvcnknLFxuICAgICdDeWFuJyxcbiAgICAnQ3liZXIgR3JhcGUnLFxuICAgICdDeWJlciBZZWxsb3cnLFxuICAgICdEYWZmb2RpbCcsXG4gICAgJ0RhbmRlbGlvbicsXG4gICAgJ0RhcmsgQmx1ZScsXG4gICAgJ0RhcmsgQmx1ZS1HcmF5JyxcbiAgICAnRGFyayBCcm93bicsXG4gICAgJ0RhcmsgQnl6YW50aXVtJyxcbiAgICAnRGFyayBDYW5keSBBcHBsZSBSZWQnLFxuICAgICdEYXJrIENlcnVsZWFuJyxcbiAgICAnRGFyayBDaGVzdG51dCcsXG4gICAgJ0RhcmsgQ29yYWwnLFxuICAgICdEYXJrIEN5YW4nLFxuICAgICdEYXJrIEVsZWN0cmljIEJsdWUnLFxuICAgICdEYXJrIEdvbGRlbnJvZCcsXG4gICAgJ0RhcmsgR3JlZW4nLFxuICAgICdEYXJrIEltcGVyaWFsIEJsdWUnLFxuICAgICdEYXJrIEp1bmdsZSBHcmVlbicsXG4gICAgJ0RhcmsgS2hha2knLFxuICAgICdEYXJrIExhdmEnLFxuICAgICdEYXJrIExhdmVuZGVyJyxcbiAgICAnRGFyayBMaXZlcicsXG4gICAgJ0RhcmsgTWFnZW50YScsXG4gICAgJ0RhcmsgTWVkaXVtIEdyYXknLFxuICAgICdEYXJrIE1pZG5pZ2h0IEJsdWUnLFxuICAgICdEYXJrIE1vc3MgR3JlZW4nLFxuICAgICdEYXJrIE9saXZlIEdyZWVuJyxcbiAgICAnRGFyayBPcmFuZ2UnLFxuICAgICdEYXJrIE9yY2hpZCcsXG4gICAgJ0RhcmsgUGFzdGVsIEJsdWUnLFxuICAgICdEYXJrIFBhc3RlbCBHcmVlbicsXG4gICAgJ0RhcmsgUGFzdGVsIFB1cnBsZScsXG4gICAgJ0RhcmsgUGFzdGVsIFJlZCcsXG4gICAgJ0RhcmsgUGluaycsXG4gICAgJ0RhcmsgUG93ZGVyIEJsdWUnLFxuICAgICdEYXJrIFB1Y2UnLFxuICAgICdEYXJrIFJhc3BiZXJyeScsXG4gICAgJ0RhcmsgUmVkJyxcbiAgICAnRGFyayBTYWxtb24nLFxuICAgICdEYXJrIFNjYXJsZXQnLFxuICAgICdEYXJrIFNlYSBHcmVlbicsXG4gICAgJ0RhcmsgU2llbm5hJyxcbiAgICAnRGFyayBTa3kgQmx1ZScsXG4gICAgJ0RhcmsgU2xhdGUgQmx1ZScsXG4gICAgJ0RhcmsgU2xhdGUgR3JheScsXG4gICAgJ0RhcmsgU3ByaW5nIEdyZWVuJyxcbiAgICAnRGFyayBUYW4nLFxuICAgICdEYXJrIFRhbmdlcmluZScsXG4gICAgJ0RhcmsgVGF1cGUnLFxuICAgICdEYXJrIFRlcnJhIENvdHRhJyxcbiAgICAnRGFyayBUdXJxdW9pc2UnLFxuICAgICdEYXJrIFZhbmlsbGEnLFxuICAgICdEYXJrIFZpb2xldCcsXG4gICAgJ0RhcmsgWWVsbG93JyxcbiAgICAnRGFydG1vdXRoIEdyZWVuJyxcbiAgICAnRGViaWFuIFJlZCcsXG4gICAgJ0RlZXAgQ2FybWluZScsXG4gICAgJ0RlZXAgQ2FybWluZSBQaW5rJyxcbiAgICAnRGVlcCBDYXJyb3QgT3JhbmdlJyxcbiAgICAnRGVlcCBDZXJpc2UnLFxuICAgICdEZWVwIENoYW1wYWduZScsXG4gICAgJ0RlZXAgQ2hlc3RudXQnLFxuICAgICdEZWVwIENvZmZlZScsXG4gICAgJ0RlZXAgRnVjaHNpYScsXG4gICAgJ0RlZXAgSnVuZ2xlIEdyZWVuJyxcbiAgICAnRGVlcCBMZW1vbicsXG4gICAgJ0RlZXAgTGlsYWMnLFxuICAgICdEZWVwIE1hZ2VudGEnLFxuICAgICdEZWVwIE1hdXZlJyxcbiAgICAnRGVlcCBNb3NzIEdyZWVuJyxcbiAgICAnRGVlcCBQZWFjaCcsXG4gICAgJ0RlZXAgUGluaycsXG4gICAgJ0RlZXAgUHVjZScsXG4gICAgJ0RlZXAgUnVieScsXG4gICAgJ0RlZXAgU2FmZnJvbicsXG4gICAgJ0RlZXAgU2t5IEJsdWUnLFxuICAgICdEZWVwIFNwYWNlIFNwYXJrbGUnLFxuICAgICdEZWVwIFRhdXBlJyxcbiAgICAnRGVlcCBUdXNjYW4gUmVkJyxcbiAgICAnRGVlcicsXG4gICAgJ0RlbmltJyxcbiAgICAnRGVzZXJ0JyxcbiAgICAnRGVzZXJ0IFNhbmQnLFxuICAgICdEZXNpcmUnLFxuICAgICdEaWFtb25kJyxcbiAgICAnRGltIEdyYXknLFxuICAgICdEaXJ0JyxcbiAgICAnRG9kZ2VyIEJsdWUnLFxuICAgICdEb2d3b29kIFJvc2UnLFxuICAgICdEb2xsYXIgQmlsbCcsXG4gICAgJ0RvbmtleSBCcm93bicsXG4gICAgJ0RyYWInLFxuICAgICdEdWtlIEJsdWUnLFxuICAgICdEdXN0IFN0b3JtJyxcbiAgICAnRHV0Y2ggV2hpdGUnLFxuICAgICdFYXJ0aCBZZWxsb3cnLFxuICAgICdFYm9ueScsXG4gICAgJ0VjcnUnLFxuICAgICdFZXJpZSBCbGFjaycsXG4gICAgJ0VnZ3BsYW50JyxcbiAgICAnRWdnc2hlbGwnLFxuICAgICdFZ3lwdGlhbiBCbHVlJyxcbiAgICAnRWxlY3RyaWMgQmx1ZScsXG4gICAgJ0VsZWN0cmljIENyaW1zb24nLFxuICAgICdFbGVjdHJpYyBDeWFuJyxcbiAgICAnRWxlY3RyaWMgR3JlZW4nLFxuICAgICdFbGVjdHJpYyBJbmRpZ28nLFxuICAgICdFbGVjdHJpYyBMYXZlbmRlcicsXG4gICAgJ0VsZWN0cmljIExpbWUnLFxuICAgICdFbGVjdHJpYyBQdXJwbGUnLFxuICAgICdFbGVjdHJpYyBVbHRyYW1hcmluZScsXG4gICAgJ0VsZWN0cmljIFZpb2xldCcsXG4gICAgJ0VsZWN0cmljIFllbGxvdycsXG4gICAgJ0VtZXJhbGQnLFxuICAgICdFbWluZW5jZScsXG4gICAgJ0VuZ2xpc2ggR3JlZW4nLFxuICAgICdFbmdsaXNoIExhdmVuZGVyJyxcbiAgICAnRW5nbGlzaCBSZWQnLFxuICAgICdFbmdsaXNoIFZpb2xldCcsXG4gICAgJ0V0b24gQmx1ZScsXG4gICAgJ0V1Y2FseXB0dXMnLFxuICAgICdGYWxsb3cnLFxuICAgICdGYWx1IFJlZCcsXG4gICAgJ0ZhbmRhbmdvJyxcbiAgICAnRmFuZGFuZ28gUGluaycsXG4gICAgJ0Zhc2hpb24gRnVjaHNpYScsXG4gICAgJ0Zhd24nLFxuICAgICdGZWxkZ3JhdScsXG4gICAgJ0ZlbGRzcGFyJyxcbiAgICAnRmVybiBHcmVlbicsXG4gICAgJ0ZlcnJhcmkgUmVkJyxcbiAgICAnRmllbGQgRHJhYicsXG4gICAgJ0ZpcmUgRW5naW5lIFJlZCcsXG4gICAgJ0ZpcmVicmljaycsXG4gICAgJ0ZsYW1lJyxcbiAgICAnRmxhbWluZ28gUGluaycsXG4gICAgJ0ZsYXR0ZXJ5JyxcbiAgICAnRmxhdmVzY2VudCcsXG4gICAgJ0ZsYXgnLFxuICAgICdGbGlydCcsXG4gICAgJ0Zsb3JhbCBXaGl0ZScsXG4gICAgJ0ZsdW9yZXNjZW50IE9yYW5nZScsXG4gICAgJ0ZsdW9yZXNjZW50IFBpbmsnLFxuICAgICdGbHVvcmVzY2VudCBZZWxsb3cnLFxuICAgICdGb2xseScsXG4gICAgJ0ZyZW5jaCBCZWlnZScsXG4gICAgJ0ZyZW5jaCBCaXN0cmUnLFxuICAgICdGcmVuY2ggQmx1ZScsXG4gICAgJ0ZyZW5jaCBGdWNoc2lhJyxcbiAgICAnRnJlbmNoIExpbGFjJyxcbiAgICAnRnJlbmNoIExpbWUnLFxuICAgICdGcmVuY2ggTWF1dmUnLFxuICAgICdGcmVuY2ggUGluaycsXG4gICAgJ0ZyZW5jaCBQbHVtJyxcbiAgICAnRnJlbmNoIFB1Y2UnLFxuICAgICdGcmVuY2ggUmFzcGJlcnJ5JyxcbiAgICAnRnJlbmNoIFJvc2UnLFxuICAgICdGcmVuY2ggU2t5IEJsdWUnLFxuICAgICdGcmVuY2ggVmlvbGV0JyxcbiAgICAnRnJlbmNoIFdpbmUnLFxuICAgICdGcmVzaCBBaXInLFxuICAgICdGdWNoc2lhJyxcbiAgICAnRnVjaHNpYSBQaW5rJyxcbiAgICAnRnVjaHNpYSBQdXJwbGUnLFxuICAgICdGdWNoc2lhIFJvc2UnLFxuICAgICdGdWx2b3VzJyxcbiAgICAnRnV6enkgV3V6enknLFxuXTtcblxuZnVuY3Rpb24gcmFuZG9tKGxpc3Qpe1xuICAgIHJldHVybiBsaXN0W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpsaXN0Lmxlbmd0aCldO1xufVxuXG5leHBvcnRzLmNvbG9yID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiByYW5kb20oZGF0YS5jb2xvcnMpO1xufTtcblxuZXhwb3J0cy5hbmltYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHJhbmRvbShkYXRhLmFuaW1hbHMpO1xufTtcblxuZXhwb3J0cy5jb2xvckFuaW1hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5jb2xvcigpICsgXCIgXCIgKyB0aGlzLmFuaW1hbCgpO1xufTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxuXG52YXIgQXBwbGljYXRpb24gPSByZXF1aXJlKCcuL2FwcGxpY2F0aW9uJyk7XG52YXIgU3RyaXBpZmllciA9IHJlcXVpcmUoJy4vc3RyaXBpZmllci9zdHJpcGlmaWVyJyk7XG52YXIgUmVzdWx0UmVuZGVyZXIgPSByZXF1aXJlKCcuL3Jlc3VsdC1yZW5kZXJlcicpO1xudmFyIFdpZkVkaXRvciA9IHJlcXVpcmUoJy4vd2lmLWVkaXRvcicpO1xudmFyIFdpZkxpc3QgPSByZXF1aXJlKCcuL3dpZi1saXN0Jyk7XG52YXIgSWNvbiA9IHJlcXVpcmUoJy4vYm9vdHN0cmFwL2ljb24nKTtcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XG5cblxudmFyIE5hdkJhciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ05hdkJhcicsXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwcm9BY3RpdmUgPSB0aGlzLnByb3BzLnBhZ2UgPT0gJ3Byb2plY3RzJz8nYWN0aXZlJzonJztcbiAgICAgICAgdmFyIHdpZkFjdGl2ZSA9IHRoaXMucHJvcHMucGFnZSA9PSAnd2lmcyc/J2FjdGl2ZSc6Jyc7XG4gICAgICAgIHZhciBzdHJpcGlmaWVyQWN0aXZlID0gdGhpcy5wcm9wcy5wYWdlID09ICdzdHJpcGlmaWVyJz8nYWN0aXZlJzonJztcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5uYXYoIHtjbGFzc05hbWU6XCJuYXZiYXIgbmF2YmFyLWRlZmF1bHRcIiwgcm9sZTpcIm5hdmlnYXRpb25cIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbnRhaW5lci1mbHVpZFwifSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm5hdmJhci1oZWFkZXJcIn0sIFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYSgge2NsYXNzTmFtZTpcIm5hdmJhci1icmFuZFwiLCBocmVmOlwiI1wifSwgSWNvbigge2ljb246XCJmaXJlXCJ9KSxcbiAgICAgICAgICAgICAgICAgICAgXCIgUmFuZG9tIFdlYXZlIFN0cmlwZXNcIilcbiAgICAgICAgICAgICAgICApLFxuXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibmF2IG5hdmJhci1uYXZcIn0sIFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6cHJvQWN0aXZlfSwgUmVhY3QuRE9NLmEoIHtocmVmOlwiI3Byb2plY3RzXCJ9LCBcIlByb2plY3RzXCIpKVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibmF2IG5hdmJhci1uYXZcIn0sIFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6d2lmQWN0aXZlfSwgUmVhY3QuRE9NLmEoIHtocmVmOlwiI3dpZnNcIn0sIFwiV2lmc1wiKSlcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS51bCgge2NsYXNzTmFtZTpcIm5hdiBuYXZiYXItbmF2XCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmxpKCB7Y2xhc3NOYW1lOnN0cmlwaWZpZXJBY3RpdmV9LCBSZWFjdC5ET00uYSgge2hyZWY6XCIjc3RyaXBpZmllclwifSwgXCJJbWFnZSBTdHJpcGlmaWVyXCIpKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgKVxuICAgIH1cbn0pO1xuXG5cbnZhciBVcGxvYWRGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVXBsb2FkRm9ybScsXG4gICAgb25TdWJtaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgaWYoZXZ0LnRhcmdldC5yZWFkeVN0YXRlICE9IDIpIHJldHVybjtcbiAgICAgICAgICAgIGlmKGV2dC50YXJnZXQuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBhbGVydCgnRXJyb3Igd2hpbGUgcmVhZGluZyBmaWxlJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaWxlY29udGVudCA9IGV2dC50YXJnZXQucmVzdWx0O1xuXG4gICAgICAgICAgICB2YXIgbmV3SWQgPSBcIlwiICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwMDAwMCk7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IEpTT04ucGFyc2UoZXZ0LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgZGF0YS5uYW1lID0gZGF0YS5uYW1lICsgXCIgW0ltcG9ydGVkXVwiO1xuICAgICAgICAgICAgc3RvcmFnZS5zYXZlKG5ld0lkLCBkYXRhKTtcbiAgICAgICAgICAgIHJvdXRpZShyb3V0aWUubG9va3VwKCdwcm9qZWN0Jywge2lkOiBuZXdJZH0pKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZWFkZXIucmVhZEFzVGV4dCh0aGlzLnJlZnMuZmlsZS5nZXRET01Ob2RlKCkuZmlsZXNbMF0pO1xuICAgIH0sXG5cbiAgICBjbGlja0ZpbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZWZzLmZpbGUuZ2V0RE9NTm9kZSgpLmNsaWNrKCk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc3R5bGU9e2NvbG9yOid3aGl0ZSd9O1xuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmZvcm0oIHtvblN1Ym1pdDp0aGlzLm9uU3VibWl0fSwgXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5oNChudWxsLCBcIkltcG9ydCBQcm9qZWN0XCIpLFxuXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3R5cGU6XCJmaWxlXCIsIHJlZjpcImZpbGVcIiwgY2xhc3NOYW1lOlwid2hpdGUtZmlsZVwiLCBzdHlsZTpzdHlsZX0gKSxSZWFjdC5ET00uYnIobnVsbCksXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIn0sIEljb24oIHtpY29uOlwiZmxvcHB5LW9wZW5cIn0pLCBcIiBJbXBvcnRcIilcbiAgICAgICAgICAgICAgIClcbiAgICB9XG59KTtcblxuXG5cblxuLyoqXG4gKiBDcmVhdGVkIGJ5IGthandpXzAwMCBvbiAyMDE0LTA0LTA3LlxuICovXG52YXIgUHJvamVjdFBpY2tlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Byb2plY3RQaWNrZXInLFxuXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByb2plY3RzOiBbXVxuICAgICAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcm91dGllKCdzdHJpcGlmaWVyIHN0cmlwaWZpZXInLCBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3BhZ2VHcm91cDogJ3N0cmlwaWZpZXInLCBwYWdlOiAnc3RyaXBpZmllcicsIGlkOiBpZH0pO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIHJvdXRpZSgnd2lmIHdpZi86aWQnLCBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3BhZ2VHcm91cDogJ3dpZnMnLCBwYWdlOiAnd2lmJywgaWQ6IGlkfSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgcm91dGllKCd3aWZzIHdpZnMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwYWdlR3JvdXA6ICd3aWZzJywgcGFnZTogJ3dpZnMnfSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgcm91dGllKCdwcm9qZWN0IHByb2plY3QvOmlkJywgZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwYWdlR3JvdXA6ICdwcm9qZWN0cycsIHBhZ2U6ICdwcm9qZWN0JywgaWQ6IGlkfSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgcm91dGllKCcqJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cGFnZUdyb3VwOiAncHJvamVjdHMnLCAgcGFnZTogJ3Byb2plY3RzJ30pO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y3VycmVudElkOiBudWxsLCAgcHJvamVjdHM6IHN0b3JhZ2UubGlzdFByb2plY3RzKCl9KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG5cblxuICAgIGNyZWF0ZU5ldzogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbmV3SWQgPSBcIlwiICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwMDAwMCk7XG4gICAgICAgIHJvdXRpZShyb3V0aWUubG9va3VwKCdwcm9qZWN0Jywge2lkOiBuZXdJZH0pKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYWdlO1xuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnBhZ2UgPT0gJ3Byb2plY3QnKSB7XG4gICAgICAgICAgICBwYWdlID0gQXBwbGljYXRpb24oIHtpZDp0aGlzLnN0YXRlLmlkfSlcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnN0YXRlLnBhZ2UgPT0gJ3dpZicpIHtcbiAgICAgICAgICAgIHBhZ2UgPSBXaWZFZGl0b3IoIHtpZDp0aGlzLnN0YXRlLmlkfSlcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnN0YXRlLnBhZ2UgPT0gJ3dpZnMnKSB7XG4gICAgICAgICAgICBwYWdlID0gV2lmTGlzdChudWxsKVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuc3RhdGUucGFnZSA9PSAnc3RyaXBpZmllcicpIHtcbiAgICAgICAgICAgIHBhZ2UgPSBTdHJpcGlmaWVyKG51bGwpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgIHZhciBwcm9qZWN0cyA9IHRoaXMuc3RhdGUucHJvamVjdHMuc2xpY2UoKTtcbiAgICAgICAgICAgIHByb2plY3RzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICB2YXIgb25lID0gKGIubGFzdENoYW5nZSB8fCAwKSAtIChhLmxhc3RDaGFuZ2UgfHwgMCkgO1xuXG4gICAgICAgICAgICAgICAgaWYob25lID09IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9uZTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgcHJvamVjdFZpZXdzID0gcHJvamVjdHMubWFwKGZ1bmN0aW9uIChwcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHByZXZpZXc7XG4gICAgICAgICAgICAgICAgaWYocHJvamVjdC5yZXN1bHQpe1xuICAgICAgICAgICAgICAgICAgICBwcmV2aWV3ID0gUmVzdWx0UmVuZGVyZXIoIHtyZXN1bHQ6cHJvamVjdC5yZXN1bHQsIGhlaWdodDpcIjIwXCJ9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBtYWtlTGluayhpbm5lcil7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBSZWFjdC5ET00uYSgge2hyZWY6JyMnICsgcm91dGllLmxvb2t1cCgncHJvamVjdCcsIHtpZDogcHJvamVjdC5pZH0pfSwgaW5uZXIpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIChSZWFjdC5ET00uZGl2KG51bGwsIFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uaDQobnVsbCwgbWFrZUxpbmsocHJvamVjdC5uYW1lKSksXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWtlTGluayhwcmV2aWV3KVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG5cblxuXG5cblxuICAgICAgICAgICAgcGFnZSA9IFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb250YWluZXItZmx1aWRcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5oMSgge2NsYXNzTmFtZTpcInBhZ2UtaGVhZGVyIHBhZ2UtaGVhZGVyLW1haW5cIn0sIFwiU2F2ZWQgcHJvamVjdHNcIiksXG4gICAgICAgICAgICAgICAgcHJvamVjdFZpZXdzLFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLmEoIHtjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIiwgb25DbGljazp0aGlzLmNyZWF0ZU5ld30sIEljb24oIHtpY29uOlwicGx1c1wifSksIFwiIE5ldyBQcm9qZWN0XCIpLFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnIobnVsbCksUmVhY3QuRE9NLmJyKG51bGwpLFxuICAgICAgICAgICAgICAgICAgICBVcGxvYWRGb3JtKG51bGwpXG4gICAgICAgICAgICApXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmRpdihudWxsLCBOYXZCYXIoIHtwYWdlOnRoaXMuc3RhdGUucGFnZUdyb3VwfSkscGFnZSlcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9qZWN0UGlja2VyOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG5cblxudmFyIHN0cmlwZXMgPSByZXF1aXJlKCcuL3N0cmlwZXMnKTtcblxuXG52YXIgUmVuZGVyZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdSZW5kZXJlcicsXG4gICAgY3R4OiBudWxsLFxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVuZGVyUG9pbnRzKHRoaXMucHJvcHMpO1xuICAgIH0sXG5cbi8vICAgIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24gKHByb3BzKSB7XG4vLyAgICAgICAgdGhpcy5yZW5kZXJQb2ludHMocHJvcHMpO1xuLy8gICAgICAgIHJldHVybiBmYWxzZTtcbi8vICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcm9wcykge1xuICAgICAgICB3aW5kb3cuX2hhY2sgPSB3aW5kb3cuX2hhY2t8fHt9O1xuICAgICAgICB3aW5kb3cuX2hhY2suY2FudmFzID0gdGhpcy5nZXRET01Ob2RlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyUG9pbnRzKHRoaXMucHJvcHMpO1xuICAgIH0sXG5cbiAgICByZW5kZXJQb2ludHM6IGZ1bmN0aW9uIChwcm9wcykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gc3RyaXBlcyhwcm9wcy5sYXllcnMsIHRoaXMucHJvcHMuc2l6ZS54LCB0aGlzLnByb3BzLmJhY2tncm91bmRDb2xvcik7XG5cbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0RE9NTm9kZSgpLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgdmFyIHNpemU9IHRoaXMucHJvcHMuc2l6ZTtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdncmV5JztcbiAgICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIHNpemUueCwgc2l6ZS55KTtcblxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gcmVzdWx0W2ldO1xuICAgICAgICAgICAgY3R4LmZpbGxSZWN0KGksIDAsIDEsIHNpemUueSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4vLyAgICAgICAgcmV0dXJuIDxkaXY+aGVsbG88L2Rpdj5cbiAgICAgICAgcmV0dXJuICBSZWFjdC5ET00uY2FudmFzKCB7d2lkdGg6dGhpcy5wcm9wcy5zaXplLngsIGhlaWdodDp0aGlzLnByb3BzLnNpemUueX0pXG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cblxuXG52YXIgc3RyaXBlcyA9IHJlcXVpcmUoJy4vc3RyaXBlcycpO1xuXG5cbnZhciBSZW5kZXJlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1JlbmRlcmVyJyxcbiAgICBjdHg6IG51bGwsXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJQb2ludHModGhpcy5wcm9wcyk7XG4gICAgfSxcblxuLy8gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbiAocHJvcHMpIHtcbi8vICAgICAgICB0aGlzLnJlbmRlclBvaW50cyhwcm9wcyk7XG4vLyAgICAgICAgcmV0dXJuIGZhbHNlO1xuLy8gICAgfSxcblxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByb3BzKSB7XG4gICAgICAgIHRoaXMucmVuZGVyUG9pbnRzKHRoaXMucHJvcHMpO1xuICAgIH0sXG5cbiAgICByZW5kZXJQb2ludHM6IGZ1bmN0aW9uIChwcm9wcykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gcHJvcHMucmVzdWx0O1xuXG4gICAgICAgIHZhciBjYW52YXMgPSB0aGlzLmdldERPTU5vZGUoKTtcbiAgICAgICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBpZih0aGlzLnByb3BzLmhhY2spIHtcbiAgICAgICAgICAgIHdpbmRvd1t0aGlzLnByb3BzLmhhY2tdID0gY2FudmFzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNpemU9IHRoaXMucHJvcHMuc2l6ZTtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdwaW5rJztcbiAgICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIHJlc3VsdC5sZW5ndGgsIHByb3BzLmhlaWdodCk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSByZXN1bHRbaV07XG4gICAgICAgICAgICBjdHguZmlsbFJlY3QoaSwgMCwgMSwgcHJvcHMuaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICBSZWFjdC5ET00uY2FudmFzKCB7d2lkdGg6dGhpcy5wcm9wcy5yZXN1bHQubGVuZ3RoLCBoZWlnaHQ6dGhpcy5wcm9wcy5oZWlnaHR9KVxuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyOyIsInZhciBSbmQgPSB7fTtcblxuUm5kLmNvbG9yID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb2xvciA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDE2Nzc3MjE2KS50b1N0cmluZygxNik7XG4gICAgcmV0dXJuICcjMDAwMDAwJy5zbGljZSgwLCAtY29sb3IubGVuZ3RoKSArIGNvbG9yO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSbmQ7XG4iLCJ2YXIgUm5kID0gcmVxdWlyZSgnLi9ybmQnKTtcbnZhciBOYW1lR2VuID0gcmVxdWlyZSgnLi9uYW1lLWdlbicpO1xudmFyIExheWVyID0gcmVxdWlyZSgnLi9kYXRhL2xheWVyJyk7XG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL2RhdGEvcG9pbnQnKTtcblxudmFyIHN0cmlwZXMgPSByZXF1aXJlKCcuL3N0cmlwZXMnKTtcblxudmFyIGR1bW15ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6IE5hbWVHZW4uY29sb3JBbmltYWwoKSxcbiAgICAgICAgc2l6ZToge1xuICAgICAgICAgICAgeDogODAwLFxuICAgICAgICAgICAgeTogMjAwXG4gICAgICAgIH0sXG4gICAgICAgIGVkaXRvclNpemU6IDMwMCxcbiAgICAgICAgc2VsZWN0SW5MYXllckVkaXRvcjogdHJ1ZSxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBSbmQuY29sb3IoKSxcbiAgICAgICAgbGF5ZXJEYXRhOiB7XG4gICAgICAgICAgICBzZWxlY3RlZDoxLFxuICAgICAgICAgICAgbGF5ZXJzOiBbXG4gICAgICAgICAgICAgICAgbmV3IExheWVyKFJuZC5jb2xvcigpLCBbXG4gICAgICAgICAgICAgICAgICAgIG5ldyBQb2ludChNYXRoLnJhbmRvbSgpLCBNYXRoLnJhbmRvbSgpKSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IFBvaW50KE1hdGgucmFuZG9tKCksIE1hdGgucmFuZG9tKCkpLFxuICAgICAgICAgICAgICAgICAgICBuZXcgUG9pbnQoTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSlcbiAgICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICAgICBuZXcgTGF5ZXIoUm5kLmNvbG9yKCksIFtcbiAgICAgICAgICAgICAgICAgICAgbmV3IFBvaW50KE1hdGgucmFuZG9tKCksIE1hdGgucmFuZG9tKCkpLFxuICAgICAgICAgICAgICAgICAgICBuZXcgUG9pbnQoTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSlcbiAgICAgICAgICAgICAgICBdKV1cbiAgICAgICAgfVxuICAgIH07XG59O1xuXG5cbnZhciBwcm9qZWN0UHJlZml4ID0gXCJyYW5kb20td2VhdmUtXCI7XG52YXIgc3RvcmFnZSA9IHtcbiAgICBzYXZlOiBmdW5jdGlvbiAoaWQsIGRhdGEpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHN0cmlwZXMoZGF0YS5sYXllckRhdGEubGF5ZXJzLCBkYXRhLnNpemUueCwgZGF0YS5iYWNrZ3JvdW5kQ29sb3IpO1xuICAgICAgICB2YXIgZGVzYyA9IHtcbiAgICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgICAgbmFtZTogZGF0YS5uYW1lLFxuICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0LFxuICAgICAgICAgICAgICAgIGxhc3RDaGFuZ2U6IERhdGUubm93KClcbiAgICAgICAgfTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLWRhdGEtXCIgKyBpZCwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItZGVzYy1cIiArIGlkLCBKU09OLnN0cmluZ2lmeShkZXNjKSk7XG4gICAgfSxcbiAgICBsb2FkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLWRhdGEtXCIgKyBpZCk7XG4gICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShpdGVtKTtcbiAgICAgICAgICAgICAgICBkYXRhLmJhY2tncm91bmRDb2xvciA9IGRhdGEuYmFja2dyb3VuZENvbG9yIHx8ICcjZmNmY2ZjJztcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRhdGEgPSBkdW1teSgpO1xuICAgICAgICB0aGlzLnNhdmUoaWQsIGRhdGEpO1xuICAgICAgICByZXR1cm4gIGRhdGE7XG4gICAgfSxcbiAgICBzYXZlV2lmOiBmdW5jdGlvbiAoZGVzYywgZGF0YSkge1xuICAgICAgICB2YXIgaWQgPSBkZXNjLmlkO1xuXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi13aWYtZGF0YS1cIiArIGlkLCBkYXRhKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLXdpZi1kZXNjLVwiICsgaWQsIEpTT04uc3RyaW5naWZ5KGRlc2MpKTtcblxuICAgIH0sXG4gICAgc2F2ZVdpZkRlc2M6IGZ1bmN0aW9uIChkZXNjKSB7XG4gICAgICAgIHZhciBpZCA9IGRlc2MuaWQ7XG4gICAgICAgIHZhciBjb3B5ID0gXy5jbG9uZShkZXNjKTtcbiAgICAgICAgZGVsZXRlIGNvcHkuZGF0YTtcblxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItd2lmLWRlc2MtXCIgKyBpZCwgSlNPTi5zdHJpbmdpZnkoZGVzYykpO1xuXG4gICAgfSxcbiAgICBsb2FkV2lmOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItd2lmLWRhdGEtXCIgKyBpZCk7XG4gICAgICAgIHZhciBkZXNjID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItd2lmLWRlc2MtXCIgKyBpZCkpO1xuICAgICAgICBkZXNjLmRhdGEgPSBkYXRhO1xuICAgICAgICByZXR1cm4gZGVzYztcbiAgICB9LFxuICAgIHJlbW92ZTogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHByb2plY3RQcmVmaXggKyBcIi1kYXRhLVwiICsgaWQsIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLWRlc2MtXCIgKyBpZCwgSlNPTi5zdHJpbmdpZnkoZGVzYykpO1xuICAgIH0sXG4gICAgbGlzdFByb2plY3RzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwcm9qZWN0cyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvY2FsU3RvcmFnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGxvY2FsU3RvcmFnZS5rZXkoaSk7XG4gICAgICAgICAgICBpZihrZXkuaW5kZXhPZihwcm9qZWN0UHJlZml4ICsgXCItZGVzYy1cIikgPT09IDApe1xuICAgICAgICAgICAgICAgIHZhciBkZXNjID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKVxuICAgICAgICAgICAgICAgIHByb2plY3RzLnB1c2goZGVzYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvamVjdHM7XG4gICAgfSxcbiAgICBsaXN0V2lmczogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgd2lmcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvY2FsU3RvcmFnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGxvY2FsU3RvcmFnZS5rZXkoaSk7XG4gICAgICAgICAgICBpZihrZXkuaW5kZXhPZihwcm9qZWN0UHJlZml4ICsgXCItd2lmLWRlc2MtXCIpID09PSAwKXtcbiAgICAgICAgICAgICAgICB2YXIgZGVzYyA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSlcbiAgICAgICAgICAgICAgICB3aWZzLnB1c2goZGVzYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd2lmcztcbiAgICB9LFxuXG4gICAgZ2V0T3BlblRhYjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbG9jYWxTdG9yYWdlLmdldEl0ZW0ocHJvamVjdFByZWZpeCArIFwiLW9wZW4tdGFiXCIpO1xuICAgIH0sXG4gICAgc2V0T3BlblRhYjogZnVuY3Rpb24gKHRhYikge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwcm9qZWN0UHJlZml4ICsgXCItb3Blbi10YWJcIiwgdGFiKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cz0gc3RvcmFnZTtcbiIsInZhciBNYXRoVXRpbHMgPSByZXF1aXJlKCcuL21hdGgtdXRpbHMnKTtcblxudmFyIHNlZWRSYW5kb20gPSBmdW5jdGlvbiAoc2VlZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gTWF0aC5zaW4oc2VlZCsrKSAqIDEwMDAwO1xuICAgICAgICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobGF5ZXJzLCBzaXplLCBiYWNrZ3JvdW5kKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIGZvciAodmFyIGYgPSAwOyBmIDwgc2l6ZTsgZisrKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGJhY2tncm91bmQgfHwgXCIjZmNmY2ZjXCIpO1xuICAgIH1cblxuICAgIHZhciBzY2FsZSA9IGZ1bmN0aW9uIChwKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBwLnggKiBzaXplLFxuICAgICAgICAgICAgeTogMSAtIHAueVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBmb3IgKHZhciBsaSA9IDA7IGxpIDwgbGF5ZXJzLmxlbmd0aDsgbGkrKykge1xuICAgICAgICB2YXIgbGF5ZXIgPSBsYXllcnNbbGldO1xuXG4gICAgICAgIHJuZCA9IHNlZWRSYW5kb20obGF5ZXIuc2VlZCB8fCBsaSsxKTtcbiAgICAgICAgdmFyIHBvaW50cyA9IGxheWVyLnBvaW50cztcblxuICAgICAgICB2YXIgemVybyA9IHt4OjAsIHk6MH07XG4gICAgICAgIHZhciBtYXggPSB7eDogc2l6ZS0xLCB5OjF9O1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHAxID0gc2NhbGUocG9pbnRzW2kgLSAxXSk7XG4gICAgICAgICAgICB2YXIgcDIgPSBzY2FsZShwb2ludHNbaV0pO1xuICAgICAgICAgICAgTWF0aFV0aWxzLmNvbnN0cmFpblBvaW50KHAxLCB6ZXJvLCBtYXgpO1xuICAgICAgICAgICAgTWF0aFV0aWxzLmNvbnN0cmFpblBvaW50KHAyLCB6ZXJvLCBtYXgpO1xuICAgICAgICAgICAgcDEueCA9IE1hdGguZmxvb3IocDEueCk7XG4gICAgICAgICAgICBwMi54ID0gTWF0aC5mbG9vcihwMi54KTtcblxuICAgICAgICAgICAgdmFyIG0gPSAocDIueSAtIHAxLnkpIC8gKHAyLnggLSBwMS54KTtcbiAgICAgICAgICAgIHZhciBiID0gcDEueSAtIG0gKiBwMS54O1xuXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gcDEueDsgaiA8PSBwMi54OyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcm5kVmFsID0gcm5kKCk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSBtICogaiArIGI7XG5cbiAgICAgICAgICAgICAgICBpZiAocm5kVmFsIDw9IHkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2pdID0gbGF5ZXIuY29sb3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG5mdW5jdGlvbiBjb21wb25lbnRUb0hleChjKSB7XG4gICAgdmFyIGhleCA9IGMudG9TdHJpbmcoMTYpO1xuICAgIHJldHVybiBoZXgubGVuZ3RoID09IDEgPyBcIjBcIiArIGhleCA6IGhleDtcbn1cblxuZnVuY3Rpb24gcmdiVG9IZXgociwgZywgYikge1xuICAgIHJldHVybiBcIiNcIiArIGNvbXBvbmVudFRvSGV4KHIpICsgY29tcG9uZW50VG9IZXgoZykgKyBjb21wb25lbnRUb0hleChiKTtcbn1cblxuXG5cbnZhciBSZW5kZXJlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1JlbmRlcmVyJyxcbiAgICBjdHg6IG51bGwsXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJBbmRFeHRyYWN0KHRoaXMucHJvcHMpO1xuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJBbmRFeHRyYWN0KHRoaXMucHJvcHMpO1xuICAgIH0sXG5cbiAgICBsYXN0VVJMOiBudWxsLFxuICAgIGxhc3RXaWR0aDogMCxcbiAgICBsYXN0SGVpZ2h0OiAwLFxuICAgIHJlbmRlckFuZEV4dHJhY3Q6IGZ1bmN0aW9uIChwcm9wcykge1xuICAgICAgICBpZih0aGlzLmxhc3RVUkwgIT0gcHJvcHMuaW1hZ2VVUkwgfHwgdGhpcy5sYXN0V2lkdGggIT0gcHJvcHMud2lkdGggfHwgdGhpcy5sYXN0SGVpZ2h0ICE9IHByb3BzLmhlaWdodCl7XG4gICAgICAgICAgICB0aGlzLmxhc3RVUkwgPSBwcm9wcy5pbWFnZVVSTDtcbiAgICAgICAgICAgIHRoaXMubGFzdFdpZHRoID0gcHJvcHMud2lkdGg7XG4gICAgICAgICAgICB0aGlzLmxhc3RIZWlnaHQgPSBwcm9wcy5oZWlnaHQ7XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5nZXRET01Ob2RlKCk7XG4gICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgICAgIGN0eC5jbGVhclJlY3QgKCAwICwgMCAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCApO1xuXG4gICAgICAgICAgICBpZighdGhpcy5wcm9wcy5pbWFnZVVSTClcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciBpbWFnZU9iaiA9IG5ldyBJbWFnZSgpO1xuXG4gICAgICAgICAgICBpbWFnZU9iai5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uSW1hZ2VXaWR0aChpbWFnZU9iai53aWR0aCk7XG4gICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWFnZU9iaiwgMCwgMCwgcHJvcHMud2lkdGgsIHByb3BzLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgdGhpcy5leHRyYWN0KHByb3BzLmhlaWdodC0xKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgaW1hZ2VPYmouc3JjID0gdGhpcy5wcm9wcy5pbWFnZVVSTDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBleHRyYWN0OiBmdW5jdGlvbiAoeSkge1xuICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5nZXRET01Ob2RlKCk7XG4gICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICAgICB2YXIgcHJvcHMgPSB0aGlzLnByb3BzO1xuICAgICAgICB2YXIgZGF0YSA9IGN0eC5nZXRJbWFnZURhdGEoMCwgeSwgcHJvcHMud2lkdGgsIDEpLmRhdGE7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgZm9yKHZhciB4ID0gMDsgeCA8IHByb3BzLndpZHRoOyB4KysgKXtcbiAgICAgICAgICAgIHZhciB4byA9IHgqNDtcbiAgICAgICAgICAgIHZhciBoZXggPSByZ2JUb0hleChkYXRhW3hvXSxkYXRhW3hvKzFdLGRhdGFbeG8rMl0pO1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goaGV4KTtcbiAgICAgICAgfVxuICAgICAgICBwcm9wcy5yZXN1bHRDaGFuZ2VkKHJlc3VsdCk7XG5cbiAgICB9LFxuXG4gICAgbW91c2VEb3duOiBmYWxzZSxcbiAgICBvbk1vdXNlRG93bjogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgICAgIGNvbnNvbGUubG9nKCdkb3duJyx0aGlzLm1vdXNlRG93bik7XG4gICAgfSxcbiAgICBvbk1vdXNlVXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgY29uc29sZS5sb2coJ3VwJyx0aGlzLm1vdXNlRG93bik7XG4gICAgfSxcblxuICAgIG9uTW91c2U6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdtb3VzZScsdGhpcy5tb3VzZURvd24pO1xuICAgICAgICBpZighdGhpcy5tb3VzZURvd24pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBjYW52YXMgPSB0aGlzLmdldERPTU5vZGUoKTtcblxuICAgICAgICB2YXIgdG9wID0gY2FudmFzLm9mZnNldFRvcDtcblxuICAgICAgICB0b3AgPSBlLnBhZ2VZIC0gdG9wO1xuICAgICAgICB0aGlzLmV4dHJhY3QodG9wKTtcbiAgICB9LFxuXG5cblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gIFJlYWN0LkRPTS5jYW52YXMoIHt3aWR0aDp0aGlzLnByb3BzLndpZHRoLCBoZWlnaHQ6dGhpcy5wcm9wcy5oZWlnaHQsIG9uTW91c2VNb3ZlOnRoaXMub25Nb3VzZSxcbiAgICAgICAgb25Nb3VzZURvd246dGhpcy5vbk1vdXNlRG93bixcbiAgICAgICAgb25Nb3VzZVVwOnRoaXMub25Nb3VzZVVwfVxuICAgICAgICApXG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZXN1bHRSZW5kZXJlciA9IHJlcXVpcmUoJy4vLi4vcmVzdWx0LXJlbmRlcmVyLmpzJyk7XG52YXIgRXh0cmFjdG9yID0gcmVxdWlyZSgnLi9waXhlbC1leHRyYWN0b3IuanMnKTtcbnZhciBJY29uID0gcmVxdWlyZSgnLi4vYm9vdHN0cmFwL2ljb24nKTtcbnZhciBEZWxheWVkSW5wdXQgPSByZXF1aXJlKCcuLi9kZWxheWVkLWlucHV0Jyk7XG52YXIgSWNvbkJ1dHRvbiA9IHJlcXVpcmUoJy4uL2Jvb3RzdHJhcC9pY29uLWJ1dHRvbicpO1xuXG52YXIgVXBsb2FkRm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1VwbG9hZEZvcm0nLFxuICAgIG9uU3VibWl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG4gICAgICAgIHJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICAgIGlmKGV2dC50YXJnZXQuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBhbGVydCgnRXJyb3Igd2hpbGUgcmVhZGluZyBmaWxlJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaWxlY29udGVudCA9IGV2dC50YXJnZXQucmVzdWx0O1xuXG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uTG9hZChldnQudGFyZ2V0LnJlc3VsdClcblxuXG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCh0aGlzLnJlZnMuZmlsZS5nZXRET01Ob2RlKCkuZmlsZXNbMF0pO1xuICAgIH0sXG5cbiAgICBjbGlja0ZpbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZWZzLmZpbGUuZ2V0RE9NTm9kZSgpLmNsaWNrKCk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc3R5bGU9e2NvbG9yOid3aGl0ZSd9O1xuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmZvcm0oIHtvblN1Ym1pdDp0aGlzLm9uU3VibWl0fSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uaDQobnVsbCwgXCJMb2FkIGltYWdlXCIpLFxuXG4gICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwiZmlsZVwiLCByZWY6XCJmaWxlXCIsIGNsYXNzTmFtZTpcIndoaXRlLWZpbGVcIiwgc3R5bGU6c3R5bGV9ICksUmVhY3QuRE9NLmJyKG51bGwpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcImJ0biBidG4tZGVmYXVsdFwifSwgSWNvbigge2ljb246XCJmbG9wcHktb3BlblwifSksIFwiIExvYWRcIilcbiAgICAgICAgKVxuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiBoZXhUb1JnYihoZXgpIHtcbiAgICB2YXIgcmVzdWx0ID0gL14jPyhbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KSQvaS5leGVjKGhleCk7XG4gICAgcmV0dXJuIHJlc3VsdCA/IHtcbiAgICAgICAgcjogcGFyc2VJbnQocmVzdWx0WzFdLCAxNiksXG4gICAgICAgIGc6IHBhcnNlSW50KHJlc3VsdFsyXSwgMTYpLFxuICAgICAgICBiOiBwYXJzZUludChyZXN1bHRbM10sIDE2KVxuICAgIH0gOiBudWxsO1xufVxuXG5mdW5jdGlvbiBoZXhUb1JnYlN0cihoZXgpIHtcbiAgICB2YXIgcmVzdWx0ID0gaGV4VG9SZ2IoaGV4KTtcbiAgICByZXR1cm4gcmVzdWx0P1tyZXN1bHQucixyZXN1bHQuZyxyZXN1bHQuYl0uam9pbihcIixcIik6bnVsbFxufVxuXG52YXIgVGV4dFJlc3VsdERpc3BsYXkgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUZXh0UmVzdWx0RGlzcGxheScsXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb2xvcnNBcnJheSA9IFtdO1xuXG4gICAgICAgIHZhciBjb2xvcnNUZXh0ID0gIFwiW0NPTE9SU11cXG5cIiArIHRoaXMucHJvcHMucmVzdWx0Lm1hcChmdW5jdGlvbiAociwgaSkge1xuICAgICAgICAgICAgdmFyIG5yID0gY29sb3JzQXJyYXkuaW5kZXhPZihyKTtcbiAgICAgICAgICAgIGlmKG5yIDwgMCl7XG4gICAgICAgICAgICAgICAgY29sb3JzQXJyYXkucHVzaChyKTtcbiAgICAgICAgICAgICAgICBuciA9IGNvbG9yc0FycmF5Lmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gKGkgKyAxKSArIFwiPVwiICsgKG5yICsgMSk7XG5cbiAgICAgICAgfSkuam9pbihcIlxcblwiKTtcbiAgICAgICAgLy90ZXh0ICs9IEpTT04uc3RyaW5naWZ5KHRoaXMucHJvcHMucmVzdWx0KTtcblxuICAgICAgICB2YXIgdGFibGVUZXh0ID0gXCJbQ09MT1IgVEFCTEVdXFxuXCIgKyBjb2xvcnNBcnJheS5tYXAoZnVuY3Rpb24gKGMsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGkgKyAxKSArIFwiPVwiICsgaGV4VG9SZ2JTdHIoYyk7XG4gICAgICAgICAgICB9KS5qb2luKFwiXFxuXCIpO1xuXG4gICAgICAgIHJldHVybiBSZWFjdC5ET00udGV4dGFyZWEoIHtjb2w6XCIxMDBcIiwgcm93czp0aGlzLnByb3BzLnJlc3VsdC5sZW5ndGggKyBjb2xvcnNBcnJheS5sZW5ndGggKyA0LCB2YWx1ZTp0YWJsZVRleHQgKyBcIlxcblxcblwiICtjb2xvcnNUZXh0fSlcbiAgICB9XG59KTtcblxuXG52YXIgU3RyaXBpZmllciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1N0cmlwaWZpZXInLFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7cmVzdWx0OiBbXSwgaW1hZ2VVUkw6IG51bGwsIHdpZHRoOiA4MDAsIGhlaWdodDogMjAwLCBvdXRwdXQ6IDIwMH07XG4gICAgfSxcblxuICAgIHJlc3VsdENoYW5nZWQ6IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cmVzdWx0OiByZXN1bHR9KTtcbiAgICB9LFxuICAgIG9uSW1hZ2VMb2FkOiBmdW5jdGlvbiAoaW1hZ2VVUkwpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aW1hZ2VVUkw6IGltYWdlVVJMfSk7XG4gICAgfSxcblxuICAgIG9uV2lkdGhDaGFuZ2U6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3dpZHRoOiB2fSk7XG4gICAgfSxcblxuICAgIG9uSGVpZ2h0Q2hhbmdlOiBmdW5jdGlvbiAodikge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtoZWlnaHQ6IHZ9KTtcbiAgICB9LFxuXG4gICAgb25PdXRIZWlnaHRDaGFuZ2U6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe291dHB1dDogdn0pO1xuICAgIH0sXG5cbiAgICBzYXZlSW1hZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgcG9tLnNldEF0dHJpYnV0ZSgnaHJlZicsIHdpbmRvdy5faGFja19zdHJpcC50b0RhdGFVUkwoJ2ltYWdlL3BuZycpKTtcbiAgICAgICAgcG9tLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCBcInN0cmlwaWZpZXJfaW1hZ2UucG5nXCIpO1xuICAgICAgICBwb20uY2xpY2soKTtcbiAgICB9LFxuXG4gICAgaW1hZ2VXaWR0aENoYW5nZWQ6IGZ1bmN0aW9uICh3aWR0aCkge1xuICAgICAgICB0aGlzLm9uV2lkdGhDaGFuZ2Uod2lkdGgpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGlucHV0U3R5bGUgPSB7d2lkdGg6IDMwMH07XG5cbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb250YWluZXItZmx1aWRcIn0sIFxuICAgICAgICAgICAgVXBsb2FkRm9ybSgge29uTG9hZDp0aGlzLm9uSW1hZ2VMb2FkfSksXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXAgaC1zcGFjZWRcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5oNChudWxsLCBcIldpZHRoXCIpLFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXBcIiwgc3R5bGU6aW5wdXRTdHlsZX0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgRGVsYXllZElucHV0KCB7dHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIsICB2YWx1ZTp0aGlzLnN0YXRlLndpZHRoLCBvbkNoYW5nZTp0aGlzLm9uV2lkdGhDaGFuZ2V9ICksXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwLWFkZG9uXCJ9LCBcInhcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICBEZWxheWVkSW5wdXQoIHt0eXBlOlwidGV4dFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiwgdmFsdWU6dGhpcy5zdGF0ZS5oZWlnaHQsIG9uQ2hhbmdlOnRoaXMub25IZWlnaHRDaGFuZ2V9ICksXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwLWFkZG9uXCJ9LCBcIm91dHB1dFwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIERlbGF5ZWRJbnB1dCgge3R5cGU6XCJ0ZXh0XCIsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1zbVwiLCAgdmFsdWU6dGhpcy5zdGF0ZS5vdXRwdXQsIG9uQ2hhbmdlOnRoaXMub25PdXRIZWlnaHRDaGFuZ2V9IClcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICksXG5cbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgICAgICAgICAgRXh0cmFjdG9yKCB7d2lkdGg6dGhpcy5zdGF0ZS53aWR0aCwgaGVpZ2h0OnRoaXMuc3RhdGUuaGVpZ2h0LCBpbWFnZVVSTDp0aGlzLnN0YXRlLmltYWdlVVJMLCByZXN1bHRDaGFuZ2VkOnRoaXMucmVzdWx0Q2hhbmdlZCwgb25JbWFnZVdpZHRoOnRoaXMuaW1hZ2VXaWR0aENoYW5nZWR9KVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIFJlc3VsdFJlbmRlcmVyKCB7cmVzdWx0OnRoaXMuc3RhdGUucmVzdWx0LCBoZWlnaHQ6dGhpcy5zdGF0ZS5vdXRwdXQsIGhhY2s6XCJfaGFja19zdHJpcFwifSksXG5cbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgICAgICAgICAgSWNvbkJ1dHRvbigge2ljb246XCJwaWN0dXJlXCIsIHRpdGxlOlwiU2F2ZVwiLCBjbGFzc05hbWU6XCJkb3dubG9hZC1idXR0b25cIiwgb25DbGljazp0aGlzLnNhdmVJbWFnZX0pLFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5icihudWxsKSxcbiAgICAgICAgICAgICAgICBJY29uQnV0dG9uKCB7aWNvbjpcImxpc3RcIiwgdGl0bGU6XCJDb2xvciBkYXRhXCIsIGNsYXNzTmFtZTpcImRvd25sb2FkLWJ1dHRvblwiLCBvbkNsaWNrOnRoaXMuc2hvd0RhdGF9KVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIFRleHRSZXN1bHREaXNwbGF5KCB7cmVzdWx0OnRoaXMuc3RhdGUucmVzdWx0fSApXG4gICAgICAgIClcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJpcGlmaWVyO1xuXG5cbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge3dpZkRhdGE6e319O1xuICAgIH0sXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7d2lmRGF0YTogc3RvcmFnZS5sb2FkV2lmKHRoaXMucHJvcHMuaWQpfSk7XG4gICAgfSxcbiAgICBvbk5hbWVDaGFuZ2U6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBjb3B5ID0gXy5jbG9uZSh0aGlzLnN0YXRlLndpZkRhdGEpO1xuICAgICAgICBjb3B5Lm5hbWUgPSBlLnRhcmdldC52YWx1ZTtcbiAgICAgICAgc3RvcmFnZS5zYXZlV2lmRGVzYyhjb3B5KTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7d2lmRGF0YTogY29weX0pO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29udGFpbmVyLWZsdWlkXCJ9LCBSZWFjdC5ET00uaDEobnVsbCwgdGhpcy5zdGF0ZS53aWZEYXRhLm5hbWUpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7dmFsdWU6dGhpcy5zdGF0ZS53aWZEYXRhLm5hbWUsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1zbVwiLCBvbkNoYW5nZTp0aGlzLm9uTmFtZUNoYW5nZX0gKSxSZWFjdC5ET00uYnIobnVsbCksIFJlYWN0LkRPTS5wcmUobnVsbCwgdGhpcy5zdGF0ZS53aWZEYXRhLmRhdGEpKTtcbiAgICB9XG59KTtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgSWNvbiA9IHJlcXVpcmUoJy4vYm9vdHN0cmFwL2ljb24nKTtcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XG5cblxudmFyIFVwbG9hZFdpZkZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdVcGxvYWRXaWZGb3JtJyxcbiAgICBvblN1Ym1pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgdmFyIG5hbWU7XG5cbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgICAgaWYoZXZ0LnRhcmdldC5yZWFkeVN0YXRlICE9IDIpIHJldHVybjtcbiAgICAgICAgICAgIGlmKGV2dC50YXJnZXQuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBhbGVydCgnRXJyb3Igd2hpbGUgcmVhZGluZyBmaWxlJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaWxlY29udGVudCA9IGV2dC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgdmFyIG5ld0lkID0gXCJcIiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwMDApO1xuXG4gICAgICAgICAgICBzdG9yYWdlLnNhdmVXaWYoe2lkOiBuZXdJZCwgbmFtZTogbmFtZX0sIGZpbGVjb250ZW50KTtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25VcGxvYWQoKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHZhciBmaWxlID0gdGhpcy5yZWZzLmZpbGUuZ2V0RE9NTm9kZSgpLmZpbGVzWzBdO1xuICAgICAgICBuYW1lID0gZmlsZS5uYW1lLnJlcGxhY2UoXCIud2lmXCIsXCJcIik7XG4gICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuICAgIH0sXG5cbiAgICBjbGlja0ZpbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZWZzLmZpbGUuZ2V0RE9NTm9kZSgpLmNsaWNrKCk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc3R5bGU9e2NvbG9yOid3aGl0ZSd9O1xuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmZvcm0oIHtvblN1Ym1pdDp0aGlzLm9uU3VibWl0fSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uaDQobnVsbCwgXCJJbXBvcnQgV2lmXCIpLFxuXG4gICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwiZmlsZVwiLCByZWY6XCJmaWxlXCIsIGNsYXNzTmFtZTpcIndoaXRlLWZpbGVcIiwgc3R5bGU6c3R5bGV9ICksUmVhY3QuRE9NLmJyKG51bGwpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcImJ0biBidG4tZGVmYXVsdFwifSwgSWNvbigge2ljb246XCJib29rXCJ9KSwgXCIgSW1wb3J0XCIpXG4gICAgICAgIClcbiAgICB9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHsgICAgICAgICAgICB3aWZzOiBbXVxuICAgICAgICB9XG4gICAgfSxcbiAgICByZWZyZXNoV2lmOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3dpZnM6IHN0b3JhZ2UubGlzdFdpZnMoKX0pO1xuICAgIH0sXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICB0aGlzLnJlZnJlc2hXaWYoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB3aWZzID0gdGhpcy5zdGF0ZS53aWZzO1xuXG4gICAgICAgIHZhciB3aWZWaWV3cyA9IHdpZnMubWFwKGZ1bmN0aW9uICh3aWYpIHtcblxuXG4gICAgICAgICAgICBmdW5jdGlvbiBtYWtlTGluayhpbm5lcil7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5hKCB7aHJlZjonIycgKyByb3V0aWUubG9va3VwKCd3aWYnLCB7aWQ6IHdpZi5pZH0pfSwgaW5uZXIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAoUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uaDQobnVsbCwgbWFrZUxpbmsod2lmLm5hbWUpKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29udGFpbmVyLWZsdWlkXCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMSgge2NsYXNzTmFtZTpcInBhZ2UtaGVhZGVyIHBhZ2UtaGVhZGVyLW1haW5cIn0sIFwiSW1wb3J0ZWQgV2lmc1wiKSxcbiAgICAgICAgICAgIHdpZlZpZXdzLFxuICAgICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxuICAgICAgICAgICAgVXBsb2FkV2lmRm9ybSgge29uVXBsb2FkOnRoaXMucmVmcmVzaFdpZn0pXG4gICAgICAgIClcblxuICAgIH1cblxuXG59KTtcbiJdfQ==
