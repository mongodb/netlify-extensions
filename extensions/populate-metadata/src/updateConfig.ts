import type {
  DbConfig,
  Environments,
  PoolDbName,
} from 'util/databaseConnection/types';
import { getProperties } from './getProperties';
import type { ConfigEnvironmentVariables } from 'util/extension';

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

export const determineEnvironment = ({
  isBuildHookDeploy,
  siteName,
}: { isBuildHookDeploy: boolean; siteName: string }) => {
  // Check if this was an engineering build or writer's build; writer's builds by default are all builds not built on the "mongodb-snooty" site
  // Environment is either dotcomprd or prd if it is a writer build

  const frontendSites = [
    'docs-frontend-stg',
    'docs-frontend-dotcomstg',
    'docs-frontend-dotcomprd',
  ];
  const isFrontendBuild = frontendSites.includes(siteName);

  let env: Environments;
  if (!isFrontendBuild) {
    env = 'prd';
  } else if (isBuildHookDeploy) {
    if (siteName === 'docs-frontend-dotcomprd') {
      env = 'dotcomprd';
      // TODO: check hook url??
    } else if (siteName === 'docs-frontend-dotcomstg') {
      env = 'dotcomstg';
      // TODO: check hook url??
    }
  } else env = 'stg';
};
export const updateConfig = async ({
  configEnvironment,
  dbEnvVars,
}: {
  configEnvironment: ConfigEnvironmentVariables;
  dbEnvVars: DbConfig;
}): Promise<void> => {
  // Checks if build was triggered by a webhook
  // TODO: add more specific logic dependent on hook title, url, body, etc. once Slack deploy apps have been implemented
  const isBuildHookDeploy = !!(
    configEnvironment.INCOMING_HOOK_URL &&
    configEnvironment.INCOMING_HOOK_TITLE &&
    configEnvironment.INCOMING_HOOK_BODY
  );
  const env = determineEnvironment({
    isBuildHookDeploy,
    siteName: configEnvironment.SITE_NAME as string,
  });

  const buildEnvironment = (process.env.ENV as Environments) ?? env;

  configEnvironment.ENV = buildEnvironment;

  const { snootyDb, searchDb, poolDb } = getDbNames(buildEnvironment);

  // Check if values for the database names have been set as environment variables through Netlify UI
  // Allows overwriting of database name values for testing
  configEnvironment.POOL_DB_NAME =
    (process.env.POOL_DB_NAME as PoolDbName) ?? poolDb;

  configEnvironment.SEARCH_DB_NAME =
    (process.env.SEARCH_DB_NAME as SearchDbName) ?? searchDb;

  configEnvironment.SNOOTY_DB_NAME =
    (process.env.SNOOTY_DB_NAME as SnootyDbName) ?? snootyDb;

  // Check if repo name and branch name have been set as environment variables through Netlify UI
  // Allows overwriting of database name values for testing
  let branchName: string;
  let repoName: string;
  if (buildEnvironment !== 'dotcomstg' && buildEnvironment !== 'dotcomprd') {
    branchName =
      process.env.BRANCH_NAME ?? (configEnvironment.BRANCH as string);
    repoName =
      process.env.REPO_NAME ??
      (process.env.REPOSITORY_URL?.split('/')?.pop() as string);
  } else {
    // Branch name and repo name to deploy sent as values in Build Hook payload if in dotcomprd or dotcomstg environments
    [branchName, repoName] = configEnvironment?.INCOMING_HOOK_BODY?.split(
      '',
    ) as string[];
  }

  if (!branchName || !repoName) {
    throw new Error('Repo name or branch name missing from deploy');
  }
  const { repo, docsetEntry } = await getProperties({
    branchName,
    repoName,
    dbEnvVars,
    poolDbName: configEnvironment.POOL_DB_NAME,
    environment: buildEnvironment,
  });

  // Set process.env SNOOTY_ENV and PREFIX_PATH environment variables for frontend to retrieve at build time
  process.env.SNOOTY_ENV = buildEnvironment;
  process.env.PATH_PREFIX = docsetEntry.prefix[buildEnvironment];

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
    '\n POOL DB NAME: ',
    configEnvironment.POOL_DB_NAME,
    '\n SEARCH DB NAME: ',
    configEnvironment.SEARCH_DB_NAME,
  );
};
