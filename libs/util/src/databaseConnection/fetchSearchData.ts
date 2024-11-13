import type * as mongodb from 'mongodb';
import { getSearchDb } from './atlasClusterConnector';

export interface SearchDocument {
  url: string;
  slug: string;
  lastModified: Date;
  manifestRevisionId: string;
  searchProperty: Array<string>;
  includeInGlobalSearch: boolean;
}

export const getDocumentsCollection = async ({
  URI,
  databaseName,
  collectionName,
  extensionName,
}: {
  URI: string;
  databaseName: string;
  collectionName: string;
  extensionName?: string;
}): Promise<mongodb.Collection<SearchDocument>> => {
  const dbSession = await getSearchDb({
    URI,
    databaseName,
    appName: extensionName ?? '',
  });
  return dbSession.collection<SearchDocument>(collectionName);
};
