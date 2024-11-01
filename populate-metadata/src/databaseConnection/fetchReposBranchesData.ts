import type * as mongodb from 'mongodb';
import { getPoolDb } from './atlasClusterConnector';

export interface BranchEntry {
  name?: string;
  gitBranchName: string;
  urlSlug: string;
  isStableBranch: boolean;
  active: boolean;
}

export interface ReposBranchesDocument {
  repoName: string;
  project: string;
  search?: {
    categoryTitle: string;
    categoryName?: string;
  };
  branches?: Array<BranchEntry>;
  prodDeployable: boolean;
  internalOnly: boolean;
}

export const getReposBranchesCollection = async ({
  clusterZeroURI,
  databaseName,
  collectionName,
  extName,
}: {
  clusterZeroURI: string;
  databaseName: string;
  collectionName: string;
  extName: string;
}): Promise<mongodb.Collection<ReposBranchesDocument>> => {
  const dbSession = await getPoolDb({
    clusterZeroURI,
    databaseName,
    appName: extName,
  });
  return dbSession.collection<ReposBranchesDocument>(collectionName);
};
