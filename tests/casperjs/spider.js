/*global casper: false, __utils__: false */
		var url = casper.cli.get( "url" ) || "http://localhost/",
			links = [],
			pageLinks = [],
			errors = [],
			ignorecount = 0,
			notFound = [],
			resources = [],
			mouse = require("mouse").create(casper);

		casper.options.viewportSize = {
			width: 1024,
			height: 768
		};

		console.log( "spooky" );

		links[ 0 ] = url;

		casper.options.pageSettings.resourceTimeout = 20000;

		casper.on("page.error", function(msg, trace) {
			var message = {};
			if( trace[0] !== undefined ) {
				message = {
					msg: "Error:    " + msg,
					url: "url:      " + casper.getGlobal('location').href,
					file: "file:     " + trace[0].file,
					line: "line:     " + trace[0].line,
					functionCall: "function: " + trace[0]["function"]
				};
				this.echo( message.msg, "ERROR" );
				this.echo( message.file, "WARNING" );
				this.echo( message.line, "WARNING" );
				this.echo( message.functionCall, "WARNING" );
			} else {
				message = {
					msg: "Error:    " + msg,
					file: "Not Available",
					url: "url:      " + casper.getGlobal('location').href,
					line: "Not Available",
					functionCall: "Not Available"
				};
				this.echo( "No Trace Available" + trace );
			}
			errors.push( message );
		});
		// if console message exists
		casper.on('http.status.404', function( resource ) {
			var message = {
				url: casper.getGlobal('location').href,
				msg: resource.url + ' is 404'
			};
			notFound.push( message );
			this.echo( "file: " + resource.url + ' is 404', "WARNING" );
			this.echo( resource.url + ' is 404', "WARNING" );
		});
		casper.on( "page.resource.timeout", function(){
			console.log( "timeout" );
			this.die();
		});
		casper.on( "resource.error", function( error ) {
			error.requestedBy = casper.getGlobal('location').href;
			this.echo( error.errorString, "WARNING" );
			this.echo( error.requestedBy + " not found", "WARNING" );
			if( error.errorCode !== 5 ){
				resources.push( error );
			}
		});
		// stop crawl if there's an internal error
		casper.on('error', function(msg, backtrace) {
			this.log('INTERNAL ERROR: ' + msg, 'ERROR' );
			this.log('BACKTRACE:' + backtrace, 'WARNING');
			this.die('Crawl stopped because of errors.');
		});
		function checkPage( i, test ){
			casper.open( links[ i ] ).then(function(){
				function findLinks() {
					var newLinks = that.evaluate( function(){
						var links = [];
						$( "a").each(function(){
							var href = $( this )[0].href;

							if( $.inArray( href, links) === -1 && /localhost/.test( href ) &&
							!/notapage/.test( href ) ){
								links.push( href );
							}
						});
						return links;
					});
					if( newLinks && newLinks.length > 0 ) {
						newLinks.forEach(function( value, index ){
							if( links.indexOf( value ) === -1 ){
								links.splice( i + 1, 0, value );
							}
						});
					}
					if ( i < links.length - 1 ) {
						checkPage( i + 1, test );
					}
				}
				console.log( links[ i ] );
				var that = this;
				if( /backbone-require\.html/.test( links[ i ] ) ) {
					casper.waitForSelector( ".ui-listview", findLinks );
				} else if( !/ignore/.test( links[ i ] ) ) {
					findLinks();
				} else {
					ignorecount++;
					checkPage( i + 1, test );
				}
				test.assertHttpStatus( 200 );
			});
		}
		casper.test.begin("spider the demos", function suite( test ){
			casper.start( links[0],function(){
				checkPage( 0, test );
			});
			casper.run(function(){
				test.done();
			});
		});

		casper.test.begin( "There are no errors or warnings", 1, function suite( test ) {
			casper.run(function(){
				if (errors.length > 0) {
					var that = this;
					this.echo(errors.length + ' Javascript errors found', "WARNING");
					errors.forEach(function( value, index ){
						that.echo( value.msg, "ERROR" );
						that.echo( value.file, "WARNING" );
						that.echo( value.url, "WARNING" );
						that.echo( value.line, "WARNING" );
						that.echo( value.functionCall, "WARNING" );
					});
				} else {
					this.echo(errors.length + ' Javascript errors found', "INFO");
				}
				test.assert( errors.length === 0, "No JS errors found" );
				test.done();
			});
		});
		casper.test.begin( "There are no 404 links", 1, function suite( test ) {
			casper.run(function(){
				if (notFound.length > 0) {
					this.echo(notFound.length + ' 404 links found', "WARNING");
					var that = this
					notFound.forEach( function( value, index ){
						that.echo( value.msg + " on " + value.url );
					});
				} else {
					this.echo( "ignore count: " + ignorecount, "WARNING" );
					this.echo(notFound.length + " 404's found", "INFO");
				}
				test.assert( notFound.length === 0, "No 404's found" );
				test.done();
			});
		});
		casper.test.begin( "All resources load properly", 1, function suite( test ) {
			casper.run(function(){
				if (resources.length > 0) {
					this.echo(resources.length + ' resource errors found', "WARNING");
					var that = this;
					resources.forEach( function( value, index ){
						that.echo( "ERROR: " + value.errorCode + " - " +
							value.errorString, "WARNING" );
						that.echo( "ERROR: " + value.url + " requested by " + value.requestedBy );
					});
				} else {
					this.echo(resources.length + " resource errors found", "INFO");
				}
				this.echo( links.length + " links found", "ERROR" );
				test.assert( resources.length === 0, "All resources loaded" );
				test.done();
			});
		});