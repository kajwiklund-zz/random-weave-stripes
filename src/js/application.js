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


var KindInput = React.createClass({
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

        return this.transferPropsTo(<input value={this.state.value} onChange={this.onChange} style={style} onBlur={this.onBlur}/>);
    }
});

var ProjectDownloads = React.createClass({
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
            return <option value={wif.id}>{wif.name}</option>
        });
        var selected = this.state.selectedWif || first;

        return <div>
            <div className="row">
                    <h4>Downloads</h4>
            </div>
            <div className="row">
                <IconButton icon="floppy-save" title="Project" className="download-button" onClick={this.saveProject}/>
                <IconButton icon="picture" title="Image" className="download-button" onClick={this.saveImage}/>
                <h4>Select wif</h4>
                <select value={selected} className="form-control h-spaced" onChange={this.changeWif}>
                    {wifOpts}
                </select>
                <IconButton icon="random" title="Modify and Download" className="download-button" onClick={this.saveModifiedWif.bind(this, selected)} />
            </div>
        </div>;
    }
});


var ProjectSizes = React.createClass({
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
        return  <div className="row"><div className="form-group h-spaced">
                    <h4>Sizes</h4>
                    <div className="input-group">
                        <KindInput id={id} type="text" className="form-control input-sm"  value={this.props.size.x} onChange={this.onWidthChange} />
                        <span className="input-group-addon">x</span>
                        <KindInput type="text" className="form-control input-sm" value={this.props.size.y} onChange={this.onHeightChange} />
                        <span className="input-group-addon">edit</span>
                        <KindInput type="text" className="form-control input-sm"  value={this.props.editorSize} onChange={this.props.onEditorSizeChange} />
                    </div>
                </div>
        </div>;

    }
});


var InspectorBox = React.createClass({
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
            tabData = <div>
                <div className="row">
                <form role="form">
                    <div className="form-group">
                        <h4 for="layerColor">Background color</h4>
                        <div className="input-group">
                            <input id="layerColor" type="text" className="form-control input-sm" value={this.props.appState.backgroundColor} onChange={this.onColorChange}/>
                            <span className="input-group-btn">
                                <button className="btn btn-default input-sm" type="button" onClick={this.onRandomColor}><span className="glyphicon glyphicon glyphicon-fire"></span></button>
                            </span>
                        </div>
                    </div>
                </form>
            </div>
            <LayerList layerData={appState.layerData} size={appState.size} onChange={this.props.onLayerDataChange}/>
            </div>

        }
        else{
            tabData = <div>
                <ProjectSizes size={appState.size}
                editorSize={appState.editorSize}
                onSizeChanged={this.props.onSizeChanged}
                onEditorSizeChange={this.props.onEditorSizeChange}/>
                <ProjectDownloads appState={appState}/>
            </div>;
        }


        return <div className="inspectorBox container-fluid">
            <div className="row">
            <ul className="nav nav-tabs">
                <li className={tab=='project' && 'active'}><a onClick={this.changeTab.bind(this, 'project')}>Project</a></li>
                <li className={tab=='colors' && 'active'}><a onClick={this.changeTab.bind(this, 'colors')}>Colors</a></li>

            </ul>
            </div>
            {tabData}
        </div>
    }
});


var Application = React.createClass({
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
        var nameComponent = <span onClick={this.showNameEditor.bind(this, true)}>{this.state.name}</span>
        if(this.state.editName){
            nameComponent = <input className="form-control input-sm" valueLink={this.linkState('name')} ref="nameEditor" onBlur={this.showNameEditor.bind(this, false)} />
        }

        return <div className="container-fluid">
            <h1 className="page-header page-header-main">{nameComponent}</h1>

            <InspectorBox appState={this.state}
            onLayerDataChange={this.onLayerDataChange}
            onSizeChanged={this.changeSize}
            onEditorSizeChange={this.onEditorSizeChange}
            onBackgroundColorChange={this.onBackgroundColorChange}
            />

            <div className="stripesAreaBox">
                <div>
                    <Renderer layers={this.state.layerData.layers} size={this.state.size} backgroundColor={this.state.backgroundColor}></Renderer>
                </div>
                <LayerLinesEditor canSelect={this.state.selectInLayerEditor} layerData={this.state.layerData} onChange={this.onLayerDataChange} size={editorSize} />
                <br/>
                <input type="checkbox" checkedLink={this.linkState('selectInLayerEditor')}/>
                Allow Select
                <br/><br/>
                <div className="well">
                    Shift+Click to add points
                    <br/>
                    Ctrl+Click to remove points
                </div>
            </div>
            <div className="clear-fix alert alert-warning"><strong>Warning!</strong> This is a work in progress thing. Don't expect anything to work and your data might disapear at any moment!</div>
        </div>
    }
});


module.exports = Application;
