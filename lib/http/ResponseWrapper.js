const Response = require('node-fetch').Response;
const EventEmitter = require('events');

/**
 * Wrapper around the underlying Fetch API Response object.
 * Adds two useful events:
 * - 'json' - Emitted when the caller uses the `json()` method and the response body is successfully parsed as JSON.
 * - 'text' - Emitted when the caller uses the `text()` method and the response is successfully read as text.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Response
 */
class ResponseWrapper extends Response {
  constructor(res) {
    super(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers
    });

    this.events = new EventEmitter();
  }

  /**
   * Attempts to parse the response body as JSON, returning the parsed object.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Body/json
   */
  async json() {
    const parsedJson = await super.json();
    this.events.emit('json', parsedJson);

    return parsedJson;
  }

  /**
   * Attempts to read the response body as text, returning the string.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Body/text
   */
  async text() {
    const text = await super.text();
    this.events.emit('text', text);

    return text;
  }
}

module.exports = ResponseWrapper;
