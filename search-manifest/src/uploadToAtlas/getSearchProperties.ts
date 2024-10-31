import type {
  BranchEntry,
  DocsetsDocument,
  ReposBranchesDocument,
} from '../types';
import { assertTrailingSlash } from '../utils';
import { deleteStaleProperties } from './deleteStale';

export const getSearchProperties = async ({
  branchEntry,
  docsetEntry,
  repoEntry,
}: {
  branchEntry: BranchEntry;
  docsetEntry: DocsetsDocument;
  repoEntry: ReposBranchesDocument;
}) => {
  //TODO: change based on environment
  const url = assertTrailingSlash(
    docsetEntry.url?.dotcomprd + docsetEntry.prefix.dotcomprd,
  );

  const version = branchEntry.urlSlug ?? branchEntry.gitBranchName;
  const searchProperty = `${repoEntry.search?.categoryName ?? repoEntry}-${version}`;
  const includeInGlobalSearch = branchEntry.isStableBranch;

  const active = branchEntry.active;

  if (!active) {
    await deleteStaleProperties(searchProperty);
    throw new Error(
      `Search manifest should not be generated for inactive version ${version} of repo ${repoEntry.repoName}. Removing all associated manifests`,
    );
  }
  return {
    searchProperty,
    url,
    includeInGlobalSearch,
  };
};
