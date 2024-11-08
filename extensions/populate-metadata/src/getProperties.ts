import type { DbConfig, Environments } from './assertDbEnvVars';
import {
  type CollectionConnectionInfo,
  closePoolDb,
} from './databaseConnection/atlasClusterConnector';
import {
  type DocsetsDocument,
  getDocsetsCollection,
} from './databaseConnection/fetchDocsetsData';
import {
  type ReposBranchesDocument,
  getReposBranchesCollection,
} from './databaseConnection/fetchReposBranchesData';
import type { PoolDbName } from './updateConfig';
const EXTENSION_NAME = 'populate-metadata-extension';

const getEnvProjection = (env?: Environments) => {
  return Object.fromEntries([[env ?? 'prd', 1]]);
};

const getDocsetEntry = async ({
  docsetsConnectionInfo,
  projectName,
  environment,
}: {
  docsetsConnectionInfo: CollectionConnectionInfo;
  projectName: string;
  environment: Environments;
}): Promise<DocsetsDocument> => {
  const docsets = await getDocsetsCollection({
    ...docsetsConnectionInfo,
  });
  const docsetEnvironmentProjection = getEnvProjection(environment);
  const query = { project: { $eq: projectName } };
  const projection = {
    projection: {
      project: 1,
      _id: 0,
      bucket: docsetEnvironmentProjection,
      prefix: docsetEnvironmentProjection,
      url: docsetEnvironmentProjection,
    },
  };

  const docset = await docsets.findOne<DocsetsDocument>(query, projection);
  if (!docset) {
    throw new Error(
      `Could not retrieve docset entry from docsets collection for ${projectName} with query ${JSON.stringify(query)}`,
    );
  }
  return docset;
};

const getRepoEntry = async ({
  repoName,
  branchName,
  connectionInfo,
}: {
  repoName: string;
  branchName: string;
  connectionInfo: CollectionConnectionInfo;
}): Promise<ReposBranchesDocument> => {
  const reposBranches = await getReposBranchesCollection({
    ...connectionInfo,
  });

  const query = {
    repoName: repoName,
  };
  const projection = {
    projection: {
      _id: 0,
      repoName: 1,
      branches: { $elemMatch: { gitBranchName: branchName.toLowerCase() } },
      project: 1,
      search: 1,
      internalOnly: 1,
      prodDeployable: 1,
    },
  };
  const repo = await reposBranches.findOne<ReposBranchesDocument>(
    query,
    projection,
  );
  if (!repo) {
    throw new Error(
      `Could not get repos_branches entry for repo ${repoName} with query ${JSON.stringify(
        query,
      )}`,
    );
  }
  return repo;
};

export const getProperties = async ({
  branchName,
  repoName,
  dbEnvVars,
  poolDbName,
  environment,
}: {
  branchName: string;
  repoName: string;
  dbEnvVars: DbConfig;
  poolDbName: PoolDbName;
  environment: Environments;
}): Promise<{ repo: ReposBranchesDocument; docsetEntry: DocsetsDocument }> => {
  const repoBranchesConnectionInfo = {
    URI: dbEnvVars.ATLAS_CLUSTER0_URI,
    databaseName: poolDbName,
    collectionName: dbEnvVars.REPOS_BRANCHES_COLLECTION,
    extensionName: EXTENSION_NAME,
  };

  const repo = await getRepoEntry({
    repoName,
    branchName,
    connectionInfo: repoBranchesConnectionInfo,
  });

  const docsetsConnectionInfo = {
    URI: dbEnvVars.ATLAS_CLUSTER0_URI,
    databaseName: poolDbName,
    collectionName: dbEnvVars.DOCSETS_COLLECTION,
    extensionName: EXTENSION_NAME,
  };

  const docsetEntry = await getDocsetEntry({
    docsetsConnectionInfo,
    projectName: repo.project,
    environment,
  });

  closePoolDb();

  return { repo, docsetEntry };
};
