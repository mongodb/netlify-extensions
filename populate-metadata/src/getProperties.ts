import type { Collection, WithId } from 'mongodb';
import {
  closeSnootyDb,
  getDocsetsCollection,
  getReposBranchesCollection,
} from './atlasConnector';
import type { DocsetsDocument, ReposBranchesDocument } from './types';

export const getDocsetEntry = async ({
  docsets,
  project,
}: {
  docsets: Collection<DocsetsDocument>;
  project: string;
}): Promise<WithId<DocsetsDocument>> => {
  let envProjection: Record<string, number>;

  if (process.env.ENV === 'dotcomstg') {
    envProjection = { dotcomstg: 1 };
  } else
    envProjection =
      process.env.ENV === 'dotcomprd' ? { dotcomprd: 1 } : { prd: 1 };
  const docsetsQuery = { project: { $eq: project } };
  const projection = {
    projection: {
      project: 1,
      _id: 0,
      bucket: envProjection,
      prefix: envProjection,
      url: envProjection,
    },
  };
  const docset = await docsets.findOne<DocsetsDocument>(
    docsetsQuery,
    projection,
  );
  if (!docset) {
    throw new Error('Error while getting docsets entry in Atlas');
  }
  return docset;
};

export const getRepoEntry = async ({
  repoName,
  branchName,
  repos_branches,
}: {
  repoName: string;
  branchName: string;
  repos_branches: Collection<ReposBranchesDocument>;
}) => {
  const query = {
    repoName: repoName,
  };
  const projection = {
    projection: {
      _id: 0,
      branches: { $elemMatch: { gitBranchName: branchName.toLowerCase() } },
      project: 1,
      search: 1,
      internalOnly: 1,
      prodDeployable: 1,
    },
  };
  const repo = await repos_branches.findOne<ReposBranchesDocument>(
    query,
    // projection,
  );
  console.log(await repos_branches.findOne<ReposBranchesDocument>());
  if (!repo) {
    throw new Error(
      `Could not get repos_branches entry for repo ${repoName}, ${JSON.stringify(
        query,
      )}`,
    );
  }
  return repo;
};

export const getProperties = async ({
  branchName,
  repoName,
}: {
  branchName: string;
  repoName: string;
}) => {
  //connect to database and get repos_branches, docsets collections
  const repos_branches = await getReposBranchesCollection();
  const docsets = await getDocsetsCollection();

  const repo = await getRepoEntry({
    repoName,
    branchName,
    repos_branches,
  });

  const docsetEntry = await getDocsetEntry({ docsets, project: repo.project });

  return { repo, docsetEntry };
};
