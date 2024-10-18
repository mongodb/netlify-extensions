import * as mongodb from 'mongodb';
import { getEnvVars } from './assertEnvVars';
import type { DocsetsDocument, ReposBranchesDocument } from './types';

const ENV_VARS = getEnvVars();

let clusterZeroClient: mongodb.MongoClient;

export const teardown = async (client: mongodb.MongoClient) => {
  await client.close();
};

// Handles memoization of db object, and initial connection logic if needs to be initialized
export const dbClient = async (uri: string) => {
  const client = new mongodb.MongoClient(uri);
  try {
    await client.connect();
    return client;
  } catch (error) {
    const err = `Error at client connection: ${error} `;
    console.error(err);
    throw err;
  }
};

//TODO: change names from snooty
export const getSnootyDb = async () => {
  if (clusterZeroClient) {
    console.info('Cluster Zero client already exists, using existing instance');
  } else {
    console.info('Creating new instance of Cluster Zero client');
    clusterZeroClient = await dbClient(ENV_VARS.ATLAS_CLUSTER0_URI);
  }
  return clusterZeroClient.db(ENV_VARS.SNOOTY_DB_NAME);
};

export const closeSnootyDb = async () => {
  if (clusterZeroClient) await teardown(clusterZeroClient);
  else {
    console.info('No client connection open to Snooty Db');
  }
};

export const getDocsetsCollection = async () => {
  const dbSession = await getSnootyDb();
  return dbSession.collection<DocsetsDocument>(ENV_VARS.DOCSETS_COLLECTION);
};

export const getReposBranchesCollection = async () => {
  const dbSession = await getSnootyDb();
  return dbSession.collection<ReposBranchesDocument>(
    ENV_VARS.REPOS_BRANCHES_COLLECTION,
  );
};
