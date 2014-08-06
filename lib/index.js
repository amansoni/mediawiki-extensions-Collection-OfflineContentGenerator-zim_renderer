// Convert bundles to directories of HTML files, which zimwriterfs can slurp.
// ---------------------------------------------------------------------
"use strict";

require('es6-shim');
require('prfun');

var json = require('../package.json');

var domino = require('domino');
var fs = require('fs');
var path = require('path');
var stream = require('stream');
var tmp = require('tmp');
tmp.setGracefulCleanup();

// node 0.8 compatibility
if (!stream.Writable) {
	stream = require('readable-stream');
}

var Db = require('./db');
var DomUtil = require('./domutil');
var P = require('./p');
var Polyglossia = require('./polyglossia');
var StatusReporter = require('./status');



// Return a promise for an exit status (0 for success) after the bundle
// specified in the options has been converted.
var convert = function(options) {
	var status = options.status = new StatusReporter(2, function(msg) {
		if (options.log && options.output) {
			var file = msg.file ? (': ' + msg.file) : '';
			options.log('['+msg.percent.toFixed()+'%]', msg.status + file);
		}
	});
	var metabook, builddir;
	return Promise.resolve().then(function() {
		// unpack the bundle
		return unpackBundle(options);
	}).then(function(args) {
		metabook = args.metabook;
		builddir = args.builddir;
	}).then(function() {
		// generate the plaintext
		return generateOutput(metabook, builddir, options);
	}).then(function() {
		status.createStage(0, 'Done');
		return 0; // success!
	}, function(err) {
		// xxx clean up?
		if (options.debug) {
			throw err;
		}
		// xxx send this error to parent process?
		console.error('Error:', err);
		return 1;
	});
};

module.exports = {
	name: json.name, // package name
	version: json.version, // version # for this package
	convert: convert
};
