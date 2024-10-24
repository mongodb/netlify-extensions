import { getPoolDb } from './atlasConnector';
import type * as mongodb from 'mongodb';

export interface DocsetsDocument {
  project: string;
  url: EnvironmentConfig;
  prefix: EnvironmentConfig;
}

type EnvironmentConfig = {
  dev?: string;
  stg: string;
  dotcomstg: string;
  prd: string;
  dotcomprd: string;
};

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
