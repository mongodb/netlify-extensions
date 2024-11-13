import * as mongodb from 'mongodb';

let clusterZeroClient: mongodb.MongoClient;

export const teardown = async (client: mongodb.MongoClient): Promise<void> => {
  await client.close();
};

// Handles memoization of db object, and initial connection logic if needs to be initialized
const dbClient = async ({
  uri,
  appName,
}: { uri: string; appName: string }): Promise<mongodb.MongoClient> => {
  const client = new mongodb.MongoClient(uri, { appName });
  try {
    await client.connect();
    return client;
  } catch (error) {
    throw new Error(`Error at client connection: ${error} `);
  }
};

export const getPoolDb = async ({
  clusterZeroURI,
  databaseName,
  appName,
}: {
  clusterZeroURI: string;
  databaseName: string;
  appName: string;
}): Promise<mongodb.Db> => {
  if (!clusterZeroClient) {
    console.info('Creating new instance of Cluster Zero client');
    clusterZeroClient = await dbClient({ uri: clusterZeroURI, appName });
  }
  return clusterZeroClient.db(databaseName);
};

export const closePoolDb = async () => {
  if (clusterZeroClient) await teardown(clusterZeroClient);
  else {
    console.info('No client connection open to Cluster Zero client');
  }
};
