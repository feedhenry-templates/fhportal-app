// Generated on 2014-03-05 using generator-angular 0.7.1
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt); // Load grunt tasks automatically
    require('time-grunt')(grunt); // Time how long tasks take. Can help when optimizing build times

    var path = require('path');

    var global_appConfig = { // global set of settings for use with serve manipulation
        app: 'www_dev',
        bower_components: 'www_dev/components',
        dist: 'www',
        url: '',
        default_local_server_url: 'http://localhost:8001'
    }
    // Define the configuration for all the tasks
    grunt.initConfig({
        // configurable paths
        appConfig: global_appConfig,

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            js: {
                files: ['<%= appConfig.app %>/scripts/{,*/}*.js'],
                tasks: ['newer:jshint:all'],
                options: {
                    livereload: 35730
                }
            },
            styles: {
                files: ['<%= appConfig.app %>/styles/{,*/}*.css'],
                tasks: ['newer:copy:styles']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= appConfig.app %>/{,*/}*.html',
                    '.tmp/styles/{,*/}*.css',
                    '<%= appConfig.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ]
            }
        },


        clean: {
            options: {
                force: true
            },
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= appConfig.dist %>/*',
                        '!<%= appConfig.dist %>/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },

        requirejs: {
            compile: {
                options: {
                    removeCombined: true,
                    baseUrl: "<%= appConfig.app %>/js",
                    mainConfigFile: "<%= appConfig.app %>/js/initialize.js",
                    dir: "<%= appConfig.dist %>/js",
                    modules: [{
                        name: "initialize"
                    }]
                }
            }
        },

        'bower-install': { // Looks at what bower has installed and includes it automagically in index.html
            app: {
                directory: '<%= appConfig.app %>/',
                html: '<%= appConfig.app %>/index.html',
                ignorePath: '<%= appConfig.app %>/'
            }
        },

        useminPrepare: {
            options: {
                dest: '<%= appConfig.dist %>'
            },
            html: '<%= appConfig.app %>/index.html'
        },
        usemin: {
            options: {
                dirs: ['<%= appConfig.dist %>']
            },
            html: ['<%= appConfig.dist %>/{,*/}*.html'],
            css: ['<%= appConfig.dist %>/css/{,*/}*.css']
        },
        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= appConfig.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= appConfig.dist %>/images'
                }]
            }
        },
        svgmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= appConfig.app %>/images',
                    src: '{,*/}*.svg',
                    dest: '<%= appConfig.dist %>/images'
                }]
            }
        },
        htmlmin: {
            dist: {
                options: {

                },
                files: [{
                    expand: true,
                    cwd: '<%= appConfig.app %>',
                    src: '*.html',
                    dest: '<%= appConfig.dist %>'
                }]
            }
        },

        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= appConfig.app %>',
                    dest: '<%= appConfig.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        'fhconfig.json',
                        'images/{,*/}*.{webp,gif}',
                        'fonts/{,*/}*.*',
                        'app_backbone/**'
                    ]
                }]
            },
            styles: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= appConfig.app %>/components/font-awesome/font/',
                    dest: '<%= appConfig.app %>/fonts/',
                    src: ['*']
                }, {
                    expand: true,
                    dot: true,
                    cwd: '<%= appConfig.app %>/components/bootstrap/fonts/',
                    dest: '<%= appConfig.app %>/fonts/',
                    src: ['*']
                }, {
                    expand: true,
                    dot: true,
                    cwd: '<%= appConfig.app %>/css',
                    dest: '.tmp/css/',
                    src: '{,*/}*.css'
                }]
            }
        },
        concurrent: {
            server: [
                'copy:styles'
            ],
            test: [
                'copy:styles'
            ],
            dist: [
                'copy:styles',
                'imagemin',
                'svgmin',
                'htmlmin'
            ]
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9002,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35730
            },
            livereload: {
                options: {
                    open: {
                        target: '<%= appConfig.url %>'
                    },
                    base: [
                        '.tmp',
                        '<%= appConfig.app %>'
                    ]
                }
            }
        }
    });

    grunt.registerTask('serve', function(target) {
        if (target === 'local_dev') {
            var conn = 'http://' + grunt.config.get('connect.options.hostname') + ':' +
                grunt.config.get('connect.options.port');
            var url = grunt.option('url') || grunt.config.get('appConfig.default_local_server_url');
            grunt.config.set('appConfig.url', conn + '/?url=' + url);
        } else if (target === 'local') {
            var conn = 'http://' + grunt.config.get('connect.options.hostname') + ':' +
                grunt.config.get('connect.options.port');
            var url = grunt.option('url') || grunt.config.get('appConfig.default_local_server_url');
            grunt.config.set('appConfig.app', global_appConfig.dist);
        } else {
            // open with no url passed to fh-js-sdk
            grunt.config.set('connect.livereload.options.open', true);
        }

        grunt.task.run([
            'clean:server',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('build', [
        'clean:dist',
        'requirejs',
        'bower-install',
        'useminPrepare',
        'cssmin',
        'concat',
        'uglify',
        'concurrent:dist',
        'copy:dist',
        'usemin'
    ]);

    grunt.registerTask('default', ['serve']);
};