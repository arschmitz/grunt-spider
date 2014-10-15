/*
 * grunt-spider
 * https://github.com/arschmitz/grunt-spider
 *
 * Copyright (c) 2014 Alexander Schmitz
 * Licensed under the MIT license.
 */

'use strict';

var path = require( "path" );

module.exports = function(grunt) {

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	grunt.registerMultiTask('spider', 'A tool to spider a website and check for any broken links resources load errors or script errors', function() {
	// Merge task-specific and/or target-specific options with these defaults.
		var casperOptions = {},
			options = this.options({
			url: "http://localhost",
			ignore: "",
			script: true,
			resource: true,
			links: true,
			casper : {
				test: true,
				verbose : true,
				"log-level": "error",
				parallel: false
			}});

		options.casper.args = [ "--url=" + options.url , "--ignore=" + options.ignore ];

		grunt.config( "casper." + this.target, {
			"options": options.casper,
			src: [ "tasks/lib/spider.js" ]
		});
		grunt.task.run([ "casper:" + this.target ]);
	});

};
