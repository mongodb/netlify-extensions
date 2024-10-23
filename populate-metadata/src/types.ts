import type { NetlifyConfig, NetlifyPluginOptions } from '@netlify/build';
import type { z } from 'zod';

type EnvironmentConfig = {
  dev?: string;
  stg: string;
  dotcomstg: string;
  prd: string;
  dotcomprd: string;
};

export type Environments = 'dev' | 'stg' | 'dotcomstg' | 'prd' | 'dotcomprd';

export interface BranchEntry {
  name?: string;
  gitBranchName: string;
  urlSlug: string;
  isStableBranch: boolean;
  active: boolean;
}

export interface DocsetsDocument {
  project: string;
  url: EnvironmentConfig;
  prefix: EnvironmentConfig;
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

export type DbConfig = {
  ATLAS_CLUSTER0_URI: string;
  ATLAS_SEARCH_URI: string;
  POOL_DB_NAME: PoolDbName;
  REPOS_BRANCHES_COLLECTION: CollectionNames;
  DOCSETS_COLLECTION: CollectionNames;
  DOCUMENTS_COLLECTION: string;
};

type ConfigEnvironmentVariables = Partial<{
  BRANCH: string;
  SITE_NAME: string;
  INCOMING_HOOK_URL: string;
  INCOMING_HOOK_TITLE: string;
  INCOMING_HOOK_BODY: string;
  ENV: Environments;
  REPO_ENTRY: ReposBranchesDocument;
  DOCSET_ENTRY: DocsetsDocument;
  BRANCH_ENTRY: BranchEntry[];
}>;

export interface Build {
  command?: string;
  publish: string;
  base: string;
  services: Record<string, unknown>;
  ignore?: string;
  edge_handlers?: string;
  edge_functions?: string;
  environment: ConfigEnvironmentVariables;
  processing: {
    skip_processing?: boolean;
    css: {
      bundle?: boolean;
      minify?: boolean;
    };
    js: {
      bundle?: boolean;
      minify?: boolean;
    };
    html: {
      pretty_url?: boolean;
    };
    images: {
      compress?: boolean;
    };
  };
}
export interface DocsConfig extends Omit<NetlifyConfig, 'build'> {
  build: Build;
}

export type ExtensionOptions = {
  isEnabled: boolean;
};

export type BuildHookWithEnvVars<
  DbConfig,
  BuildContext extends z.ZodSchema,
  BuildConfigSchema extends z.ZodSchema,
> = (
  options: {
    dbEnvVars: DbConfig;
    buildContext?: BuildContext;
    buildConfig?: BuildConfigSchema;
  } & Omit<NetlifyPluginOptions, 'inputs'>,
) => void | Promise<void>;

export type PoolDbName = 'pool' | 'pool_test';

export type CollectionNames = 'repos_branches' | 'docsets';

export type CollectionConnectionInfo = {
  clusterZeroURI: string;
  databaseName: PoolDbName;
  collectionName: CollectionNames;
};
