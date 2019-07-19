const expect = require('chai').expect;
const nock = require('nock');
const AffinitySession = require('../../lib/http/AffinitySession');

describe('AffinitySession', () => {
  describe('automatically manages affinity tokens:', () => {
    describe('when res.json() is called', () => {
      it('automatically looks for an affinityToken in the parsed JSON and, once one is found, sets Accusoft-Affinity-Token request header to that value for all subsequent requests', async () => {
        const token = 'abc123';

        function firstResponseWithAnAffinityToken() {
          expect(this.req.headers['accusoft-affinity-token']).to.deep.equal(undefined);

          return [200, { affinityToken: token }];
        }

        function ensureIncomingRequestHasTheAffinityToken() {
          expect(this.req.headers['accusoft-affinity-token']).to.deep.equal([token]);

          return [200];
        }

        const mockServer = nock('http://acme.com')
          .post('/wat')
          .reply(firstResponseWithAnAffinityToken)
          .post('/foo')
          .reply(ensureIncomingRequestHasTheAffinityToken)
          .put('/blah')
          .reply(ensureIncomingRequestHasTheAffinityToken)
          .get('/etc')
          .reply(ensureIncomingRequestHasTheAffinityToken);

        const session = new AffinitySession({ baseUrl: 'http://acme.com' });

        const res = await session.post('/wat');

        // The caller themselves must parse the response before we will look for the affinity token.
        // We do not automatically parse the response JSON ourselves without the caller knowing.
        // Instead, if the caller asks for the JSON to be parsed, our library is notified it was parsed
        // and then, at that point, we hunt for the affinityToken.
        await res.json();

        session.post('/foo');
        session.put('/blah');
        session.get('/etc');

        expect(mockServer.isDone()).to.equal(true);
      });
    });

    describe('when res.text() is called', () => {
      describe('and the response Content-Type is "application/json; charset=utf-8"', () => {
        it('automatically parses the text as JSON, looks for an affinityToken in the parsed JSON and, once one is found, sets Accusoft-Affinity-Token request header to that value for all subsequent requests', async () => {
          const token = 'abc123';

          function firstResponseWithAnAffinityToken() {
            expect(this.req.headers['accusoft-affinity-token']).to.deep.equal(undefined);

            return [200, `{ "affinityToken": "${token}" }`, { 'Content-Type': 'application/json; charset=utf-8' }];
          }

          function ensureIncomingRequestHasTheAffinityToken() {
            expect(this.req.headers['accusoft-affinity-token']).to.deep.equal([token]);

            return [200];
          }

          const mockServer = nock('http://acme.com')
            .post('/wat')
            .reply(firstResponseWithAnAffinityToken)
            .post('/foo')
            .reply(ensureIncomingRequestHasTheAffinityToken)
            .put('/blah')
            .reply(ensureIncomingRequestHasTheAffinityToken)
            .get('/etc')
            .reply(ensureIncomingRequestHasTheAffinityToken);

          const session = new AffinitySession({ baseUrl: 'http://acme.com' });

          const res = await session.post('/wat');

          // The caller themselves must parse the response before we will look for the affinity token.
          // We do not automatically parse the response JSON ourselves without the caller knowing.
          // Instead, if the caller asks for the JSON to be parsed, our library is notified it was parsed
          // and then, at that point, we hunt for the affinityToken.
          await res.text();

          session.post('/foo');
          session.put('/blah');
          session.get('/etc');

          expect(mockServer.isDone()).to.equal(true);
        });
      });

      describe('and the response media-type is NOT application/json', () => {
        it('does not try to parse the JSON or find an affinityToken', async () => {
          function firstResponseWithAnAffinityToken() {
            expect(this.req.headers['accusoft-affinity-token']).to.deep.equal(undefined);

            return [200, 'This is not JSON'];
          }

          function ensureIncomingRequestDoesNotHaveAnAffinityTokenSet() {
            expect(this.req.headers['accusoft-affinity-token']).to.deep.equal(undefined);

            return [200];
          }

          const mockServer = nock('http://acme.com')
            .post('/wat')
            .reply(firstResponseWithAnAffinityToken)
            .post('/foo')
            .reply(ensureIncomingRequestDoesNotHaveAnAffinityTokenSet)
            .put('/blah')
            .reply(ensureIncomingRequestDoesNotHaveAnAffinityTokenSet)
            .get('/etc')
            .reply(ensureIncomingRequestDoesNotHaveAnAffinityTokenSet);

          const session = new AffinitySession({ baseUrl: 'http://acme.com' });

          const res = await session.post('/wat');

          await res.text();

          session.post('/foo');
          session.put('/blah');
          session.get('/etc');

          expect(mockServer.isDone()).to.equal(true);
        });
      });
    });

    describe('when res.text() is called on a response whose media-type is application/json', () => {
      describe('and the body is valid JSON with an affinityToken', () => {
        it('automatically parses the text as JSON, looks for an affinityToken in the parsed JSON and, once one is found, sets Accusoft-Affinity-Token request header to that value for all subsequent requests', async () => {
          const token = 'abc123';

          function firstResponseWithAnAffinityToken() {
            expect(this.req.headers['accusoft-affinity-token']).to.deep.equal(undefined);

            return [200, { affinityToken: token }];
          }

          function ensureIncomingRequestHasTheAffinityToken() {
            expect(this.req.headers['accusoft-affinity-token']).to.deep.equal([token]);

            return [200];
          }

          const mockServer = nock('http://acme.com')
            .post('/wat')
            .reply(firstResponseWithAnAffinityToken)
            .post('/foo')
            .reply(ensureIncomingRequestHasTheAffinityToken)
            .put('/blah')
            .reply(ensureIncomingRequestHasTheAffinityToken)
            .get('/etc')
            .reply(ensureIncomingRequestHasTheAffinityToken);

          const session = new AffinitySession({ baseUrl: 'http://acme.com' });

          const res = await session.post('/wat');

          await res.text();

          session.post('/foo');
          session.put('/blah');
          session.get('/etc');

          expect(mockServer.isDone()).to.equal(true);
        });
      });

      describe('and the body is invalid JSON', () => {
        it('automatically tries to parse the JSON but continues on without error when it cannot be parsed', async () => {
          function firstResponseWithAnAffinityToken() {
            expect(this.req.headers['accusoft-affinity-token']).to.deep.equal(undefined);

            return [200, 'This is not JSON', { 'Content-Type': 'application/json' }];
          }

          function ensureIncomingRequestDoesNotHaveAnAffinityTokenSet() {
            expect(this.req.headers['accusoft-affinity-token']).to.deep.equal(undefined);

            return [200];
          }

          const mockServer = nock('http://acme.com')
            .post('/wat')
            .reply(firstResponseWithAnAffinityToken)
            .post('/foo')
            .reply(ensureIncomingRequestDoesNotHaveAnAffinityTokenSet)
            .put('/blah')
            .reply(ensureIncomingRequestDoesNotHaveAnAffinityTokenSet)
            .get('/etc')
            .reply(ensureIncomingRequestDoesNotHaveAnAffinityTokenSet);

          const session = new AffinitySession({ baseUrl: 'http://acme.com' });

          const res = await session.post('/wat');

          await res.text();

          session.post('/foo');
          session.put('/blah');
          session.get('/etc');

          expect(mockServer.isDone()).to.equal(true);
        });
      });
    });
  });

  describe('getFinalProcessStatus', () => {
    describe('when the first response is "complete"', () => {
      it('only makes a single GET request', async () => {
        const request = new AffinitySession({
          baseUrl: 'http://acme.com'
        });
        const mockServer = nock('http://acme.com')
          .get('/process/123')
          .reply(200, { state: 'complete' });

        await request.getFinalProcessStatus('/process/123');

        expect(mockServer.isDone()).to.equal(true);
      });
    });

    describe('when the first response is "error"', () => {
      it('only makes a single GET request', async () => {
        const request = new AffinitySession({
          baseUrl: 'http://acme.com'
        });
        const mockServer = nock('http://acme.com')
          .get('/process/123')
          .reply(200, { state: 'error' });

        await request.getFinalProcessStatus('/process/123');

        expect(mockServer.isDone()).to.equal(true);
      });
    });

    describe('when the third response is "complete"', () => {
      it('makes three GET requests', async () => {
        const request = new AffinitySession({
          baseUrl: 'http://acme.com'
        });
        const mockServer = nock('http://acme.com')
          .get('/process/123')
          .times(2)
          .reply(200, { state: 'processing' })
          .get('/process/123')
          .reply(200, { state: 'complete' });

        await request.getFinalProcessStatus('/process/123');

        expect(mockServer.isDone()).to.equal(true);
      });
    });

    describe('when the third response is "error"', () => {
      it('makes three GET requests', async () => {
        const request = new AffinitySession({
          baseUrl: 'http://acme.com'
        });
        const mockServer = nock('http://acme.com')
          .get('/process/123')
          .times(2)
          .reply(200, { state: 'processing' })
          .get('/process/123')
          .reply(200, { state: 'error' });

        await request.getFinalProcessStatus('/process/123');

        expect(mockServer.isDone()).to.equal(true);
      });
    });

    it('puts a delay of 100ms between each request', async () => {
      const request = new AffinitySession({
        baseUrl: 'http://acme.com'
      });
      const TOTAL_REQUESTS = 3;

      let reqTimes = [];

      const mockServer = nock('http://acme.com')
        .get('/process/123')
        .times(TOTAL_REQUESTS - 1)
        .reply(function () {
          reqTimes.push(new Date());

          return [200, { state: 'processing' }];
        })
        .get('/process/123')
        .reply(function () {
          reqTimes.push(new Date());

          return [200, { state: 'complete' }];
        });

      await request.getFinalProcessStatus('/process/123');

      expect(mockServer.isDone()).to.equal(true);

      for (let i = 0; i < reqTimes.length - 1; i++) {
        expect(reqTimes[i + 1] - reqTimes[i]).to.be.approximately(100, 50);
      }
    });
  });
});
