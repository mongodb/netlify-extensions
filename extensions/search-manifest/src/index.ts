import { uploadManifest } from './uploadToAtlas/uploadManifest';
import { generateManifest } from './generateManifest/index';
import type {
  DocsetsDocument,
  BranchEntry,
  ReposBranchesDocument,
} from 'util/databaseConnection/types';
import type { ConfigEnvironmentVariables } from 'populate-metadata/updateConfig';
import type { S3UploadParams } from 'util/assertDbEnvVars';
import type { NetlifyPluginUtils } from '@netlify/build';

import { getSearchProperties } from './uploadToAtlas/getProperties';
import {
  closePoolDb,
  closeSearchDb,
} from 'util/databaseConnection/atlasClusterConnector';
import { uploadManifestToS3 } from './uploadToS3/uploadManifest';
import { envVarToBool, Extension } from 'util/extension';
import type { DbConfig } from 'util/databaseConnection/types';

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

  // TODO: Should we make this into its own type??
  const searchConnectionInfo = {
    URI: dbEnvVars.ATLAS_SEARCH_URI,
    databaseName: configEnvironment.SEARCH_DB_NAME as string,
    collectionName: dbEnvVars.DOCUMENTS_COLLECTION,
    extensionName: EXTENSION_NAME,
  };

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
    connectionInfo: searchConnectionInfo,
  });

  const projectName = configEnvironment.REPO_ENTRY?.project;

  console.log('=========== Uploading Manifests to S3=================');
  const uploadParams: S3UploadParams = {
    bucket: 'docs-search-indexes-test',
    //TODO: change prefix based on environments
    prefix: 'search-indexes/ab-testing',
    fileName: `${projectName}-${branchName}.json`,
    manifest: manifest.export(),
  };

  const s3Status = await uploadManifestToS3({
    uploadParams,
    AWS_S3_ACCESS_KEY_ID: dbEnvVars.AWS_S3_ACCESS_KEY_ID,
    AWS_S3_SECRET_ACCESS_KEY: dbEnvVars.AWS_S3_SECRET_ACCESS_KEY,
  });

  console.log(`S3 upload status: ${JSON.stringify(s3Status)}`);
  console.log('=========== Finished Uploading to S3  ================');

  try {
    manifest.setUrl(url);
    manifest.setGlobalSearchValue(includeInGlobalSearch);
    console.log('=========== Uploading Manifests to Atlas =================');
    const status = await uploadManifest({
      manifest,
      searchProperty,
      connectionInfo: searchConnectionInfo,
    });
    console.log(status);
    console.log('=========== Manifests uploaded to Atlas =================');
  } catch (e) {
    console.log('Manifest could not be uploaded', e);
  } finally {
    await closePoolDb();
    await closeSearchDb();
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
