import type * as mongodb from 'mongodb';
import { teardown, dbClient } from './clusterConnector';

let clusterZeroClient: mongodb.MongoClient;
//create another function like this one
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
