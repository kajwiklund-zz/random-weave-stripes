/** @jsx React.DOM */


var Application = require('./application');
var ResultRenderer = require('./result-renderer');
var storage = require('./storage');

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
                        <h3>{makeLink(project.name)}</h3>
                        {makeLink(preview)}
                </div>
            );
        }.bind(this));


        if (this.state.currentId) {
            return <Application id={this.state.currentId}/>;
        }
        else {

            return <div>
                <h1>Random Weave Projects</h1>
                {projectViews}
                <hr/><a onClick={this.createNew}>New Project</a>
            </div>
        }
    }
});

module.exports = ProjectPicker;