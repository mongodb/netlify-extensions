import type * as mongodb from 'mongodb';
import { getPoolDb } from './atlasConnector';

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
}: {
  clusterZeroURI: string;
  databaseName: string;
  collectionName: string;
}): Promise<mongodb.Collection<ReposBranchesDocument>> => {
  const dbSession = await getPoolDb({ clusterZeroURI, databaseName });
  return dbSession.collection<ReposBranchesDocument>(collectionName);
};
