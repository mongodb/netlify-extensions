import { promisify } from 'node:util';
import { readFileSync, readFile, readdir } from 'node:fs';
import BSON from 'bson';
import { Document } from './document';
import { Manifest } from './manifest';

// The directory in the Parser-outputted bundle.zip that contains the AST
const DOCUMENTS_DIR = 'documents';

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);

export const generateManifest = async () => {
  const manifest = new Manifest();
  console.log('=========== generating manifests ================');

  // Get list of file entries in documents dir
  const entries = await readdirAsync(DOCUMENTS_DIR, { recursive: true });
  const mappedEntries = entries.filter((fileName) => {
    return (
      fileName.includes('.bson') &&
      !fileName.includes('images') &&
      !fileName.includes('includes') &&
      !fileName.includes('sharedinclude')
    );
  });

  await Promise.all(
    mappedEntries.map(async (entry) => {
      // Read and decode each entry
      const decoded = BSON.deserialize(
        await readFileAsync(`documents/${entry}`),
      );

      // Parse data into a document and format it as a Manifest document
      const processedDoc = new Document(decoded).exportAsManifestEntry();
      if (processedDoc) manifest.addDocument(processedDoc);
    }),
  );
  return manifest;
};
