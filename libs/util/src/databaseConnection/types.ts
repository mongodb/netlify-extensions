export type PoolDbName = 'pool' | 'pool_test';

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
export type CollectionName = 'repos_branches' | 'docsets' | 'documents';

export type CollectionConnectionInfo = {
  clusterZeroURI: string;
  databaseName: PoolDbName;
  collectionName: CollectionName;
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

export type Environments = 'dev' | 'stg' | 'dotcomstg' | 'prd' | 'dotcomprd';

export type S3UploadParams = {
  bucket: string;
  prefix: string;
  fileName: string;
  manifest: string;
};

export type DbConfig = {
  ATLAS_CLUSTER0_URI: string;
  ATLAS_SEARCH_URI: string;
  AWS_S3_ACCESS_KEY_ID: string;
  AWS_S3_SECRET_ACCESS_KEY: string;
  DOCSETS_COLLECTION: CollectionName;
  DOCUMENTS_COLLECTION: CollectionName;
  REPOS_BRANCHES_COLLECTION: CollectionName;
  SLACK_SIGNING_SECRET: string;
};
