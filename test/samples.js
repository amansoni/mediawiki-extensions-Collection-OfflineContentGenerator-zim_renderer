/* global describe, it */
'use strict';
require('core-js/shim');
var Promise = require('../lib/promise.js');

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var zimwriter = require('../');

// Ensure that we don't crash on any of our sample inputs.
describe('Basic crash test', function() {
	['tao.zip', 'us.zip'].forEach(function(bundle) {
		describe(bundle, function() {
			it('should compile to ZIM', function() {
				this.timeout(0);
				var filename = path.join(__dirname, '..', 'samples', bundle);
				return zimwriter.convert({
					bundle: filename,
					output: filename + '.zim',
					log: function() { /* Suppress logging. */ },
				}).then(function(statusCode) {
					assert.equal(statusCode, 0);
				}).finally(function() {
					try {
						fs.unlinkSync(filename + '.zim');
					} catch (e) { }
				});
			});
		});
	});
});
