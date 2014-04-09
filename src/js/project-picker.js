/** @jsx React.DOM */


var Application = require('./application');
var ResultRenderer = require('./result-renderer');
var Icon = require('./bootstrap/icon');
var storage = require('./storage');


var NavBar =React.createClass({
    render: function () {
        return <nav className="navbar navbar-default" role="navigation">
            <div className="container-fluid">
                <div className="navbar-header">
                    <a className="navbar-brand" href="#"><Icon icon="fire"/>
                    Random Weave Stripes</a>
                </div>

                <ul className="nav navbar-nav">
                    <li className="active"><a href="#">Projects</a></li>
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
        return <form>
                    <button className="btn btn-default" onClick={this.clickFile}><Icon icon="floppy-open"/> Import Project</button>
                    <input type="file" ref="file" onChange={this.onSubmit} className="hidden"/>
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

        var page;

        if (this.state.currentId) {
            page = <Application id={this.state.currentId}/>
        }
        else {
            page = <div className="container-fluid">
                <h1 className="page-header page-header-main">Saved projects</h1>
                {projectViews}
                <hr/>

                    <a className="btn btn-default" onClick={this.createNew}><Icon icon="plus"/> New Project</a>
                    <br/><br/>
                    <UploadForm/>

            </div>
        }

        return <div><NavBar/>{page}</div>
    }
});

module.exports = ProjectPicker;