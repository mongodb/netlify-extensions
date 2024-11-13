import type * as mongodb from 'mongodb';
import { getPoolDb } from './atlasClusterConnector';
import type { ReposBranchesDocument } from './types';

export const getReposBranchesCollection = async ({
  URI,
  databaseName,
  collectionName,
  extensionName,
}: {
  URI: string;
  databaseName: string;
  collectionName: string;
  extensionName?: string;
}): Promise<mongodb.Collection<ReposBranchesDocument>> => {
  const dbSession = await getPoolDb({
    URI,
    databaseName,
    appName: extensionName ?? '',
  });
  return dbSession.collection<ReposBranchesDocument>(collectionName);
};
