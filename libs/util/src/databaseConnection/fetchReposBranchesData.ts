import type * as mongodb from 'mongodb';
import { getPoolDb } from './clusterZeroConnector';
import type { ReposBranchesDocument } from './types';

export const getReposBranchesCollection = async ({
  clusterZeroURI,
  databaseName,
  collectionName,
  extensionName,
}: {
  clusterZeroURI: string;
  databaseName: string;
  collectionName: string;
  extensionName?: string;
}): Promise<mongodb.Collection<ReposBranchesDocument>> => {
  const dbSession = await getPoolDb({
    clusterZeroURI,
    databaseName,
    appName: extensionName ?? '',
  });
  console.log(
    `Returning new instance of collection ${collectionName} of database ${databaseName}`,
  );
  return dbSession.collection<ReposBranchesDocument>(collectionName);
};
