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
                <hr/><a className="btn btn-default" onClick={this.createNew}>New Project</a>
            </div>
        }

        return <div><NavBar/>{page}</div>
    }
});

module.exports = ProjectPicker;