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
import {
  uploadManifestToS3,
  type S3UploadInfo,
} from './uploadToS3/uploadManifest';
import { deleteStaleProperties } from './uploadToAtlas/deleteStale';

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
  // Get content repo zipfile as AST representation
  await run.command('unzip -o -q bundle.zip');

  const branchName = configEnvironment.BRANCH_NAME;
  const repoName = configEnvironment.REPO_NAME;
  if (!repoName || !branchName) {
    // Check that an environment variable for repo name was set
    throw new Error(
      `Repo or branch name was not found, manifest for repo ${repoName} and branch ${branchName} cannot be generated `,
    );
  }

  const searchConnectionInfo: SearchClusterConnectionInfo = {
    searchURI: dbEnvVars.ATLAS_SEARCH_URI,
    databaseName: configEnvironment.SEARCH_DB_NAME as SearchDBName,
    collectionName: dbEnvVars.DOCUMENTS_COLLECTION,
    extensionName: EXTENSION_NAME,
  };

  const {
    active,
    url,
    searchProperty,
    includeInGlobalSearch,
  }: {
    active: boolean;
    url: string;
    searchProperty: string;
    includeInGlobalSearch: boolean;
  } = await getSearchProperties({
    branchEntry: configEnvironment.BRANCH_ENTRY as BranchEntry,
    docsetEntry: configEnvironment.DOCSET_ENTRY as DocsetsDocument,
    repoEntry: configEnvironment.REPO_ENTRY as ReposBranchesDocument,
  });

  if (!active) {
    console.log(
      `Version is inactive, search manifest should not be generated for ${JSON.stringify(searchProperty)}. Removing all associated manifests from database`,
    );
    await deleteStaleProperties(searchProperty, searchConnectionInfo);
    return;
  }

  const manifest = await generateManifest({ url, includeInGlobalSearch });

  console.log('=========== Finished generating manifests ================');

  console.log('=========== Uploading Manifests to S3=================');

  const projectName = configEnvironment.REPO_ENTRY?.project;

  const s3Prefix =
    configEnvironment.ENV === 'dotcomprd'
      ? '/search-indexes/prd'
      : '/search-indexes/preprd';

  const uploadParams: S3UploadInfo = {
    // We upload all search manifest to a single search bucket and separate environments by path
    bucket: dbEnvVars.S3_SEARCH_BUCKET,
    prefix: s3Prefix,
    fileName: `${projectName}-${branchName}.json`,
    body: manifest.export(),
    AWS_S3_ACCESS_KEY_ID: dbEnvVars.AWS_S3_ACCESS_KEY_ID,
    AWS_S3_SECRET_ACCESS_KEY: dbEnvVars.AWS_S3_SECRET_ACCESS_KEY,
  };

  const s3Status = await uploadManifestToS3(uploadParams);

  console.log(`S3 upload status: ${s3Status.$metadata.httpStatusCode}`);
  console.log(
    `=========== Finished Uploading to S3 ${dbEnvVars.S3_SEARCH_BUCKET}${s3Prefix} ================`,
  );

  try {
    console.log(
      `=========== Uploading Manifests to Atlas database ${configEnvironment.SEARCH_DB_NAME} in collection ${dbEnvVars.DOCUMENTS_COLLECTION} =================`,
    );
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
