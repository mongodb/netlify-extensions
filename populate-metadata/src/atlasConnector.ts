import * as mongodb from 'mongodb';
import { getEnvVars } from './assertEnvVars';
import type { DocsetsDocument, ReposBranchesDocument } from './types';

const ENV_VARS = getEnvVars();

let clusterZeroClient: mongodb.MongoClient;

export const teardown = async (client: mongodb.MongoClient): Promise<void> => {
  await client.close();
};

// Handles memoization of db object, and initial connection logic if needs to be initialized
export const dbClient = async (uri: string): Promise<mongodb.MongoClient> => {
  const client = new mongodb.MongoClient(uri);
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`Error at client connection: ${error} `);
  }
};

export const getPoolDb = async (): Promise<mongodb.Db> => {
  if (!clusterZeroClient) {
    console.info('Creating new instance of Cluster Zero client');
    clusterZeroClient = await dbClient(ENV_VARS.ATLAS_CLUSTER0_URI);
  }
  return clusterZeroClient.db(ENV_VARS.POOL_DB_NAME);
};

export const closePoolDb = async () => {
  if (clusterZeroClient) await teardown(clusterZeroClient);
  else {
    console.info('No client connection open to Cluster Zero client');
  }
};

export const getDocsetsCollection = async (): Promise<
  mongodb.Collection<DocsetsDocument>
> => {
  const dbSession = await getPoolDb();
  return dbSession.collection<DocsetsDocument>(ENV_VARS.DOCSETS_COLLECTION);
};

export const getReposBranchesCollection = async (): Promise<
  mongodb.Collection<ReposBranchesDocument>
> => {
  const dbSession = await getPoolDb();
  return dbSession.collection<ReposBranchesDocument>(
    ENV_VARS.REPOS_BRANCHES_COLLECTION,
  );
};
