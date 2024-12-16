import { promisify } from 'node:util';
import { readFileSync, readdir } from 'node:fs';
import BSON from 'bson';
import { Document } from './document';
import { Manifest } from './manifest';

const readdirAsync = promisify(readdir);

export const generateManifest = async () => {
  const manifest = new Manifest();
  console.log('=========== generating manifests ================');

  // Get list of file entries in documents dir
  const entries = await readdirAsync('documents', { recursive: true });
  const mappedEntries = entries.filter((fileName) => {
    return (
      fileName.includes('.bson') &&
      !fileName.includes('images') &&
      !fileName.includes('includes') &&
      !fileName.includes('sharedinclude')
    );
  });

  for (const entry of mappedEntries) {
    // Read and decode each entry
    const decoded = BSON.deserialize(readFileSync(`documents/${entry}`));

    // Parse data into a document and format it as a Manifest document
    const processedDoc = new Document(decoded).exportAsManifestEntry();
    if (processedDoc) manifest.addDocument(processedDoc);
  }
  return manifest;
};
