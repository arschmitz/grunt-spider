/*
 * grunt-spider
 * https://github.com/arschmitz/grunt-spider
 *
 * Copyright (c) 2014-2015 Alexander Schmitz
 * Licensed under the MIT license.
 */

'use strict';
module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/*.js'
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tests: ['tmp']
		},

		// Configuration to be run (and then tested).
		spider: {
			"dev" : {
				options: {
					url:  "http://jquery-ui.10.0.1.29.xip.io/demos/",
					ignore: ""
				}
			},
			"stage" : {
				options: {
					url:  "http://stage.jqueryui.com/",
					ignore: "broken|trash"
				}
			},
			"production" : {
				options: {
					url:  "http://api.jqueryui.com/"
				}
			}
		}

	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');
	// grunt plugins
	require( "load-grunt-tasks" )( grunt );
	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-casper');

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'spider']);

};
