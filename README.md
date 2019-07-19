# prizmdoc-rest-client (BETA)

**(BETA)** HTTP client designed to simplify interactions with PrizmDoc Server. Specifically:

1. Automatically handles affinity concerns
2. Provides a way to easily poll for process completion

## Installation

```bash
npm install @accusoft/prizmdoc-rest-client
```

## Example Usage

Here's an example demonstrating converting a JPEG to PDF:

```js
const PrizmDocRestClient = require('@accusoft/prizmdoc-rest-client');
const fs = require('fs');

async function main() {
  // Construct an instance of the PrizmDocRestClient.
  const prizmdocServer = new PrizmDocRestClient({
    baseUrl: 'https://api.accusoft.com',
    headers: {
      'Acs-Api-Key': 'YOUR_API_KEY'
    }
  });

  // Create an affinity session for our processing work.
  //
  // You should use an affinity session anytime you have a group
  // of HTTP requests that go together as part of a processing
  // chain. The session ensures that all HTTP requests will
  // automatically use the same affinity (be routed to the same
  // PrizmDoc Server machine in the cluster).
  const session = prizmdocServer.createAffinitySession();

  let res;

  // Create a new work file for the input document
  res = await session.post('/PCCIS/V1/WorkFile', {
    body: fs.readFileSync('input.jpg')
  });

  const inputWorkFile = await res.json();

  // Start a conversion process using the input work file
  res = await session.post('/v2/contentConverters', {
    body: JSON.stringify({
      input: {
        sources: [
          {
            fileId: inputWorkFile.fileId
          }
        ],
        dest: {
          format: 'pdf'
        }
      }
    })
  });

  let process = await res.json();

  // Wait for the process to finish
  process = await session.getFinalProcessStatus(`/v2/contentConverters/${process.processId}`);

  // Did the process error?
  if (process.state !== 'complete') {
    throw new Error(`The process failed to complete: ${JSON.stringify(process, null, 2)}`);
  }

  // Download the output work file and save it to disk.
  res = await session.get(`/PCCIS/V1/WorkFile/${process.output.results[0].fileId}`);
  res.body.pipe(fs.createWriteStream('output.pdf'));
}

main();
```
