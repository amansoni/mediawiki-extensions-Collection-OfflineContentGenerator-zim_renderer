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

// Helper: hard link a directory, recursively.
var cprl = function(from, to) {
	return P.call(fs.mkdir, fs, to).then(function() {
		return P.call(fs.readdir, fs, from);
	}).map(function(file) {
		var pathfrom = path.join(from, file);
		var pathto   = path.join(to,   file);
		return P.call(fs.lstat, fs, pathfrom).then(function(stats) {
			if (stats.isFile()) {
				return P.call(fs.link, fs, pathfrom, pathto);
			}
			if (stats.isDirectory()) {
				return cprl(pathfrom, pathto);
			}
			// ignore other file types (symlink, block device, etc)
		});
	});
};

// Step 1a: unpack a bundle, and return a promise for the builddir.
var unpackBundle = function(options) {
	var status = options.status;

	status.createStage(0, 'Unpacking content bundle');

	// first create a temporary directory
	return P.call(tmp.dir, tmp, {
		prefix: json.name,
		dir: options.tmpdir,
		unsafeCleanup: !(options.debug)
	}).tap(function(builddir) {
		// make bundle and output subdirs
		return Promise.join(
			P.call(fs.mkdir, fs, path.join(builddir, BUNDLE_DIR)),
			P.call(fs.mkdir, fs, path.join(builddir, OUTPUT_DIR))
		);
	}).tap(function(builddir) {
		// now unpack the zip archive
		var bundledir = path.join(builddir, 'bundle');
		return P.spawn('unzip', [ '-q', path.resolve( options.bundle ) ], {
			cwd: bundledir
		});
	});
};

// Step 1b: we were given a bundle directory.  Create a tmpdir and then
// hard link the bundle directory into it.  Be sure your TMPDIR is
// on the same filesystem as the provided bundle directory if you
// want this to be fast.
var hardlinkBundle = function(options) {
	var status = options.status;

	status.createStage(0, 'Creating work space');
	// first create a temporary directory
	return P.call(tmp.dir, tmp, {
		prefix: json.name,
		dir: options.tmpdir,
		unsafeCleanup: !(options.debug)
	}).tap(function(builddir) {
		// make output subdir
		return Promise.join(
			// make zimfs subdir
			P.call(fs.mkdir, fs, path.join(builddir, OUTPUT_DIR)),
			// hardlink bundledir into 'bundle'
			cprl(path.resolve( options.bundle ), path.join(builddir, BUNDLE_DIR)).
				catch(function(e) {
					// slightly helpful diagnostics
					if (e.code === 'EXDEV') {
						throw new Error(
							"TMPDIR must be on same filesystem as bundle dir"
						);
					}
					throw e;
				})
		);
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
	options = Object.create(options); // don't mutate the object we're given.
	var status = options.status = new StatusReporter(2, function(msg) {
		if (options.log && options.output) {
			var file = msg.file ? (': ' + msg.file) : '';
			options.log('['+msg.percent.toFixed()+'%]', msg.message + file);
		}
	});
	return Promise.resolve().then(function() {
		// were we given a zip file or a directory?
		return P.call(fs.stat, fs, options.bundle);
	}).then(function(stat) {
		if (stat.isDirectory()) {
			// create a workspace and hard link the provided directory
			return hardlinkBundle(options);
		} else {
			// unpack the bundle
			return unpackBundle(options);
		}
	}).then(function(builddir) {
		options.builddir = builddir;

		// some derived paths, for convenience
		options.bundledir = path.join(builddir, BUNDLE_DIR);
		options.outputdir = path.join(builddir, OUTPUT_DIR);
		options.styledir = path.join(builddir, STYLE_DIR);
		options.mediadir = path.join(builddir, MEDIA_DIR);
		options.jsdir = path.join(builddir, JS_DIR);

		return Promise.join(
			// make zimwriter subdirs for static files
			P.call(fs.mkdir, fs, options.styledir),
			P.call(fs.mkdir, fs, options.mediadir),
			P.call(fs.mkdir, fs, options.jsdir),
			// read the main metabook.json file
			P.call(fs.readFile, fs,
				   path.join(options.bundledir, 'metabook.json'),
				   { encoding: 'utf8' }).then(function(data) {
					   options.metabook = JSON.parse(data);
				   })
		);
	}).then(function() {
		// XXX generate the zim directory
	}).then(function() {
		// XXX run zimwriterfs
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
