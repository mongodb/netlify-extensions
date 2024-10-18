import type { Document, WithId } from 'mongodb';
import type { NetlifyConfig } from '@netlify/build';

type EnvironmentConfig = {
  dev?: string;
  stg: string;
  dotcomstg: string;
  dotcomprd: string;
  prd: string;
};

export interface BranchEntry {
  name?: string;
  gitBranchName: string;
  urlSlug: string;
  isStableBranch: boolean;
  active: boolean;
}

export interface DocsetsDocument extends WithId<Document> {
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

export type EnvVars = {
  ATLAS_CLUSTER0_URI: string;
  SNOOTY_DB_NAME: string;
  ATLAS_SEARCH_URI: string;
  SEARCH_DB_NAME: string;
  REPOS_BRANCHES_COLLECTION: string;
  DOCSETS_COLLECTION: string;
  DOCUMENTS_COLLECTION: string;
};

type configEnvironmentVariables = Partial<{
  BRANCH: string;
  SITE_NAME: string;
  INCOMING_HOOK_URL: string;
  INCOMING_HOOK_TITLE: string;
  INCOMING_HOOK_BODY: string;
  PRODUCTION: boolean;
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
  environment: configEnvironmentVariables;
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
