import type * as mongodb from 'mongodb';
import { getPoolDb } from './clusterZeroConnector';
import type { DocsetsDocument } from './types';

export const getDocsetsCollection = async ({
  clusterZeroURI,
  databaseName,
  collectionName,
  extensionName,
}: {
  clusterZeroURI: string;
  databaseName: string;
  collectionName: string;
  extensionName?: string;
}): Promise<mongodb.Collection<DocsetsDocument>> => {
  const dbSession = await getPoolDb({
    clusterZeroURI,
    databaseName,
    appName: extensionName ?? '',
  });
  return dbSession.collection<DocsetsDocument>(collectionName);
};
