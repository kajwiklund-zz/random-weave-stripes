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



var Stripifier = React.createClass({

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
                <Extractor width={this.state.width} height={this.state.height} imageURL={this.state.imageURL} resultChanged={this.resultChanged}/>
            </div>
            <ResultRenderer result={this.state.result} height={this.state.output} hack="_hack_strip"/>
            <div>
                <IconButton icon="picture" title="Save" className="download-button" onClick={this.saveImage}/>
            </div>
        </div>
    }
});

module.exports = Stripifier;


