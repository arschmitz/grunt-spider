/*
 * grunt-spider
 * https://github.com/arschmitz/grunt-spider
 *
 * Copyright (c) 2014-2015 Alexander Schmitz
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

	// grunt plugins
	require( "load-grunt-tasks" )( grunt );

	// Project configuration.
	grunt.initConfig({
		jshint: {
			all: [
				"Gruntfile.js",
				"tasks/*.js"
			],
			options: {
				jshintrc: ".jshintrc"
			}
		},

		// Configuration to be run (and then tested).
		spider: {
			"dev" : {
				options: {
					url:  "http://jquery-ui.10.0.1.29.xip.io/demos/",
					output: "./log.txt",
					ignore: "",
					verbose: true
				}
			},
			"stage" : {
				options: {
					url:  "http://stage.jqueryui.com/",
					ignore: "broken|trash",
					verbose: true
				}
			},
			"production" : {
				options: {
					url:  "http://api.jqueryui.com/"
				}
			}
		}

	});

	// Actually load this plugin"s task(s).
	grunt.loadTasks("tasks");

	// By default, lint and run all tests.
	grunt.registerTask("default", [ "jshint", "spider" ]);

};
