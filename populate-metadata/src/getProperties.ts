import type { Collection, WithId } from 'mongodb';
import {
  closePoolDb,
  getDocsetsCollection,
  getReposBranchesCollection,
} from './atlasConnector';
import type { DocsetsDocument, ReposBranchesDocument } from './types';

const getEnvProjection = (env?: string) => {
  switch (env) {
    case 'stg':
      return { stg: 1 };
    case 'dotcomstg':
      return { dotcomstg: 1 };
    case 'prd':
      return { prd: 1 };
    case 'dotcomprd':
      return { dotcomprd: 1 };
    default:
      return { prd: 1 };
  }
};

export const getDocsetEntry = async ({
  docsets,
  projectName,
}: {
  docsets: Collection<DocsetsDocument>;
  projectName: string;
}): Promise<WithId<DocsetsDocument>> => {
  const env = process.env.ENV;
  const docsetEnvironmentProjection = getEnvProjection(env);
  const query = { project: { $eq: projectName } };
  const projection = {
    projection: {
      project: 1,
      _id: 0,
      bucket: docsetEnvironmentProjection,
      prefix: docsetEnvironmentProjection,
      url: docsetEnvironmentProjection,
    },
  };
  const docset = await docsets.findOne<DocsetsDocument>(query, projection);
  if (!docset) {
    throw new Error(
      `Could not retrieve docset entry from docsets collection for ${projectName} with query ${JSON.stringify(query)}`,
    );
  }
  return docset;
};

export const getRepoEntry = async ({
  repoName,
  branchName,
  reposBranches,
}: {
  repoName: string;
  branchName: string;
  reposBranches: Collection<ReposBranchesDocument>;
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
  const repo = await reposBranches.findOne<ReposBranchesDocument>(
    query,
    projection,
  );
  if (!repo) {
    throw new Error(
      `Could not get repos_branches entry for repo ${repoName} with query ${JSON.stringify(
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
  const reposBranches = await getReposBranchesCollection();
  const docsets = await getDocsetsCollection();

  const repo = await getRepoEntry({
    repoName,
    branchName,
    reposBranches,
  });

  const docsetEntry = await getDocsetEntry({
    docsets,
    projectName: repo.project,
  });

  closePoolDb();

  return { repo, docsetEntry };
};
