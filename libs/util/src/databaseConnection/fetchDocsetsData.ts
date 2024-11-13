import type * as mongodb from 'mongodb';
import { getPoolDb } from './atlasClusterConnector';
import type { DocsetsDocument } from './types';

export const getDocsetsCollection = async ({
  URI,
  databaseName,
  collectionName,
  extensionName,
}: {
  URI: string;
  databaseName: string;
  collectionName: string;
  extensionName?: string;
}): Promise<mongodb.Collection<DocsetsDocument>> => {
  const dbSession = await getPoolDb({
    URI,
    databaseName,
    appName: extensionName ?? '',
  });
  return dbSession.collection<DocsetsDocument>(collectionName);
};
