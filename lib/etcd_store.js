'use strict';

var util = require('util');

var Store = require('express-session').Store;
var Etcd = require('node-etcd');

var debug = require('debug')('etcd:session:store');

/**
 * Module exports.
 */

module.exports = EtcdStore;

/**
 * A session store in memory.
 * @public
 */

function EtcdStore(options) {
	debug('call EtcdStore: ' + util.inspect(options));

  Store.call(this);
  this.sessions = Object.create(null);
  this.etcd = new Etcd(options.hosts);
  this.keyPrefix = options.keyPrefix || '/sessions/';
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

  this.etcd.get(this.keyPrefix, function(err, results) {
    if (!!err) {
      callback(err);
    } else {
      callback(null, results.node.nodes);
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
	debug('clear');

  this.sessions = Object.create(null);
  callback && defer(callback);
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

  var key = this.keyPrefix + sessionId;
  this.etcd.get(key, function(err, result) {
    debug('get: ' + util.inspect(result));

    if (!!err) {
      callback(err);
    } else {
      var session = result.node.value;
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

EtcdStore.prototype.set = function set(sessionId, session, callback) {
	debug('set: sessionId=' + sessionId + '; session=' + util.inspect(session));

  //var value = JSON.stringify(session);
  var key = this.keyPrefix + sessionId;

  this.etcd.set(key, session, function(err) {

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
