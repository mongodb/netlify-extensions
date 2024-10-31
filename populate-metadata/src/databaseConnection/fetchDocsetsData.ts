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
  clusterZeroURI,
  databaseName,
  collectionName,
  extName,
}: {
  clusterZeroURI: string;
  databaseName: string;
  collectionName: string;
  extName: string;
}): Promise<mongodb.Collection<DocsetsDocument>> => {
  const dbSession = await getPoolDb({
    clusterZeroURI,
    databaseName,
    appName: extName,
  });
  return dbSession.collection<DocsetsDocument>(collectionName);
};
