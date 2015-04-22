/** @jsx React.DOM */

var ResultRenderer = require('./../result-renderer.js');
var Extractor = require('./pixel-extractor.js');
var Icon = require('../bootstrap/icon');
var DelayedInput = require('../delayed-input');
var IconButton = require('../bootstrap/icon-button');

var UploadForm = React.createClass({
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
        return <form onSubmit={this.onSubmit}>
            <h4>Load image</h4>

            <input type="file" ref="file" className="white-file" style={style} /><br/>
            <button className="btn btn-default"><Icon icon="floppy-open"/> Load</button>
        </form>
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

var TextResultDisplay = React.createClass({
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

        return <textarea col="100" rows={this.props.result.length + colorsArray.length + 4} value={tableText + "\n\n" +colorsText}/>
    }
});


var Stripifier = React.createClass({

    getInitialState: function () {
        return {result: [], imageURL: null, width: 800, height: 200, output: 200};
    },

    resultChanged: function (result) {
        this.setState({result: result});
    },
    onImageLoad: function (imageURL) {
        this.setState({imageURL: imageURL, widthReceived: false});
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
        if(!this.state.widthReceived){
            this.setState({widthReceived: true});
            this.onWidthChange(width);
        }
    },

    render: function () {
        var inputStyle = {width: 300};

        return <div className="container-fluid">
            <UploadForm onLoad={this.onImageLoad}/>
                <div className="form-group h-spaced">
                <h4>Width</h4>
                    <div className="input-group" style={inputStyle}>
                        <DelayedInput type="text" className="form-control input-sm"  value={this.state.width} onChange={this.onWidthChange} />
                        <span className="input-group-addon">x</span>
                        <DelayedInput type="text" className="form-control input-sm" value={this.state.height} onChange={this.onHeightChange} />
                        <span className="input-group-addon">output</span>
                        <DelayedInput type="text" className="form-control input-sm"  value={this.state.output} onChange={this.onOutHeightChange} />
                    </div>
                </div>

            <div>
                <Extractor width={this.state.width} height={this.state.height} imageURL={this.state.imageURL} resultChanged={this.resultChanged} onImageWidth={this.imageWidthChanged}/>
            </div>
            <ResultRenderer result={this.state.result} height={this.state.output} hack="_hack_strip"/>

            <div>
                <IconButton icon="picture" title="Save" className="download-button" onClick={this.saveImage}/>
                <br/>
                <IconButton icon="list" title="Color data" className="download-button" onClick={this.showData}/>
            </div>
            <TextResultDisplay result={this.state.result} />
        </div>
    }
});

module.exports = Stripifier;


