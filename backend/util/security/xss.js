import { inHTMLData } from 'xss-filters';

// https://github.com/jsonmaur/xss-clean/blob/master/src/xss.js
/**
 * Clean for xss.
 * @param {string/object} data - The value to sanitize
 * @return {string/object} The sanitized value
 */
export function clean(data = '') {
	let isObject = false;
	if (typeof data === 'object') {
		data = JSON.stringify(data);
		isObject = true;
	}

	data = inHTMLData(data).trim();
	if (isObject) data = JSON.parse(data);

	return data;
}
