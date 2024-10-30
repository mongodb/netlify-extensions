import type * as mongodb from 'mongodb';
import { getPoolDb } from './clusterZeroConnector';

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
  clusterZeroURI,
  databaseName,
  collectionName,
}: {
  clusterZeroURI: string;
  databaseName: string;
  collectionName: string;
}): Promise<mongodb.Collection<DocsetsDocument>> => {
  const dbSession = await getPoolDb({ clusterZeroURI, databaseName });
  return dbSession.collection<DocsetsDocument>(collectionName);
};
