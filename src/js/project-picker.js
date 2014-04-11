/** @jsx React.DOM */


var Application = require('./application');
var ResultRenderer = require('./result-renderer');
var WifEditor = require('./wif-editor');
var WifList = require('./wif-list');
var Icon = require('./bootstrap/icon');
var storage = require('./storage');


var NavBar =React.createClass({
    render: function () {
        var proActive = this.props.page == 'projects'?'active':'';
        var wifActive = this.props.page == 'wifs'?'active':'';
        return <nav className="navbar navbar-default" role="navigation">
            <div className="container-fluid">
                <div className="navbar-header">
                    <a className="navbar-brand" href="#"><Icon icon="fire"/>
                    Random Weave Stripes</a>
                </div>

                <ul className="nav navbar-nav">
                    <li className={proActive}><a href="#projects">Projects</a></li>
                </ul>
                <ul className="nav navbar-nav">
                    <li className={wifActive}><a href="#wifs">Wifs</a></li>
                </ul>
            </div>
        </nav>
    }
});


var UploadForm = React.createClass({
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
        return <form onSubmit={this.onSubmit}>
                    <h4>Import Project</h4>

                    <input type="file" ref="file" className="white-file" style={style} /><br/>
                    <button className="btn btn-default"><Icon icon="floppy-open"/> Import</button>
               </form>
    }
});




/**
 * Created by kajwi_000 on 2014-04-07.
 */
var ProjectPicker = React.createClass({


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
            page = <Application id={this.state.id}/>
        }
        else if (this.state.page == 'wif') {
            page = <WifEditor id={this.state.id}/>
        }
        else if (this.state.page == 'wifs') {
            page = <WifList/>
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
                    preview = <ResultRenderer result={project.result} height="20"/>;
                }

                function makeLink(inner){
                    return <a href={'#' + routie.lookup('project', {id: project.id})}>{inner}</a>
                }

                return (<div>
                    <h4>{makeLink(project.name)}</h4>
                        {makeLink(preview)}
                </div>
                    );
            }.bind(this));





            page = <div className="container-fluid">
                <h1 className="page-header page-header-main">Saved projects</h1>
                {projectViews}
                <hr/>
                    <a className="btn btn-default" onClick={this.createNew}><Icon icon="plus"/> New Project</a>
                    <br/><br/>
                    <UploadForm/>
            </div>
        }

        return <div><NavBar page={this.state.pageGroup}/>{page}</div>
    }
});

module.exports = ProjectPicker;