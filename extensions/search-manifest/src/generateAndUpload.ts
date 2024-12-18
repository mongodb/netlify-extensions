import type { NetlifyPluginUtils } from '@netlify/build';
import type { StaticEnvVars } from 'util/assertDbEnvVars';
import type { ConfigEnvironmentVariables } from 'util/extension';
import { getSearchProperties } from './uploadToAtlas/getSearchProperties';
import type {
  SearchDBName,
  BranchEntry,
  DocsetsDocument,
  ReposBranchesDocument,
  SearchClusterConnectionInfo,
} from 'util/databaseConnection/types';
import type { S3UploadParams } from 'util/s3Connection/types';
import { generateManifest } from './generateManifest';
import { uploadManifest } from './uploadToAtlas/uploadManifest';
import { uploadManifestToS3 } from './uploadToS3/uploadManifest';

const EXTENSION_NAME = 'search-manifest';

export const generateAndUploadManifests = async ({
  configEnvironment,
  run,
  dbEnvVars,
}: {
  configEnvironment: ConfigEnvironmentVariables;
  run: NetlifyPluginUtils['run'];
  dbEnvVars: StaticEnvVars;
}) => {
  if (process.env.ENV !== 'dotcomstg') {
    console.log(
      `shouldn't generate manifest for ${process.env.ENV}, returning`,
    );
    return;
  }
  // Get content repo zipfile as AST representation
  await run.command('unzip -o -q bundle.zip');

  const branchName = configEnvironment.BRANCH_NAME;
  const repoName = configEnvironment.REPO_NAME;
  if (!repoName || !branchName) {
    // Check that an environment variable for repo name was set
    throw new Error(
      `Repo or branch name was not found, manifest for repo ${repoName} and branch ${branchName} cannot be uploaded to Atlas or S3 `,
    );
  }

  const manifest = await generateManifest();

  console.log('=========== Finished generating manifests ================');

  const searchConnectionInfo: SearchClusterConnectionInfo = {
    searchURI: dbEnvVars.ATLAS_SEARCH_URI,
    databaseName: configEnvironment.SEARCH_DB_NAME as SearchDBName,
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
    // TODO: make into constants?
    bucket: 'docs-search-indexes-test',
    prefix:
      configEnvironment.ENV === 'dotcomprd'
        ? '/search-indexes/prd'
        : '/search-indexes/preprd',
    fileName: `${projectName}-${branchName}.json`,
    obj: manifest.export(),
  };

  const s3Status = await uploadManifestToS3({
    uploadParams,
    AWS_S3_ACCESS_KEY_ID: dbEnvVars.AWS_S3_ACCESS_KEY_ID,
    AWS_S3_SECRET_ACCESS_KEY: dbEnvVars.AWS_S3_SECRET_ACCESS_KEY,
  });

  console.log(
    `S3 upload status: ${JSON.stringify(s3Status.$metadata.httpStatusCode)}`,
  );
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
  }
};
