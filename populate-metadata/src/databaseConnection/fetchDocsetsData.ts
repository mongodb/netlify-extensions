import type * as mongodb from 'mongodb';
import { getPoolDb } from './atlasClusterConnector';

type EnvironmentConfig = {
  dev?: string;
  stg: string;
  dotcomstg: string;
  prd: string;
  dotcomprd: string;
};
export interface DocsetsDocument {
  project: string;
  bucket: string;
  url: EnvironmentConfig;
  prefix: EnvironmentConfig;
}

export const getDocsetsCollection = async ({
  URI,
  databaseName,
  collectionName,
  extensionName,
}: {
  URI: string;
  databaseName: string;
  collectionName: string;
  extensionName: string;
}): Promise<mongodb.Collection<DocsetsDocument>> => {
  const dbSession = await getPoolDb({
    URI,
    databaseName,
    appName: extensionName,
  });
  return dbSession.collection<DocsetsDocument>(collectionName);
};
