/**
 * grain.js v0.3.1
 * Copyright (c) 2014 Kyohei Ito
 * License: MIT (http://www.opensource.org/licenses/mit-license)
 * GitHub: https://github.com/KyoheiG3/grain
 */
(function() {
	'use strict';

	var KGrain = {
		mixin: 'mixin',
		define: 'define',
		require: 'require'
	};
	var load = false;
	var standby = [];
	var defines = {};
	var grainObject = {
		mixin: {},
		define: {},
		require: {}
	};
	var waitObject = {
		mixin: [],
		define: [],
		require: []
	};

	var loadError = function(key, level) {
		var fn = 'log';
		var warn = 'info';
		if (level === 1) {
			fn = 'warn';
			warn = 'warning';
		} else if (level === 2) {
			fn = 'error';
			warn = 'error';
		}

		waitObject[key].forEach(function(obj) {
			console[fn]('[' + warn + '][' + key + ']: "' + (obj.key || 'Grain') + '" did fail load. (values "' + obj.value.slice() + '")');
		});
	};

	/**
	 * Return after being converted into camel case variables separated by "/"
	 * @param  {String} str Path string
	 * @return {String}
	 */
	var proper = function(str) {
		return str.split('/').reduce(function(left, right) {
			return left + right.replace(/^./, function($1) {
				return $1.toUpperCase();
			});
		});
	};

	/**
	 * Merging object
	 * @param  {Object} source Source object
	 * @param  {Object} overwrite Overwrite object
	 * @return {Object}
	 */
	var merge = function(source, overwrite) {
		var dest = copy(source);
		for (var name in overwrite) {
			if (overwrite.hasOwnProperty(name)) {
				if (overwrite[name] !== undefined) {
					dest[name] = overwrite[name];
				}
			}
		}
		return dest;
	};

	/**
	 * Copy of the object
	 * @return {object}
	 */
	var copy = function(source) {
		if (source instanceof Object) {
			var O = function() {};
			O.prototype = source;
			return new O();
		} else {
			return source.slice();
		}
	};

	/**
	 * Return an array object list the modules have
	 * @param  {Array} module
	 * @return {Array}
	 */
	var argument = function(module) {
		return module.map(function(key) {
			return defines[key];
		});
	};

	/**
	 * Return an array of object definition list not loaded
	 * @param  {Array} module
	 * @return {Array}
	 */
	var unloadModule = function(module) {
		return module.filter(function(key) {
			return !defines[key];
		});
	};

	/**
	 * Return waiting module list that can be released
	 * @param  {String} key Target
	 * @param  {Array} value Waiting module list
	 * @return {Array}
	 */
	var startWait = function(key, value) {
		return value.filter(function(obj) {
			if (!obj.value.filter(function(val) {
					return val === key;
				}).length) {
				return false;
			}
			if (!obj.value.filter(function(val) {
					return val !== key;
				}).length) {
				return true;
			}
		});
	};

	/**
	 * Return wait module list that in waiting state continues
	 * @param  {String} key Target
	 * @param  {Array} value Waiting module list
	 * @return {Array}
	 */
	var continueWait = function(key, value) {
		return value.map(function(obj) {
			var ret = obj.value.map(function(val) {
				if (val !== key) {
					return val;
				}
			}).filter(function(val) {
				return val;
			});

			if (ret.length) {
				return {
					key: obj.key,
					value: ret
				};
			}
		}).filter(function(val) {
			return val;
		});
	};

	/**
	 * Update of the waiting module list
	 * @param  {String} key Target
	 * @param  {String} name Module name
	 * @return {Function}
	 */
	var restartWait = function(key, name) {
		var start = startWait(name, waitObject[key]);
		var wait = continueWait(name, waitObject[key]);

		waitObject[key] = wait;

		return function(callback) {
			start.forEach(function(obj) {
				var module = grainObject[key][obj.key].module;
				var func = grainObject[key][obj.key].func;
				callback(obj.key, module, func);
			});
		};
	};

	/**
	 * Reload waiting definition module
	 * @param  {String} name Module name
	 */
	var redefine = function(name) {
		restartWait(KGrain.define, name)(define);
		restartWait(KGrain.require, name)(require);
		restartWait(KGrain.mixin, name)(mixin);
	};

	/**
	 * Read module defined
	 * @param  {String} name module name
	 * @param  {Array} module Required module
	 * @param  {Function} fn Function to load definition module
	 */
	var define = function(name, module, fn) {
		defines[name] = fn.apply(document, argument(module));
		redefine(name);
	};

	/**
	 * Execute function after DOM loaded
	 * @param  {Array} module Required module
	 * @param  {Function} fn Execution function
	 */
	var require = function(name, module, fn) {
		if (load) {
			fn.apply(document, argument(module));
		} else {
			standby.push({
				module: module,
				func: fn
			});
		}
	};

	/**
	 * Mixin definition module
	 * @param  {String} name Module name of after mixin
	 * @param  {Array} module Module to mixin
	 */
	var mixin = function(name, module) {
		if (!defines[name]) {
			defines[name] = {};
		}
		module.forEach(function(key) {
			defines[name][proper(key)] = defines[key];
		});
		redefine(name);
	};

	/**
	 * DOM loaded
	 */
	var ready = function() {
		load = true;
		standby.forEach(function(obj) {
			require(undefined, obj.module, obj.func);
		});
		standby = [];

		loadError(KGrain.define, 1);
		loadError(KGrain.mixin, 1);
		loadError(KGrain.require, 2);
	};

	/**
	 * Adding grain object
	 * @param  {Object} grains Object to be added
	 * @param  {String} name Module name
	 * @param  {Array} module Required module
	 * @param  {Function} fn Function to load definition module
	 * @return {Object}
	 */
	var pushGrains = function(grains, name, module, fn) {
		var obj = {};
		obj[name] = {
			module: module,
			func: fn
		};
		return merge(grains, obj);
	};

	/**
	 * Adding waiting object
	 * @param  {Object} waits Object to be added
	 * @param  {String} key Target
	 * @param  {Array} module Waiting object
	 * @return {Array}
	 */
	var pushWaits = function(waits, key, value) {
		var array = copy(waits);
		array.push({
			key: key,
			value: value
		});
		return array;
	};

	/**
	 * Registration of the DOM loaded function
	 * @param  {Array} module Required module
	 * @param  {Function} fn Function to call
	 */
	window.Grain = function Grain(module, fn) {
		var name = grainObject.require.length;
		grainObject.require = pushGrains(grainObject.require, name, module, fn);

		var unload = unloadModule(module);

		if (unload.length) {
			var waits = waitObject[KGrain.require];
			waitObject[KGrain.require] = pushWaits(waits, name, unload);
		} else {
			require(name, module, fn);
		}
	};

	/**
	 * Module definition
	 * @param  {String} name Module name
	 * @param  {Array} module Required module
	 * @param  {Function} fn Function to load definition module
	 */
	Grain.define = function(name, module, fn) {
		grainObject.define = pushGrains(grainObject.define, name, module, fn);

		var unload = unloadModule(module);

		if (unload.length) {
			var waits = waitObject[KGrain.define];
			waitObject[KGrain.define] = pushWaits(waits, name, unload);
		} else {
			define(name, module, fn);
		}
	};

	/**
	 * Module mixin
	 * @param  {Object} obj
	 *
	 * object
	 * {Module name: [definition module name ...]}
	 */
	Grain.mixin = function(obj) {
		for (var name in obj) {
			var module = obj[name];
			grainObject.mixin = pushGrains(grainObject.mixin, name, module);

			var unload = unloadModule(module);

			if (unload.length) {
				var waits = waitObject[KGrain.mixin];
				waitObject[KGrain.mixin] = pushWaits(waits, name, unload);
			} else {
				mixin(name, module);
			}
		}
	};

	document.addEventListener('DOMContentLoaded', ready, false);
}());
