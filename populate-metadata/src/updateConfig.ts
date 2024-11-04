import type { DbConfig, Environments } from './assertDbEnvVars';
import type { DocsetsDocument } from './databaseConnection/fetchDocsetsData';
import type {
  BranchEntry,
  ReposBranchesDocument,
} from './databaseConnection/fetchReposBranchesData';
import { getProperties } from './getProperties';

export type PoolDbName = 'pool' | 'pool_test';

export type SearchDbName = 'search' | 'search-test' | 'search-stage';

export type SnootyDbName =
  | 'snooty_dev'
  | 'snooty_stage'
  | 'snooty_dotcomstg'
  | 'snooty_prod'
  | 'snooty_dotcomprd';

const getDbNames = (
  env: Environments,
): { snootyDb: SnootyDbName; searchDb: SearchDbName; poolDb: PoolDbName } => {
  switch (env) {
    case 'dotcomstg':
      return {
        snootyDb: 'snooty_dotcomstg',
        searchDb: 'search-stage',
        poolDb: 'pool_test',
      };

    case 'prd':
      return {
        snootyDb: 'snooty_prod',
        searchDb: 'search-stage',
        poolDb: 'pool',
      };

    case 'dotcomprd':
      return {
        snootyDb: 'snooty_dotcomprd',
        searchDb: 'search',
        poolDb: 'pool',
      };
    // Default to 'stg' databases
    default:
      return {
        snootyDb: 'snooty_stage',
        searchDb: 'search-test',
        poolDb: 'pool_test',
      };
  }
};

export type ConfigEnvironmentVariables = Partial<{
  BRANCH: string;
  SITE_NAME: string;
  INCOMING_HOOK_URL: string;
  INCOMING_HOOK_TITLE: string;
  INCOMING_HOOK_BODY: string;
  ENV: Environments;
  REPO_ENTRY: ReposBranchesDocument;
  DOCSET_ENTRY: DocsetsDocument;
  BRANCH_ENTRY: BranchEntry;
  POOL_DB_NAME: PoolDbName;
  SEARCH_DB_NAME: SearchDbName;
  SNOOTY_DB_NAME: SnootyDbName;
}>;

export const updateConfig = async ({
  configEnvironment,
  dbEnvVars,
}: {
  configEnvironment: ConfigEnvironmentVariables;
  dbEnvVars: DbConfig;
}): Promise<void> => {
  // Check if repo name and branch name have been set as environment variables through Netlify UI
  // Allows overwriting of database name values for testing
  const branchName = process.env.BRANCH_NAME ?? configEnvironment.BRANCH;

  console.log('REPO URL', process.env.REPOSITORY_URL);
  const repoName =
    process.env.REPO_NAME ?? process.env.REPOSITORY_URL?.split('/')?.pop();

  if (!branchName || !repoName) {
    throw new Error('Repo name or branch name missing from deploy');
  }

  // Checks if build was triggered by a webhook
  // TODO: add more specific logic dependent on hook title, url, body, etc. once Slack deploy apps have been implemented
  const isWebhookDeploy = !!(
    configEnvironment.INCOMING_HOOK_URL &&
    configEnvironment.INCOMING_HOOK_TITLE &&
    configEnvironment.INCOMING_HOOK_BODY
  );

  // Check if this was an engineering build or writer's build; writer's builds by default are all builds not built on the "mongodb-snooty" site
  // Environment is either dotcomprd or prd if it is a writer build
  const isFrontendBuild = configEnvironment.SITE_NAME === 'mongodb-snooty';
  const isFrontendStagingBuild = isWebhookDeploy || branchName === 'main';
  const env =
    (process.env.ENV as Environments) ??
    (isFrontendBuild
      ? isFrontendStagingBuild
        ? 'dotcomstg'
        : 'stg'
      : isWebhookDeploy
        ? 'dotcomprd'
        : 'prd');

  configEnvironment.ENV = env;
  // Set process.env SNOOTY_ENV environment variable for Snooty frontend to retrieve at build time
  process.env.SNOOTY_ENV = env;

  const { snootyDb, searchDb, poolDb } = getDbNames(env);

  // Check if values for the database names have been set as environment variables through Netlify UI
  // Allows overwriting of database name values for testing
  configEnvironment.POOL_DB_NAME =
    (process.env.POOL_DB_NAME as PoolDbName) ?? poolDb;

  configEnvironment.SEARCH_DB_NAME =
    (process.env.SEARCH_DB_NAME as SearchDbName) ?? searchDb;

  configEnvironment.SNOOTY_DB_NAME =
    (process.env.SNOOTY_DB_NAME as SnootyDbName) ?? snootyDb;

  const { repo, docsetEntry } = await getProperties({
    branchName,
    repoName,
    dbEnvVars,
    poolDbName: configEnvironment.POOL_DB_NAME,
    environment: env,
  });

  const { branches: branch, ...repoEntry } = repo;
  configEnvironment.REPO_ENTRY = repoEntry;
  configEnvironment.DOCSET_ENTRY = docsetEntry;
  configEnvironment.BRANCH_ENTRY = branch?.pop();

  console.info(
    'BUILD ENVIRONMENT: ',
    configEnvironment.ENV,
    '\n REPO ENTRY: ',
    configEnvironment.REPO_ENTRY,
    '\n DOCSET ENTRY: ',
    configEnvironment.DOCSET_ENTRY,
    '\n BRANCH ENTRY: ',
    configEnvironment.BRANCH_ENTRY,
    '\n pool database name: ',
    configEnvironment.POOL_DB_NAME,
    '\n search database name: ',
    configEnvironment.SEARCH_DB_NAME,
  );
};
