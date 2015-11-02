'use strict';

var util = require('util');

var Store = require('express-session').Store;
var Etcd = require('node-etcd');
var Async = require('async');

var debug = require('debug')('etcd:session:store');

/**
 * A session store in memory.
 * @public
 */
function EtcdStore(options) {
	debug('call EtcdStore: ' + util.inspect(options));

  Store.call(this);
  this.sessions = Object.create(null);
  this.etcd = this.createBackend(options);
  this.keyPrefix = '/sessions/';
}


/**
 * Inherit from Store.
 */
util.inherits(EtcdStore, Store);

/**
 * Get all active sessions.
 *
 * @param {function} callback
 * @public
 */
EtcdStore.prototype.all = function all(callback) {
	debug('all.');

  this.etcd.get(this.keyPrefix, function(err, result) {
    if (!!err) {
      callback(err);
    } else {

			var sessions = [];

			var parse = function (node, next) {
				var session = JSON.parse(node);
				sessions.push(session);
				next();
			};

			Async.each(result.node.nodes, parse, callback);
    }
  });
}

/**
 * Clear all sessions.
 *
 * @param {function} callback
 * @public
 */
EtcdStore.prototype.clear = function clear(callback) {
	debug('clear TDB');

	callback(null);
}

/**
 * Destroy the session associated with the given session ID.
 *
 * @param {string} sessionId
 * @public
 */
EtcdStore.prototype.destroy = function destroy(sessionId, callback) {
	debug('destroy: ' + sessionId);

  var sessionKey = this.keyPrefix + sessionId;

  this.etcd.del(sessionKey, callback);
}

/**
 * Fetch session by the given session ID.
 *
 * @param {string} sessionId
 * @param {function} callback
 * @public
 */
EtcdStore.prototype.get = function get(sessionId, callback) {
	debug('get: ' + sessionId);
	if (!sessionId) {
		return callback(new Error('no session id given'));
	}

  var key = this.keyPrefix + sessionId;
  this.etcd.get(key, function(err, result) {

    if (!!err) {
			debug('err get session for sessionId=' + sessionId + '; err=' + util.inspect(err));
      callback(err);
    } else {
    	debug('get: ' + util.inspect(result));

      var session = JSON.parse(result.node.value);
      callback(null, session);
    }
  });
}

/**
 * Get number of active sessions.
 *
 * @param {function} callback
 * @public
 */
EtcdStore.prototype.length = function length(callback) {
	debug('length');

  this.etcd.get(this.keyPrefix, function(err, result) {
    if (!!(err)) {
      callback(err);
    } else {
      var length =  result.node.nodes.length;

			debug('length -> callback(null, ' + length + ')')
      callback(null, length);
    }
  });
}

/**
 * [set description]
 * @param {[type]}   sessionId [description]
 * @param {[type]}   session   [description]
 * @param {Function} callback  [description]
 */
EtcdStore.prototype.set = function set(sessionId, session, callback) {
	debug('set: sessionId=' + sessionId + '; session=' + util.inspect(session));

  var key = this.keyPrefix + sessionId;
	var value = JSON.stringify(session);

	debug('prepared set: key=' + key + '; value=' + value );
  this.etcd.set(key, value, function(err) {

		debug('set callback: err=' + err);
    callback(err);
  });
}

/**
 * Touch the given session object associated with the given session ID.
 *
 * @param {string} sessionId
 * @param {object} session
 * @param {function} callback
 * @public
 */
EtcdStore.prototype.touch = function touch(sessionId, session, callback) {
	debug('touch: sessionId=' + sessionId + '; session=' + util.inspect(session));
  this.set(sessionId, session, callback);
}

/**
 * [createBackend description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 * @private
 */
EtcdStore.prototype.createBackend = function createBackend(options) {
	return new Etcd(options.hosts);
}

/**
 * Module exports.
 */
module.exports = EtcdStore;
