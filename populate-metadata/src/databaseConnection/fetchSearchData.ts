import { getSearchDb } from './atlasClusterConnector';
import type * as mongodb from 'mongodb';

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
  extensionName: string;
}): //TODO: specify type
Promise<mongodb.Collection<SearchDocument>> => {
  const dbSession = await getSearchDb({
    URI,
    databaseName,
    appName: extensionName,
  });
  return dbSession.collection<SearchDocument>(collectionName);
};
