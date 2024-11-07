import type { WithId } from 'mongodb';
import type { Environments } from './assertDbEnvVars';

type EnvironmentConfig = {
  dev: string;
  stg: string;
  dotcomstg: string;
  dotcomprd: string;
  prd: string;
};

export interface DocsetsDocument {
  project: string;
  url: EnvironmentConfig;
  prefix: EnvironmentConfig;
  bucket: EnvironmentConfig;
}

export interface ReposBranchesDocument extends WithId<Document> {
  project: string;
  search: {
    categoryTitle: string;
    categoryName?: string;
  };
  branches: Array<BranchEntry>;
  prodDeployable: boolean;
  internalOnly: boolean;
}

export interface BranchEntry {
  name?: string;
  gitBranchName: string;
  urlSlug: string;
  isStableBranch: boolean;
  active: boolean;
}

// TODO: once brandon's ticket is complete this want have to be declared in each extension
export type PoolDbName = 'pool' | 'pool_test';

export type SearchDbName = 'search' | 'search-test' | 'search-stage';

export type SnootyDbName =
  | 'snooty_dev'
  | 'snooty_stage'
  | 'snooty_dotcomstg'
  | 'snooty_prod'
  | 'snooty_dotcomprd';

export type ConfigEnvironmentVariables = Partial<{
  BRANCH: string;
  SITE_NAME: string;
  INCOMING_HOOK_URL: string;
  INCOMING_HOOK_TITLE: string;
  INCOMING_HOOK_BODY: string;
  ENV: Environments;
  REPO_ENTRY: ReposBranchesDocument;
  DOCSET_ENTRY: DocsetsDocument;
  BRANCH_ENTRY: BranchEntry[];
  POOL_DB_NAME: PoolDbName;
  SEARCH_DB_NAME: SearchDbName;
  SNOOTY_DB_NAME: SnootyDbName;
}>;
