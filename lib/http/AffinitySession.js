const delay = require('delay');
const RequestHelper = require('./RequestHelper');

/**
 * Class representing an "affinity session", a group of HTTP requests all related to a single document processing workflow and which must all be routed to the same machine.
 */
class AffinitySession extends RequestHelper {
  constructor(defaults) {
    super(defaults);

    // Whenever a response comes back...
    this.on('response', async res => {
      // If we haven't started using an affinity token yet...
      if (!this.defaults.headers['Accusoft-Affinity-Token'] && res.ok) {
        // If the programmer calls res.json() to get parsed JSON...
        res.events.once('json', parsedJson => {
          // Then look for an affinity token and start using it in all subsequent requests.
          startUsingAffinityTokenIfPresentInParsedJson(this, parsedJson);
        });

        // Or, if the programmer calls res.text() to get plain text...
        res.events.once('text', text => {
          // And the response media type is application/json...
          if (parseMediaType(res.headers.get('content-type')) === 'application/json') {
            try {
              // Then parse the JSON...
              const parsedJson = JSON.parse(text);

              // ...and look for an affinity token and start using it in all subsequent requests.
              startUsingAffinityTokenIfPresentInParsedJson(this, parsedJson);
            } catch (err) {
              return;
            }
          }
        });
      }
    });
  }

  /**
   * Gets the current status of a processing resource.
   *
   * @param {string} resource Processing resource you with to query for its current status.
   * @param {object} options Additional options that will be passed to the underlying Fetch API's `init` argument. See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Syntax
   *
   * @returns {object} Parsed JSON returned from the server.
   */
  async getCurrentProcessStatus(resource, options) {
    const res = await this.get(resource, options);

    if (!res.ok) {
      throw new Error(`An HTTP request to GET process status failed: ${res.status} ${res.statusText}`);
    }

    const processInfo = await res.json();

    if (!processInfo.state) {
      throw new Error(`After sending an HTTP request to GET process status, the HTTP response did not appear to be providing information about a process. For any process, the response body should be JSON with a "state" property, but this response JSON did not have a "state" property. Are you sure you are using the correct URL for the request?`);
    }

    return processInfo;
  }

  /**
   * Repeatedly polls the status of a processing resource until its `"state"` is a value other than `"processing"`.
   *
   * @param {string} resource Processing resource you wish to wait for.
   * @param {object} options Additional options that will be passed to the underlying Fetch API's `init` argument. See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Syntax
   *
   * @returns {object} Parsed JSON of the final process status returned from the server.
   */
  async getFinalProcessStatus(resource, options) {
    let processInfo;
    let firstRequest = true;

    do {
      if (!firstRequest) {
        await delay(100);
      }

      processInfo = await this.getCurrentProcessStatus(resource, options);
      firstRequest = false;
    } while (processInfo.state === 'processing');

    return processInfo;
  }
}

function startUsingAffinityTokenIfPresentInParsedJson(response, parsedJson) {
  if (typeof parsedJson === 'object' && typeof parsedJson.affinityToken === 'string') {
    response.addToDefaults({
      headers: { 'Accusoft-Affinity-Token': parsedJson.affinityToken }
    });
  }
}

function parseMediaType(contentType) {
  if (!contentType) {
    return;
  }

  const semicolonIndex = contentType.indexOf(';');
  const hasSemicolon = semicolonIndex >= 0;
  let mediaType;

  if (hasSemicolon) {
    mediaType = contentType.substring(0, semicolonIndex).trim();
  } else {
    mediaType = contentType.trim();
  }

  return mediaType;
}

module.exports = AffinitySession;
