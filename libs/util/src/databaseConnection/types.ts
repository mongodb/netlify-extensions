import type { ObjectId } from 'mongodb';

export type Environments = 'dev' | 'stg' | 'dotcomstg' | 'prd' | 'dotcomprd';

export type EnvironmentConfig = {
  dev?: string;
  stg: string;
  dotcomstg: string;
  prd: string;
  dotcomprd: string;
};

export type DocsetsDocument = {
  project: string;
  bucket: string;
  url: EnvironmentConfig;
  prefix: EnvironmentConfig;
};

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

export type BranchEntry = {
  name?: string;
  gitBranchName: string;
  urlSlug: string;
  isStableBranch: boolean;
  active: boolean;
};

export type ReposBranchesDocument = {
  repoName: string;
  project: string;
  search?: {
    categoryTitle: string;
    categoryName?: string;
  };
  branches?: Array<BranchEntry>;
  prodDeployable: boolean;
  internalOnly: boolean;
};

export type S3UploadParams = {
  bucket: string;
  prefix: string;
  fileName: string;
  obj: string;
};

export type SearchDocument = {
  url: string;
  slug: string;
  lastModified: Date;
  manifestRevisionId: string;
  searchProperty: Array<string>;
  includeInGlobalSearch: boolean;
};

export type ProjectsDocument = {
  name: string;
  owner: string;
  baseUrl: string;
  github: {
    organization: OrganizationName;
    repo: string;
  };
  jira: {
    component: string;
  };
};

export type OASFilesDocument = {
  api: string;
  fileContent: string;
  gitHash: string;
  version: Record<string, Array<string>>;
};

export type DocumentsDocument = {
  page_id: string;
  filename: string;
  ast: any;
  source: string;
  static_assets: Array<any>;
  github_username: string;
  facets?: Array<Record<string, any>>;
  build_id: ObjectId;
  created_at: Date;
};

export type OrganizationName = 'mongodb' | '10gen';

export type SearchDBName = 'search' | 'search-test' | 'search-staging';

export type PoolDBName = 'pool' | 'pool_test';

export type MetadataDBName = 'docs_metadata';

export type SnootyDBName =
  | 'test'
  | 'snooty_dev'
  | 'snooty_prod'
  | 'snooty_dotcomstg'
  | 'snooty_dotcomprd';

export type ClusterZeroDBName = PoolDBName | MetadataDBName | SnootyDBName;
