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
