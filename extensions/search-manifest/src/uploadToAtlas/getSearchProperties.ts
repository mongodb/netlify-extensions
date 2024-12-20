import type {
  BranchEntry,
  ReposBranchesDocument,
  DocsetsDocument,
  SearchClusterConnectionInfo,
} from 'util/databaseConnection/types';
import { assertTrailingSlash } from '../utils';

export const getSearchProperties = async ({
  branchEntry,
  docsetEntry,
  repoEntry,
}: {
  branchEntry: BranchEntry;
  docsetEntry: DocsetsDocument;
  repoEntry: ReposBranchesDocument;
}) => {
  const url = assertTrailingSlash(
    Object.values(docsetEntry.url)[0] + Object.values(docsetEntry.prefix)[0],
  );

  const version = branchEntry.urlSlug || branchEntry.gitBranchName;
  const searchProperty = `${repoEntry.search?.categoryName || repoEntry.project}-${version}`;
  const includeInGlobalSearch = branchEntry.isStableBranch;

  const active = branchEntry.active;

  return {
    active,
    searchProperty,
    url,
    includeInGlobalSearch,
  };
};
