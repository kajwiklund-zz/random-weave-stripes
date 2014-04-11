/** @jsx React.DOM */

var Icon = require('./bootstrap/icon');
var storage = require('./storage');


var UploadWifForm = React.createClass({
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
        return <form onSubmit={this.onSubmit}>
            <h4>Import Wif</h4>

            <input type="file" ref="file" className="white-file" style={style} /><br/>
            <button className="btn btn-default"><Icon icon="book"/> Import</button>
        </form>
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
                return <a href={'#' + routie.lookup('wif', {id: wif.id})}>{inner}</a>
            }

            return (<div>
                <h4>{makeLink(wif.name)}</h4>
            </div>
                );
        }.bind(this));
        return <div className="container-fluid">
            <h1 className="page-header page-header-main">Imported Wifs</h1>
            {wifViews}
            <hr/>
            <UploadWifForm onUpload={this.refreshWif}/>
        </div>

    }


});
