import type {
  Environments,
  PoolDBName,
  SnootyDBName,
  SearchDBName,
  OrganizationName,
} from 'util/databaseConnection/types';
import { getProperties } from './getProperties';
import type { ConfigEnvironmentVariables } from 'util/extension';
import type { StaticEnvVars } from 'util/assertDbEnvVars';
import type { NetlifyPluginUtils } from '@netlify/build';
import * as fs from 'node:fs';

const FRONTEND_SITES = [
  'docs-frontend-stg',
  'docs-frontend-dotcomstg',
  'docs-frontend-dotcomprd',
];

const getDbNames = (
  env: Environments,
): { snootyDb: SnootyDBName; searchDb: SearchDBName; poolDb: PoolDBName } => {
  switch (env) {
    case 'dotcomstg':
      return {
        snootyDb: 'snooty_dotcomstg',
        searchDb: 'search-staging',
        poolDb: 'pool_test',
      };

    case 'prd':
      return {
        snootyDb: 'snooty_prod',
        searchDb: 'search-test',
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
        snootyDb: 'snooty_dev',
        searchDb: 'search-test',
        poolDb: 'pool_test',
      };
  }
};

const determineEnvironment = ({
  isBuildHookDeploy,
  siteName,
}: { isBuildHookDeploy: boolean; siteName: string }): Environments => {
  // Check if this was an engineer's build or writer's build
  const isFrontendBuild = FRONTEND_SITES.includes(siteName);

  //Writer's builds = prd, everything not built on a frontend site (a site with 'Snooty' as git source)
  if (!isFrontendBuild) {
    return 'prd';
  }
  if (isBuildHookDeploy) {
    if (siteName === 'docs-frontend-dotcomprd') {
      return 'dotcomprd';
    }
    if (siteName === 'docs-frontend-dotcomstg') {
      return 'dotcomstg';
    }
  }
  return 'stg';
};

const cloneContentRepo = async ({
  run,
  repoName,
  branchName,
  orgName,
}: {
  run: NetlifyPluginUtils['run'];
  repoName: string;
  branchName: string;
  orgName: string;
}) => {
  if (fs.existsSync(`${process.cwd()}/${repoName}`)) {
    await run.command(`rm -r ${process.cwd()}/${repoName}`);
  }

  await run.command(
    `git clone -b ${branchName} https://${process.env.GITHUB_BOT_USERNAME}:${process.env.GITHUB_BOT_PWD}@github.com/${orgName}/${repoName}.git -s`,
  );

  if (repoName === 'docs-laravel') {
    process.chdir(`${repoName}`);
    await run.command('git submodule update --init --recursive');
    await run.command('echo submodule updated successfully');

    await run.command('mkdir source');
    await run.command('ls laravel-mongodb');
    await run.command(
      `rsync -r -q -av ${process.cwd()}/laravel-mongodb/docs source`,
    );
    await run.command('ls');
  }

  // Remove git config as it stores the connection string in plain text
  if (fs.existsSync(`${repoName}/.git/config`)) {
    await run.command(`rm -r ${repoName}/.git/config`);
  }
};

export const updateConfig = async ({
  configEnvironment,
  dbEnvVars,
  run,
}: {
  configEnvironment: ConfigEnvironmentVariables;
  dbEnvVars: StaticEnvVars;
  run: NetlifyPluginUtils['run'];
}): Promise<void> => {
  // Check if this was a build triggered by a frontend change or a content repo change
  const isFrontendBuild = FRONTEND_SITES.includes(
    configEnvironment.SITE_NAME as string,
  );
  // Checks if build was triggered by a webhook
  const isBuildHookDeploy = !!(
    configEnvironment.INCOMING_HOOK_URL && configEnvironment.INCOMING_HOOK_TITLE
  );

  // Determine which repository and branch to build
  // Check if repo name and branch name have been set as environment variables through Netlify UI, allows overwriting of database name values
  const repoName = isBuildHookDeploy
    ? JSON.parse(configEnvironment?.INCOMING_HOOK_BODY as string)?.repoName
    : (process.env.REPO_NAME ??
      (process.env.REPOSITORY_URL?.split('/')?.pop() as string));

  const branchName: string = isBuildHookDeploy
    ? JSON.parse(configEnvironment?.INCOMING_HOOK_BODY as string)?.branchName
    : (process.env.BRANCH_NAME ?? (configEnvironment.BRANCH as string));

  if (!repoName || !branchName) {
    throw new Error('Repo name or branch name missing from deploy');
  }

  configEnvironment.BRANCH_NAME = branchName;
  configEnvironment.REPO_NAME = repoName;

  // Determine which environment the build will run in
  const env = determineEnvironment({
    isBuildHookDeploy,
    siteName: configEnvironment.SITE_NAME as string,
  });

  const buildEnvironment = (process.env.ENV as Environments) ?? env;

  configEnvironment.ENV = buildEnvironment;

  // Get the names of the databases associated with given build environment
  const { snootyDb, searchDb, poolDb } = getDbNames(buildEnvironment);

  // Check if values for the database names have been set as environment variables through Netlify UI
  // Allows overwriting of database name values for testing
  configEnvironment.POOL_DB_NAME =
    (process.env.POOL_DB_NAME as PoolDBName) ?? poolDb;

  configEnvironment.SEARCH_DB_NAME =
    (process.env.SEARCH_DB_NAME as SearchDBName) ?? searchDb;

  configEnvironment.SNOOTY_DB_NAME =
    (process.env.SNOOTY_DB_NAME as SnootyDBName) ?? snootyDb;

  const { repo, docsetEntry, projectsEntry } = await getProperties({
    branchName,
    repoName,
    dbEnvVars,
    poolDbName: configEnvironment.POOL_DB_NAME,
    environment: buildEnvironment,
  });

  const { branches: branch, ...repoEntry } = repo;
  configEnvironment.REPO_ENTRY = repoEntry;
  configEnvironment.DOCSET_ENTRY = docsetEntry;
  configEnvironment.BRANCH_ENTRY = branch?.pop();
  configEnvironment.PROJECTS_ENTRY = projectsEntry;

  const orgName = projectsEntry.github.organization;
  configEnvironment.ORG = orgName as OrganizationName;

  // Set process.env SNOOTY_ENV and PREFIX_PATH environment variables for frontend to retrieve at build time
  process.env.SNOOTY_ENV = buildEnvironment;
  process.env.PATH_PREFIX = docsetEntry.prefix[buildEnvironment];

  // Prep for Snooty frontend build by cloning content repo
  if (isFrontendBuild) {
    console.log(
      `Cloning content repo \n Repo: ${repoName}, branch: ${branchName}, github organization: ${orgName}`,
    );
    await cloneContentRepo({ run, repoName, branchName, orgName });
  }

  console.info(
    'BUILD ENVIRONMENT: ',
    configEnvironment.ENV,
    '\n REPO ENTRY: ',
    configEnvironment.REPO_ENTRY,
    '\n DOCSET ENTRY: ',
    configEnvironment.DOCSET_ENTRY,
    '\n BRANCH ENTRY: ',
    configEnvironment.BRANCH_ENTRY,
    '\n METADATA ENTRY: ',
    configEnvironment.PROJECTS_ENTRY,
    '\n POOL DB NAME: ',
    configEnvironment.POOL_DB_NAME,
    '\n SEARCH DB NAME: ',
    configEnvironment.SEARCH_DB_NAME,
  );
};
