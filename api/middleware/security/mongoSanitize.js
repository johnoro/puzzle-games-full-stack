const TEST_REGEX = /^\$|\./;
const TEST_REGEX_WITHOUT_DOT = /^\$/;
const REPLACE_REGEX = /^\$|\./g;

function isPlainObject(obj) {
	return typeof obj === 'object' && obj !== null;
}

function getTestRegex(allowDots) {
	return allowDots ? TEST_REGEX_WITHOUT_DOT : TEST_REGEX;
}

function withEach(target, cb) {
	(function act(obj) {
		if (Array.isArray(obj)) {
			obj.forEach(act);
		} else if (isPlainObject(obj)) {
			Object.keys(obj).forEach(function (key) {
				const val = obj[key];
				const resp = cb(obj, val, key);
				if (resp.shouldRecurse) {
					act(obj[resp.key || key]);
				}
			});
		}
	})(target);
}

export function has(target, allowDots) {
	const regex = getTestRegex(allowDots);

	let hasProhibited = false;
	withEach(target, function (obj, val, key) {
		if (regex.test(key)) {
			hasProhibited = true;
			return { shouldRecurse: false };
		} else {
			return { shouldRecurse: true };
		}
	});

	return hasProhibited;
}

function _sanitize(target, options) {
	const regex = getTestRegex(options.allowDots);

	let isSanitized = false;
	let replaceWith = null;
	const dryRun = Boolean(options.dryRun);
	if (!regex.test(options.replaceWith) && options.replaceWith !== '.') {
		replaceWith = options.replaceWith;
	}

	withEach(target, function (obj, val, key) {
		let shouldRecurse = true;

		if (regex.test(key)) {
			isSanitized = true;
			// if dryRun is enabled, do not modify the target
			if (dryRun) {
				return {
					shouldRecurse: shouldRecurse,
					key: key
				};
			}
			delete obj[key];
			if (replaceWith) {
				key = key.replace(REPLACE_REGEX, replaceWith);
				// Avoid to set __proto__ and constructor.prototype
				// https://portswigger.net/daily-swig/prototype-pollution-the-dangerous-and-underrated-vulnerability-impacting-javascript-applications
				// https://snyk.io/vuln/SNYK-JS-LODASH-73638
				if (
					key !== '__proto__' &&
					key !== 'constructor' &&
					key !== 'prototype'
				) {
					obj[key] = val;
				}
			} else {
				shouldRecurse = false;
			}
		}

		return {
			shouldRecurse: shouldRecurse,
			key: key
		};
	});

	return {
		isSanitized,
		target
	};
}

export function sanitize(target, options = {}) {
	return _sanitize(target, options).target;
}

function deepCopy(obj) {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(deepCopy);
	}

	return Object.fromEntries(
		Object.entries(obj).map(([key, value]) => [key, deepCopy(value)])
	);
}

/**
 * @param {{replaceWith?: string, onSanitize?: function, dryRun?: boolean}} options
 * @returns {function}
 */
export default function middleware(options = {}) {
	const hasOnSanitize = typeof options.onSanitize === 'function';
	return function (req, res, next) {
		['body', 'params', 'headers'].forEach(function (key) {
			if (req[key]) {
				const { target, isSanitized } = _sanitize(req[key], options);
				req[key] = target;
				if (isSanitized && hasOnSanitize) {
					options.onSanitize({
						req,
						key
					});
				}
			}
		});

		if (req.query) {
			const sanitizedQuery = _sanitize(deepCopy(req.query), options);
			if (sanitizedQuery.isSanitized) {
				Object.defineProperty(req, 'query', {
					value: sanitizedQuery.target,
					writable: false,
					configurable: true,
					enumerable: true
				});
				if (hasOnSanitize) {
					options.onSanitize({
						req,
						key: 'query'
					});
				}
			}
		}
		next();
	};
}
