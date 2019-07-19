const EventEmitter = require('events');
const fetch = require('node-fetch');
const resolveUrl = require('url').resolve;
const assignDeep = require('lodash.defaultsdeep');
const ResponseWrapper = require('./ResponseWrapper');

function applyBaseUrl(path, defaults) {
  if (defaults && defaults.baseUrl) {
    return resolveUrl(defaults.baseUrl, path);
  }

  return path;
}

/**
 * Wrapper around the Fetch API which allows the caller to
 * 1) specify a `baseUrl` to use for each request and
 * 2) use methods for specific HTTP verbs (`get()`, `put()`, `post()`, etc.).
 */
class RequestHelper extends EventEmitter {

  /**
   * Creates a new RequestHelper instance, a wrapper around the Fetch API
   * (see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) which
   * allows the caller 1) the ability to specify a `baseUrl` and 2) provides
   * specific named methods for HTTP verbs (`get()`, `put()`, `post()`, etc.).
   *
   * @param {object} defaults Defaults to be used for all requests. Passed to the underlying Fetch API's `init` parameter. See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters.
   * @param {string} defaults.baseUrl Base URL to use for all HTTP requests.
   */
  constructor(defaults = {}) {
    super();
    this._defaults = defaults;
    if (!this._defaults.headers) {
      this._defaults.headers = {};
    }
  }

  /**
   * Returns the current defaults which will be used for all requests.
   */
  get defaults() {
    return assignDeep({}, this._defaults);
  }

  /**
   * Adds additional default options to be applied to all future requests.
   *
   * @param {object} someNewImportantDefaults
   */
  addToDefaults(someNewImportantDefaults) {
    assignDeep(this._defaults, someNewImportantDefaults);
  }

  /**
   * HTTP GET a resource.
   *
   * @param {string} resource URL path to the resource.
   * @param {object} [options] Additional Fetch request options.
   */
  async get(resource, options) {
    const res = new ResponseWrapper(await fetch(applyBaseUrl(resource, this._defaults), assignDeep({}, this._defaults, options, { method: 'GET' })));
    this.emit('response', res);

    return res;
  }

  /**
   * HTTP PUT a resource.
   *
   * @param {string} resource URL path to the resource.
   * @param {object} [options] Additional Fetch request options.
   */
  async put(resource, options) {
    const res = new ResponseWrapper(await fetch(applyBaseUrl(resource, this._defaults), assignDeep({}, this._defaults, options, { method: 'PUT' })));
    this.emit('response', res);

    return res;
  }

  /**
   * HTTP POST a resource.
   *
   * @param {string} resource URL path to the resource.
   * @param {object} [options] Additional Fetch request options.
   */
  async post(resource, options) {
    const res = new ResponseWrapper(await fetch(applyBaseUrl(resource, this._defaults), assignDeep({}, this._defaults, options, { method: 'POST' })));
    this.emit('response', res);

    return res;
  }

  /**
   * HTTP DELETE a resource.
   *
   * @param {string} resource URL path to the resource.
   * @param {object} [options] Additional Fetch request options.
   */
  async delete(resource, options) {
    const res = new ResponseWrapper(await fetch(applyBaseUrl(resource, this._defaults), assignDeep({}, this._defaults, options, { method: 'DELETE' })));
    this.emit('response', res);

    return res;
  }

  /**
   * Creates a new {@link RequestHelper} instance with additional defaults.
   *
   * @param {object} additionalDefaults
   */
  createNewInstanceWithAdditionalDefaults(additionalDefaults) {
    return new RequestHelper(assignDeep({}, this._defaults, additionalDefaults));
  }
}

module.exports = RequestHelper;
