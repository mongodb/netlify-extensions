import type { UpdateResult } from 'mongodb';
import { join } from 'node:path';
import type {
  BranchEntry,
  ReposBranchesDocument,
} from 'util/databaseConnection/types';
import {
  getClusterZeroDb,
  type clusterZeroParams,
} from 'util/databaseConnection/clusterZeroConnector';
import type { CollectionName } from 'util/assertDbEnvVars';

type updateParams = {
  branchEntry: BranchEntry;
  repoEntry: ReposBranchesDocument;
  collectionName?: CollectionName;
};

function getUrl(baseUrl: string, fileName: string) {
  return join(baseUrl, 'docs', 'offline', fileName);
}

export const updateReposBranches = async (
  { repoEntry, branchEntry, collectionName }: updateParams,
  connectionParams: clusterZeroParams,
  baseUrl: string,
  fileName: string,
): Promise<UpdateResult<ReposBranchesDocument>> => {
  const dbSession = await getClusterZeroDb(connectionParams);
  const reposBranchesCollection = dbSession.collection<ReposBranchesDocument>(
    collectionName ?? 'repos_branches',
  );

  const updateFilter = { _id: repoEntry._id, 'branches.id': branchEntry._id };

  const updateParams = {
    $set: { 'branches.$.offlineUrl': getUrl(baseUrl, fileName) },
  };

  console.log(
    `Updating repos branches collection for collection ${collectionName} for repo id ${repoEntry._id} for branch ${branchEntry.gitBranchName}`,
  );

  return reposBranchesCollection.updateOne(updateFilter, updateParams);
};
