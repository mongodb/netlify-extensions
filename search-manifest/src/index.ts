import { uploadManifest } from './uploadToAtlas/uploadManifest';
import { generateManifest } from './generateManifest';
import { Extension } from 'populate-metadata/extension';
import type {
  BranchEntry,
  ConfigEnvironmentVariables,
  DocsetsDocument,
  ReposBranchesDocument,
  S3UploadParams,
  SearchDbName,
} from './types';
import type { NetlifyPluginUtils } from '@netlify/build';

import { getSearchProperties } from './uploadToAtlas/getSearchProperties';
import {
  closePoolDb,
  // closeSearchDb,
} from 'populate-metadata/databaseConnection/atlasClusterConnector';
import { uploadManifestToS3 } from './uploadToS3/uploadManifest';
import { envVarToBool } from './extension';
import type { DbConfig } from 'populate-metadata/assertDbEnvVars';

const EXTENSION_NAME = 'search-manifest';

const generateAndUploadManifests = async ({
  configEnvironment,
  run,
  dbEnvVars,
}: {
  configEnvironment: ConfigEnvironmentVariables;
  run: NetlifyPluginUtils['run'];
  dbEnvVars: DbConfig;
}) => {
  if (!process.env.SEARCH_MANIFEST_ENABLED) return;

  // Get content repo zipfile as AST representation
  await run.command('unzip -o bundle.zip');

  const branchName = configEnvironment.BRANCH;
  const repoName = configEnvironment.SITE_NAME;
  if (!repoName || !branchName) {
    //check that an environment variable for repo name was set
    throw new Error(
      'Repo or branch name was not found, manifest cannot be uploaded to Atlas or S3 ',
    );
  }

  const manifest = await generateManifest();

  console.log('=========== finished generating manifests ================');

  const {
    url,
    searchProperty,
    includeInGlobalSearch,
  }: {
    url: string;
    searchProperty: string;
    includeInGlobalSearch: boolean;
  } = await getSearchProperties({
    branchEntry: configEnvironment.BRANCH_ENTRY as BranchEntry,
    docsetEntry: configEnvironment.DOCSET_ENTRY as DocsetsDocument,
    repoEntry: configEnvironment.REPO_ENTRY as ReposBranchesDocument,
  });

  const projectName = configEnvironment.REPO_ENTRY?.project;

  console.log('=========== Uploading Manifests to S3=================');
  const uploadArgs: S3UploadParams = {
    bucket: 'docs-search-indexes-test',
    //TODO: change prefix based on environments
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
    const connectionInfo = {
      URI: dbEnvVars.ATLAS_SEARCH_URI,
      databaseName: configEnvironment.SEARCH_DB_NAME as SearchDbName,
      collectionName: dbEnvVars.DOCUMENTS_COLLECTION,
      extensionName: EXTENSION_NAME,
    };
    console.log('=========== Uploading Manifests to Atlas =================');
    const status = await uploadManifest({
      manifest,
      searchProperty,
      connectionInfo,
    });
    console.log(status);
    console.log('=========== Manifests uploaded to Atlas =================');
  } catch (e) {
    console.log('Manifest could not be uploaded', e);
  } finally {
    await closePoolDb();
    // await closeSearchDb();
  }
};

const extension = new Extension({
  isEnabled: envVarToBool(process.env.SEARCH_MANIFEST_ENABLED),
});

//Return indexing data from a page's AST for search purposes.
extension.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { run }, netlifyConfig, dbEnvVars }) => {
    await generateAndUploadManifests({
      configEnvironment: netlifyConfig?.build?.environment,
      run,
      dbEnvVars,
    });
  },
);

export { extension };
