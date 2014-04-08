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
