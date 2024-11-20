export type Environments = 'dev' | 'stg' | 'dotcomstg' | 'prd' | 'dotcomprd';

export interface EnvironmentConfig {
  dev?: string;
  stg: string;
  dotcomstg: string;
  prd: string;
  dotcomprd: string;
}

export interface DocsetsDocument {
  project: string;
  bucket: string;
  url: EnvironmentConfig;
  prefix: EnvironmentConfig;
}

export type clusterZeroConnectionInfo = {
  clusterZeroURI: string;
  databaseName: ClusterZeroDBName;
  collectionName: string;
  extensionName: string;
};

export type SearchClusterConnectionInfo = {
  searchURI: string;
  databaseName: SearchDBName;
  collectionName: string;
  extensionName: string;
};

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

export type S3UploadParams = {
  bucket: string;
  prefix: string;
  fileName: string;
  obj: string;
};

export interface SearchDocument {
  url: string;
  slug: string;
  lastModified: Date;
  manifestRevisionId: string;
  searchProperty: Array<string>;
  includeInGlobalSearch: boolean;
}

export type SearchDBName = 'search' | 'search-test' | 'search-staging';

export type PoolDBName = 'pool' | 'pool_test';

export type SnootyDBName =
  | 'test'
  | 'snooty_dev'
  | 'snooty_prod'
  | 'snooty_dotcomstg'
  | 'snooty_dotcomprd';

export type ClusterZeroDBName = PoolDBName | 'docs_metadata' | SnootyDBName;
