const AffinitySession = require('./http/AffinitySession');

class PrizmDocRestClient {
  constructor(defaults = {}) {
    this._defaults = defaults;
  }

  /**
   * Creates an {AffinitySession} which you can use to make requests.
   */
  createAffinitySession() {
    return new AffinitySession(this._defaults);
  }
}

module.exports = PrizmDocRestClient;
