import type * as mongodb from 'mongodb';
import { teardown, dbClient } from './clusterConnector';

let clusterZeroClient: mongodb.MongoClient;
export const getClusterZeroDb = async ({
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

export const closeClusterZeroDb = async () => {
  if (clusterZeroClient) await teardown(clusterZeroClient);
  else {
    console.info('No client connection open to Cluster Zero client');
  }
};
