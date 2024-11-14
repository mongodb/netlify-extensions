import { type Collection, type Db, DbOptions } from 'mongodb';
import type {
  BranchEntry,
  DocsetsDocument,
  ReposBranchesDocument,
  SearchDocument,
} from '../types';
import { assertTrailingSlash } from '../utils';
import { deleteStaleProperties } from './deleteStale';
import {
  getDocsetsCollection,
  getReposBranchesCollection,
} from './searchConnector';

export const getDocsetEntry = async (
  docsets: Collection<DocsetsDocument>,
  project: string,
) => {
  const docsetsQuery = { project: { $eq: project } };
  const docset = await docsets.findOne<DocsetsDocument>(docsetsQuery);
  if (!docset) {
    throw new Error('Error while getting docsets entry in Atlas');
  }
  return docset;
};

export const getRepoEntry = async ({
  repoName,
  repos_branches,
}: {
  repoName: string;
  repos_branches: Collection<ReposBranchesDocument>;
}) => {
  const query = {
    repoName: repoName,
  };

  const repo = await repos_branches.findOne<ReposBranchesDocument>(query, {
    projection: {
      _id: 0,
      project: 1,
      search: 1,
      branches: 1,
      prodDeployable: 1,
      internalOnly: 1,
    },
  });
  if (!repo) {
    throw new Error(
      `Could not get repos_branches entry for repo ${repoName}, ${repo}, ${JSON.stringify(
        query,
      )}`,
    );
  }
  if (
    repo.internalOnly ||
    !repo.prodDeployable ||
    !repo.search?.categoryTitle
  ) {
    // deletestaleproperties here for ALL manifests beginning with this repo? or just for this project-version searchproperty
    await deleteStaleProperties(repo.project);
    throw new Error(
      `Search manifest should not be generated for repo ${repoName}. Removing all associated manifests`,
    );
  }

  return repo;
};

// helper function to find the associated branch
export const getBranch = (branches: Array<BranchEntry>, branchName: string) => {
  const branchObj = branches.find(
    (branch) => branch.gitBranchName.toLowerCase() === branchName.toLowerCase(),
  );
  if (!branchObj)
    throw new Error(`Branch ${branchName} not found in branches object`);
  return branchObj;
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

  const repo: ReposBranchesDocument = await getRepoEntry({
    repoName: repoName,
    repos_branches,
  });

  const { project } = repo;

  const docsetEntry = await getDocsetEntry(docsets, project);
  //TODO: change based on environment
  const url = assertTrailingSlash(
    docsetEntry.url?.dotcomprd + docsetEntry.prefix.dotcomprd,
  );

  const { isStableBranch, gitBranchName, active, urlSlug } = getBranch(
    repo.branches,
    branchName,
  );

  const includeInGlobalSearch = isStableBranch;
  const version = urlSlug || gitBranchName;
  const searchProperty = `${repo.search?.categoryName ?? project}-${version}`;

  if (!active) {
    await deleteStaleProperties(searchProperty);
    throw new Error(
      `Search manifest should not be generated for inactive version ${version} of repo ${repoName}. Removing all associated manifests`,
    );
  }
  return {
    searchProperty,
    projectName: project,
    url,
    includeInGlobalSearch,
  };
};
