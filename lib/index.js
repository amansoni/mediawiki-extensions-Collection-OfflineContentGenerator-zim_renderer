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
var StatusReporter = require('./status');

var BUNDLE_DIR = 'bundle';
var OUTPUT_DIR = 'output';
var STYLE_DIR = path.join(OUTPUT_DIR, 's');
var MEDIA_DIR = path.join(OUTPUT_DIR, 'm');
var JS_DIR    = path.join(OUTPUT_DIR, 'j');

// ---------------------------------------------------------------------
// Bundle and file processing

// return a promise for the builddir and control file contents
// (after the bundle has been unpacked)
var unpackBundle = function(options) {
	var metabook, builddir, status = options.status;

	status.createStage(0, 'Unpacking content bundle');

	// first create a temporary directory
	return P.call(tmp.dir, tmp, {
		prefix: json.name,
		unsafeCleanup: !(options.debug)
	}).then(function(_builddir) {
		builddir = _builddir;
		// make bundle and output subdirs
		return Promise.join(
			P.call(fs.mkdir, fs, path.join(builddir, BUNDLE_DIR)),
			P.call(fs.mkdir, fs, path.join(builddir, OUTPUT_DIR))
		);
	}).then(function() {
		var bundledir = path.join(builddir, BUNDLE_DIR);
		return Promise.join(
			// make zimwriter subdirs for static files
			P.call(fs.mkdir, fs, path.join(builddir, STYLE_DIR)),
			P.call(fs.mkdir, fs, path.join(builddir, MEDIA_DIR)),
			P.call(fs.mkdir, fs, path.join(builddir, JS_DIR)),
			// unpack the zip archive
			P.spawn('unzip', [ path.resolve( options.bundle ) ], {
				cwd: bundledir
			})
		);
	}).then(function() {
		// now read in the main metabook.json file
		return P.call(
			fs.readFile, fs, path.join(builddir, BUNDLE_DIR, 'metabook.json')
		).then(function(data) {
			metabook = JSON.parse(data);
		});
	}).then(function() {
		return Object.create(options, {
			metabook: metabook,
			builddir: builddir,
			bundledir: path.join(builddir, BUNDLE_DIR),
			styledir: path.join(builddir, STYLE_DIR),
			mediadir: path.join(builddir, MEDIA_DIR),
			jsdir: path.join(builddir, JS_DIR)
		});
	});
};

var saveJavascript = function(options) {
	// XXX
};
var saveStylesheet = function(options) {
	// XXX
};
var saveFavicon = function(options) {
	// XXX
};

var startProcess = function(options) {
	return unpackBundle(options).
		tap(saveJavascript).
		tap(saveStylesheet).
		tap(saveFavicon);
};

// count total # of items (used for status reporting)
var countItems = function(item) {
	return (item.items || []).reduce(function(sum, item) {
		return sum + countItems(item);
	}, 1);
};




// Return a promise which resolves with no value after the bundle
// specified in the options has been converted.  The promise is
// rejected if there is a problem converting the bundle.
var convert = function(options) {
	var status = options.status = new StatusReporter(2, function(msg) {
		if (options.log && options.output) {
			var file = msg.file ? (': ' + msg.file) : '';
			options.log('['+msg.percent.toFixed()+'%]', msg.message + file);
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
		return; // success!
	}, function(err) {
		// xxx clean up?
		// XXX use different values to distinguish failure types?
		if (!err.exitCode) {
			err.exitCode = 1;
		}
		throw err;
	});
};

module.exports = {
	name: json.name, // package name
	version: json.version, // version # for this package
	convert: convert
};
