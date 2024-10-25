import type { NetlifyConfig } from '@netlify/build';
import type { DbConfig, Environments } from './assertDbEnvVars';
import type { DocsetsDocument } from './databaseConnection/fetchDocsetsData';
import type {
  BranchEntry,
  ReposBranchesDocument,
} from './databaseConnection/fetchReposBranchesData';
import { getProperties } from './getProperties';

export interface DocsConfig extends Omit<NetlifyConfig, 'build'> {
  build: Build;
}

export type PoolDbName = 'pool' | 'pool_test';

export type SearchDbName = 'search' | 'search-test';

export type SnootyDbName = 'snootydotcomstg' | 'snootydotcomprd';

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
  POOL_DB_NAME: PoolDbName;
  SEARCH_DB_NAME: SearchDbName;
  SNOOTY_DB_NAME: SnootyDbName;
}>;

interface Build {
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

export const updateConfig = async (
  configEnvironment: ConfigEnvironmentVariables,
  dbEnvVars: DbConfig,
): Promise<void> => {
  const branchName = process.env.BRANCH_NAME ?? configEnvironment.BRANCH;
  const repoName = process.env.REPO_NAME ?? configEnvironment.SITE_NAME;

  if (!branchName || !repoName) {
    throw new Error('Repo name or branch name missing from deploy');
  }

  // Check if build was triggered by a webhook
  // TODO: add more specific logic dependent on hook title, url, body, etc. once Slack deploy apps have been implemented
  const isWebhookDeploy = !!(
    configEnvironment.INCOMING_HOOK_URL &&
    configEnvironment.INCOMING_HOOK_TITLE &&
    configEnvironment.INCOMING_HOOK_BODY
  );

  // Check if this was an engineering build or writer's build; writer's builds by default are all builds not built on the "mongodb-snooty" site
  // Environment is either dotcomprd or prd if it is a writer build
  const env =
    (process.env.ENV as Environments) ??
    (configEnvironment.SITE_NAME === 'mongodb-snooty'
      ? isWebhookDeploy
        ? 'dotcomstg'
        : 'stg'
      : isWebhookDeploy
        ? 'dotcomprd'
        : 'prd');

  configEnvironment.ENV = env;

  // SET POOL DB NAME, SEARCH DB NAME here, SNOOTY db name
  configEnvironment.POOL_DB_NAME = dbEnvVars.POOL_DB_NAME =
    (dbEnvVars.POOL_DB_NAME as PoolDbName) ??
    (env === 'stg' || env === 'dotcomstg' ? 'pool_test' : 'pool');

  configEnvironment.SEARCH_DB_NAME = dbEnvVars.SEARCH_DB_NAME =
    (process.env.SEARCH_DB_NAME as SearchDbName) ??
    (env === 'dotcomstg' ? 'search-staging' : 'search');

  configEnvironment.SNOOTY_DB_NAME = dbEnvVars.SNOOTY_DB_NAME =
    (process.env.SNOOTY_DB_NAME as SnootyDbName) ??
    (env === 'stg' || env === 'dotcomstg' ? '' : 'search');

  const { repo, docsetEntry } = await getProperties({
    branchName,
    repoName,
    dbEnvVars,
    environment: env,
  });

  const { branches: branch, ...repoEntry } = repo;
  configEnvironment.REPO_ENTRY = repoEntry;
  configEnvironment.DOCSET_ENTRY = docsetEntry;
  configEnvironment.BRANCH_ENTRY = branch;

  console.info(
    'BUILD ENVIRONMENT: ',
    configEnvironment.ENV,
    '\n REPO ENTRY: ',
    configEnvironment.REPO_ENTRY,
    '\n DOCSET ENTRY: ',
    configEnvironment.DOCSET_ENTRY,
    '\n BRANCH ENTRY: ',
    configEnvironment.BRANCH_ENTRY,
  );
};
