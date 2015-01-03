/*global casper: false, __utils__: false */
		var bound = false,
			url = casper.cli.get( "url" ) || "http://localhost/",
			ignore = casper.cli.get( "ignore" ) || " ",
			extensionBlacklist = casper.cli.get( "extensionBlacklist" ) || ".jpg|.gif|.png|.svg|.jpeg|.JPG|.JPEG|.js|.css|.zip",
			links = [],
			linkObject = {},
			externalLinks = [],
			errors = [],
			current = 0,
			ignorecount = 0,
			notFound = [],
			resources = [],
			utils = require('utils'),
			mouse = require("mouse").create(casper),
			httpCodes = [ "400", "401", "403", "404", "301", "303", "305", "306", "308" ];

		casper.options.viewportSize = {
			width: 1024,
			height: 768
		};

		links[ 0 ] = url;

		casper.options.pageSettings.resourceTimeout = 20000;
		function checkInternal( link ) {
			return link.search( url ) !== -1;
		}
		function checkIgnore( link ) {
			return new RegExp( ignore ).test( link );
		}
		function checkExtensionBlacklist( link ) {
			return new RegExp( extensionBlacklist ).test( link );
		}
		function deadLink( link, code ) {
			var message = {
				file: link,
				code: code
			};
			notFound.push( message );
			if( !linkObject[ link ] ) {
				var redirect = [
					"Redirected from...",
					links[ current ],
					"Which is linked from..."
				];
				linkObject[ link ] = redirect.concat( linkObject[ links[ current ] ] );
			}
			casper.echo( "file: " + link + " is " + code , "WARNING" );
		}
		function bindEvents(){
			casper.on( "page.error", function(msg, trace) {
				if ( checkInternal( this.getCurrentUrl() ) ) {
					var message = {};
					if( trace[0] !== undefined ) {
						message = {
							msg: "Error:    " + msg,
							url: "url:      " +  links[ current ],
							file: "file:     " + trace[0].file,
							line: "line:     " + trace[0].line,
							functionCall: "function: " + trace[0]["function"]
						};
						this.echo( message.msg, "ERROR" );
						this.echo( message.file, "WARNING" );
						this.echo( message.url, "WARNING" );
						this.echo( message.line, "WARNING" );
						this.echo( message.functionCall, "WARNING" );
					} else {
						message = {
							msg: "Error:    " + msg,
							file: "Not Available",
							url: "url:      " +  links[ current ],
							line: "Not Available",
							functionCall: "Not Available"
						};
						this.echo( "No Trace Available" + trace );
					}
					errors.push( message );
				}
			});

			casper.on( "page.resource.recieved", function( response ){
				console.log( response );
			});
			httpCodes.forEach(function( value ){
				// Check the status code make sure its not an error code
				casper.on('http.status.' + value, function( resource ) {
					deadLink( resource.url, value );
				});
			});

			// Check for resource errors on internal pages
			casper.on( "resource.error", function( error ) {

				// if the error is operation canceled ignore it phantom has issues...
				if( error.errorCode !== 5 && checkInternal( links[ current ] ) ){
					error.requestedBy = links[ current ];
					this.echo( error.errorString, "WARNING" );
					this.echo( error.requestedBy + " not found", "WARNING" );
					resources.push( error );
				}
			});
			// stop crawl if there's an internal error this is an error in casper not the page
			casper.on('error', function(msg, backtrace) {
				this.log('INTERNAL ERROR: ' + msg, 'ERROR' );
				this.log('BACKTRACE:' + backtrace, 'WARNING');
				this.die('Crawl stopped because of errors.');
			});
		}
		function checkPage( i ){
			if( !checkIgnore( links[ i ] ) && links[ i ] !== links[ i - 1 ] ) {
				current = i;
				casper.open( links[ i ] ).then(function( response ){
					var that = this;
					function findLinks() {
						var newLinks = that.evaluate( function(){
							var links = [];
							jQuery( "a").each(function(){
								var href = jQuery( this )[0].href;
								if( jQuery.inArray( href, links) === -1 ){
									links.push( href );
								}
							});
							return links;
						});

						if( newLinks && newLinks.length > 0 ) {
							newLinks.forEach(function( value, index ){
								if( !linkObject[ value ] ) {
									linkObject[ value ] = [];
								}
								linkObject[ value ].push( links[ i ] );
								if( links.indexOf( value ) === -1 ){
									links.splice( i + 1, 0, value );
								}
							});
						}
						if ( i < links.length - 1 ) {
							checkPage( i + 1 );
						}
					}
					if( checkInternal( links[ i ] ) ){
						console.log( "Internal Page: " + links[ i ] );
						var hasjquery = this.evaluate(function() {
							return ( typeof jQuery !== "undefined" );
						});
						if( hasjquery ){
							findLinks();
						} else if ( casper.page.injectJs( 'node_modules/jquery/dist/jquery.min.js' ) ) {
							findLinks();
						}
					} else {
						console.log( "External Page: " + links[ i ] );
						if ( i < links.length - 1 ) {
							checkPage( i + 1 );
						}
					}
				});
			} else if ( i < links.length - 1 ) {
				checkPage( i + 1 );
			}
		}
		casper.test.begin("Go Go Spidey Crawl!", function suite( test ){
			casper.start( links[0],function(){
				bindEvents();
				checkPage( 0 );
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
		casper.test.begin( "There are no dead links", 1, function suite( test ) {
			casper.run(function(){
				if (notFound.length > 0) {
					this.echo(notFound.length + ' unique dead links found', "WARNING");
					var that = this,
						count = 0;
					notFound.forEach( function( value, index ){
						that.echo( value.file + " is " + value.code + " on ...", "WARNING" );
						var currentCount = 0;

						count += linkObject[ value.file ].length;
						linkObject[ value.file ].some( function( page ){
							currentCount++;
							that.echo( page.substring( 0, 100 ), "DEBUG" );
							if ( currentCount > 9 ) {
								return true;
							}
						});
					});
					this.echo( count + " Total Dead Links", "WARNING" );
				} else {
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