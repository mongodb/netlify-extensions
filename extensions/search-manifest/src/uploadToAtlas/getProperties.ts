import type {
  BranchEntry,
  ReposBranchesDocument,
  DocsetsDocument,
} from 'util/databaseConnection/types';
import { assertTrailingSlash } from '../utils';
import { deleteStaleProperties } from './deleteStale';
import type { CollectionConnectionInfo } from 'util/databaseConnection/atlasClusterConnector';

export const getSearchProperties = async ({
  branchEntry,
  docsetEntry,
  repoEntry,
  connectionInfo,
}: {
  branchEntry: BranchEntry;
  docsetEntry: DocsetsDocument;
  repoEntry: ReposBranchesDocument;
  connectionInfo: CollectionConnectionInfo;
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
    await deleteStaleProperties(searchProperty, connectionInfo);
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
