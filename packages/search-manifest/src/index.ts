import { promisify } from 'node:util';
// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { BSON } from 'bson';
import { Document } from './generateManifest/document';
import { Manifest } from './generateManifest/manifest';
import { uploadManifest } from './uploadToAtlas/uploadManifest';

import { readFileSync, readdir } from 'node:fs';
import type { S3UploadParams } from './types';
import { getProperties } from './uploadToAtlas/getProperties';
import { closeSearchDb, closeSnootyDb } from './uploadToAtlas/searchConnector';
import { uploadManifestToS3 } from './uploadToS3/uploadManifest';

const readdirAsync = promisify(readdir);

const extension = new NetlifyExtension();

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
//Return indexing data from a page's AST for search purposes.
extension.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { run }, netlifyConfig }) => {
    if (!process.env.SEARCH_MANIFEST_ENABLED) return;

    // Get content repo zipfile as AST representation
    await run.command('unzip -o bundle.zip');

    const branchName = netlifyConfig.build?.environment.BRANCH;
    const repoName =
      process.env.REPO_NAME ?? netlifyConfig.build?.environment.SITE_NAME;
    //check that an environment variable for repo name was set
    if (!repoName || !branchName) {
      throw new Error(
        'Repo or branch name was not found, manifest cannot be uploaded to Atlas or S3 ',
      );
    }

    const manifest = await generateManifest();

    console.log('=========== finished generating manifests ================');
    const {
      searchProperty,
      projectName,
      url,
      includeInGlobalSearch,
    }: {
      searchProperty: string;
      projectName: string;
      url: string;
      includeInGlobalSearch: boolean;
    } = await getProperties({ branchName, repoName });

    console.log('=========== Uploading Manifests to S3=================');
    const uploadArgs: S3UploadParams = {
      bucket: 'docs-search-indexes-test',
      //TODO: change this values based on environments
      prefix: 'search-indexes/ab-testing',
      fileName: `${projectName}-${branchName}.json`,
      manifest: manifest.export(),
    };

    const s3Status = await uploadManifestToS3(uploadArgs);

    console.log(`S3 upload status: ${JSON.stringify(s3Status)}`);
    console.log('=========== Finished Uploading to S3  ================');

    try {
      manifest.setUrl(url);
      manifest.setGlobalSearchValue(includeInGlobalSearch);

      console.log('=========== Uploading Manifests to Atlas =================');
      const status = await uploadManifest(manifest, searchProperty);
      console.log(status);
      console.log('=========== Manifests uploaded to Atlas =================');
    } catch (e) {
      console.log('Manifest could not be uploaded', e);
    } finally {
      await closeSearchDb();
      await closeSnootyDb();
    }
  },
);

export { extension };
