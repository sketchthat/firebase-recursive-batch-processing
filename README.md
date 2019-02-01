# Firebase: Batch processing with Cloud Functions

[Medium Article](https://medium.com/@michael.kimpton/firebase-batch-processing-with-cloud-functions-aa11640cc9ac)

## Quick Start

Install `functions` npm dependencies;

```
cd functions && npm install
```

Deploy `firebase` functions;

```
firebase deploy --only functions
```

Trigger the `batchWriteUser` function, update the RTDB `/setupUsers: true`
Trigger the `batchUpdateUser` function, update the RTDB `/triggerUsers: true`
