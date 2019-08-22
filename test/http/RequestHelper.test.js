const expect = require('chai').expect;
const nock = require('nock');
const RequestHelper = require('../../lib/http/RequestHelper');

describe('RequestHelper', function () {
  describe('addToDefaults', function () {
    it('can be used to add a new header that should be sent with every request', async function () {
      const request = new RequestHelper();

      const mockServer = nock('http://acme.com')
        .get('/wat')
        .reply(function () {
          expect(this.req.headers['accusoft-affinity-token']).to.equal(undefined);

          return [200];
        })
        .get('/wat')
        .reply(function () {
          expect(this.req.headers['accusoft-affinity-token']).to.deep.equal(['Now a value is set!']);

          return [200];
        });

      await request.get('http://acme.com/wat');
      request.addToDefaults({ headers: { 'Accusoft-Affinity-Token': 'Now a value is set!' }});
      await request.get('http://acme.com/wat');
      expect(mockServer.isDone()).to.equal(true);
    });
  });

  describe('get', function () {
    it('can GET JSON from a URL', async function () {
      const request = new RequestHelper();
      const mockServer = nock('http://acme.com')
        .get('/wat')
        .reply(200, {
          wat: true
        });

      const res = await request.get('http://acme.com/wat');

      expect(await res.json()).to.deep.equal({ wat: true });
      expect(mockServer.isDone()).to.equal(true);
    });

    it('can provide custom request headers', async function () {
      const request = new RequestHelper();
      const mockServer = nock('http://acme.com')
        .get('/wat')
        .reply(function () {
          expect(this.req.headers['my-custom-header']).to.deep.equal(['Some Value']);
          expect(this.req.headers['content-type']).to.deep.equal(['application/wat']);

          return [200];
        });

      const res = await request.get('http://acme.com/wat', {
        headers: {
          'My-Custom-Header': 'Some Value',
          'Content-Type': 'application/wat'
        }
      });

      expect(res.status).to.equal(200);
      expect(mockServer.isDone()).to.equal(true);
    });

    it('emits "response" event with the response object', function (done) {
      const request = new RequestHelper();
      nock('http://acme.com')
        .get('/wat')
        .reply(200, 'The response body');

      request.once('response', async res => {
        expect(res.status).to.equal(200);
        expect(await res.text()).to.deep.equal('The response body');
        done();
      });

      request.get('http://acme.com/wat');
    });
  });

  describe('put', function () {
    it('can send bytes', async function () {
      const request = new RequestHelper();
      const mockServer = nock('http://acme.com')
        .put('/someFile')
        .reply(function (uri, reqBody) {
          expect(reqBody).to.equal('wat');

          return [200];
        });

      request.put('http://acme.com/someFile', {
        body: Buffer.from('wat')
      });
      expect(mockServer.isDone()).to.equal(true);
    });

    it('emits "response" event with the response object', function (done) {
      const request = new RequestHelper();
      nock('http://acme.com')
        .put('/someFile')
        .reply(200, 'The response body');

      request.once('response', async res => {
        expect(res.status).to.equal(200);
        expect(await res.text()).to.deep.equal('The response body');
        done();
      });

      request.put('http://acme.com/someFile');
    });
  });

  describe('post', function () {
    it('can POST a JSON string', async function () {
      const request = new RequestHelper();
      const mockServer = nock('http://acme.com')
        .post('/doSomething')
        .reply(function (uri, reqBody) {
          expect(reqBody).to.equal('{"name":"Bob","age":50}');

          return [200];
        });

      request.post('http://acme.com/doSomething', {
        body: JSON.stringify({
          name: 'Bob',
          age: 50
        })
      });
      expect(mockServer.isDone()).to.equal(true);
    });

    it('emits "response" event with the response object', function (done) {
      const request = new RequestHelper();
      nock('http://acme.com')
        .post('/doSomething')
        .reply(200, 'The response body');

      request.once('response', async res => {
        expect(res.status).to.equal(200);
        expect(await res.text()).to.deep.equal('The response body');
        done();
      });

      request.post('http://acme.com/doSomething');
    });
  });

  describe('delete', function () {
    it('can DELETE a resource', async function () {
      const request = new RequestHelper();
      const mockServer = nock('http://acme.com')
        .delete('/apples/123')
        .reply(200);

      request.delete('http://acme.com/apples/123');
      expect(mockServer.isDone()).to.equal(true);
    });

    it('emits "response" event with the response object', function (done) {
      const request = new RequestHelper();
      nock('http://acme.com')
        .delete('/apples/123')
        .reply(200, 'The response body');

      request.once('response', async res => {
        expect(res.status).to.equal(200);
        expect(await res.text()).to.deep.equal('The response body');
        done();
      });

      request.delete('http://acme.com/apples/123');
    });
  });

  describe('createNewInstanceWithAdditionalDefaults', function () {
    it('creates a new RequestHelper object configured with extended defaults', async function () {
      const request = new RequestHelper();
      const subRequest = request.createNewInstanceWithAdditionalDefaults({ headers: { 'Acs-Api-Key': 'WAT123' }});

      const mockServer = nock('http://acme.com')
        .get('/wat')
        .reply(function () {
          expect(this.req.headers['acs-api-key']).to.deep.equal(['WAT123']);

          return [200];
        });

      const res = await subRequest.get('http://acme.com/wat');

      expect(res.status).to.equal(200);
      expect(mockServer.isDone()).to.equal(true);
    });
  });

  describe('options.baseUrl', function () {
    describe('without a trailing slash', function () {
      const request = new RequestHelper();
      // eslint-disable-next-line mocha/no-setup-in-describe
      const withoutTrailingSlash = request.createNewInstanceWithAdditionalDefaults({ baseUrl: 'http://acme.com' });

      it('is applied correctly for get', async function () {
        const mockServer = nock('http://acme.com').get('/wat').reply(200);
        await withoutTrailingSlash.get('/wat');
        expect(mockServer.isDone()).to.equal(true);
      });

      it('is applied correctly for put', async function () {
        const mockServer = nock('http://acme.com').put('/wat').reply(200);
        await withoutTrailingSlash.put('/wat');
        expect(mockServer.isDone()).to.equal(true);
      });

      it('is applied correctly for post', async function () {
        const mockServer = nock('http://acme.com').post('/wat').reply(200);
        await withoutTrailingSlash.post('/wat');
        expect(mockServer.isDone()).to.equal(true);
      });

      it('is applied correctly for delete', async function () {
        const mockServer = nock('http://acme.com').delete('/wat').reply(200);
        await withoutTrailingSlash.delete('/wat');
        expect(mockServer.isDone()).to.equal(true);
      });
    });

    describe('with a trailing slash', function () {
      const request = new RequestHelper();
      // eslint-disable-next-line mocha/no-setup-in-describe
      const withTrailingSlash = request.createNewInstanceWithAdditionalDefaults({ baseUrl: 'http://acme.com/' });

      it('is applied correctly for get', async function () {
        const mockServer = nock('http://acme.com').get('/wat').reply(200);
        await withTrailingSlash.get('/wat');
        expect(mockServer.isDone()).to.equal(true);
      });

      it('is applied correctly for put', async function () {
        const mockServer = nock('http://acme.com').put('/wat').reply(200);
        await withTrailingSlash.put('/wat');
        expect(mockServer.isDone()).to.equal(true);
      });

      it('is applied correctly for post', async function () {
        const mockServer = nock('http://acme.com').post('/wat').reply(200);
        await withTrailingSlash.post('/wat');
        expect(mockServer.isDone()).to.equal(true);
      });

      it('is applied correctly for delete', async function () {
        const mockServer = nock('http://acme.com').delete('/wat').reply(200);
        await withTrailingSlash.delete('/wat');
        expect(mockServer.isDone()).to.equal(true);
      });
    });
  });
});
