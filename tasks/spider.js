/*
 * grunt-spider
 * https://github.com/arschmitz/grunt-spider
 *
 * Copyright (c) 2014-2015 Alexander Schmitz
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	grunt.registerMultiTask( "spider", 'A tool to spider a website and check for any broken links resources load errors or script errors', function() {

		var spider = require( "spider.js" ),
			done = this.async();

		spider( this.options(), done );
	});

};
