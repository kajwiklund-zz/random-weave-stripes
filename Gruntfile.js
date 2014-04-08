// todo: dist tasks are untested because I don't care about that yet.

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        connect: {
          dev: {
            options: {
              port: 9000,
              livereload: true,
              base: 'development',
              open: 'http://localhost:9000'
            }
          }
        },

        browserify: {
            options: {
                transform: ['reactify']
            },
            dev: {
                options: {
                    debug: true
                },
                files: {
                    'development/js/<%= pkg.name %>.js': ['src/js/index.js']
                }
            },
            dist: {
                files: {
                    'dist/js/<%= pkg.name %>.js': ['src/js/index.js']
                }
            }
        },

        copy: {
            dev: {
                files: [
                    {src: ['src/test.html'], dest: 'development/test.html'},
                    {src: ['bower_components/routie/dist/routie.min.js'], dest: 'development/js/vendor/routie.min.js'},
                    {src: ['bower_components/react/react-with-addons.js'], dest: 'development/js/vendor/react-with-addons.js'},
                    {src: ['bower_components/lodash/dist/lodash.min.js'], dest: 'development/js/vendor/lodash.min.js'},
                    {expand:true, cwd: 'bower_components/bootstrap/fonts/', src: ['*'], dest: 'development/style/vendor/bootstrap/fonts/'},
                ]
            },
            dist: {
                files: [
                    {src: ['bower_components/director/build/director.min.js'], dest: './dist/js/vendor/director.min.js'},
                    {src: ['bower_components/react/react-with-addons.min.js'], dest: './dist/js/vendor/react-with-addons.min.js'},
                    {src: ['bower_components/lodash/dist/lodash.min.js'], dest: './dist/js/vendor/lowdash.min.js'},
                ]
            }
        },


        less: {
            dev: {
                options: {
                    compress: true,
                    yuicompress: true,
                    optimization: 2
                },
                files: {
                    // target.css file: source.less file
                    "development/style/main.css": "src/themes/main.less"
                }
            }
        },

        replace: {
            dev: {
                options: {
                    patterns: [
                        {
                            match: 'pkg_name',
                            replacement: '<%= pkg.name %>'
                        }
                    ]
                },
                files: [
                    {expand: true, flatten: true, src: ['src/index.html'], dest: './development'}
                ]
            },
            dist: {
                options: {
                    patterns: [
                        {
                            match: 'pkg_name',
                            replacement: '<%= pkg.name %>.min'
                        }
                    ]
                },
                files: [
                    {expand: true, flatten: true, src: ['src/index.html'], dest: './dist'}
                ]
            }
        },

        clean: {
            dev: ["development"],
            dist: ["dist"]
        },

        asciify: {
            // fonts; http://www.figlet.org/examples.html
            appname: {
                text: 'Random Weave Stripes'
            },
            options:{
                font:'puffy',
                log: false
            }
        },

        uglify: {
            options: {
                // the banner is inserted at the top of the output
                banner: '/*!\n <%= asciify_appname %> \n*/\n'
            },
            dist: {
                files: {
                  'dist/js/<%= pkg.name %>.min.js': ['dist/js/<%= pkg.name %>.js']
                }
            }
        },

        watch: {
            options: {
              livereload: true
            },
            files: [ "src/**/*.js", 'src/*.html'],
            tasks: [ 'devBuild' ]
        }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('devBuild', [
    'copy:dev',
    'replace:dev',
    'browserify:dev',
//    'asciify',
  ]);

  grunt.registerTask('dev', [
    'clean:dev',
    'less:dev',
    'devBuild',
    'connect:dev',
    'watch'
  ]);

  grunt.registerTask('dist', [
    'clean:dist',
    'copy:dist',
    'replace:dist',
    'browserify:dist',
    'asciify'
  ]);

  grunt.registerTask('default', [
    'dev'
    ]);
};
