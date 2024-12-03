import type {
  Environments,
  PoolDBName,
  SnootyDBName,
  SearchDBName,
} from 'util/databaseConnection/types';
import { getProperties } from './getProperties';
import type { ConfigEnvironmentVariables } from 'util/extension';
import type { StaticEnvVars } from 'util/assertDbEnvVars';
import type { NetlifyPluginUtils } from '@netlify/build';
import { existsSync } from 'node:fs';

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

export const updateConfig = async ({
  configEnvironment,
  dbEnvVars,
  run,
}: {
  configEnvironment: ConfigEnvironmentVariables;
  dbEnvVars: StaticEnvVars;
  run: NetlifyPluginUtils['run'];
}): Promise<void> => {
  // Check if this was an engineer's build or writer's build

  const isFrontendBuild = FRONTEND_SITES.includes(
    configEnvironment.SITE_NAME as string,
  );
  // Checks if build was triggered by a webhook
  const isBuildHookDeploy = !!(
    configEnvironment.INCOMING_HOOK_URL && configEnvironment.INCOMING_HOOK_TITLE
  );

  const repoName = isBuildHookDeploy
    ? JSON.parse(configEnvironment?.INCOMING_HOOK_BODY as string)?.repoName
    : (process.env.REPO_NAME ?? (configEnvironment.REPO_NAME as string));
  console.log('isBuildHookDeploy: ', isBuildHookDeploy);

  const branchName = isBuildHookDeploy
    ? JSON.parse(configEnvironment?.INCOMING_HOOK_BODY as string)?.branchName
    : (process.env.BRANCH_NAME ?? (configEnvironment.BRANCH as string));

  if (!repoName || !branchName) {
    throw new Error('Repo name or branch name missing from deploy');
  }
  configEnvironment.BRANCH_NAME = branchName;
  configEnvironment.REPO_NAME = repoName;

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
    (process.env.POOL_DB_NAME as PoolDBName) ?? poolDb;

  configEnvironment.SEARCH_DB_NAME =
    (process.env.SEARCH_DB_NAME as SearchDBName) ?? searchDb;

  configEnvironment.SNOOTY_DB_NAME =
    (process.env.SNOOTY_DB_NAME as SnootyDBName) ?? snootyDb;

  const { repo, docsetEntry, metadataEntry } = await getProperties({
    branchName,
    repoName,
    dbEnvVars,
    poolDbName: configEnvironment.POOL_DB_NAME,
    environment: buildEnvironment,
  });

  configEnvironment.METADATA_ENTRY = metadataEntry;

  const { branches: branch, ...repoEntry } = repo;
  configEnvironment.REPO_ENTRY = repoEntry;
  configEnvironment.DOCSET_ENTRY = docsetEntry;
  configEnvironment.BRANCH_ENTRY = branch?.pop();

  const orgName = metadataEntry.github.organization;
  configEnvironment.ORG = orgName;

  // Prep for snooty build
  if (isFrontendBuild) {
    await run.command(
      `echo "Cloning content repo \n repo ${repoName}, branchName: ${branchName}, orgName: ${orgName}" `,
    );
    // await run.command(
    //   `if [ -d '${repoName}' ]; then \n echo 'bi connector dir exists' \n fi`,
    // );
    if (existsSync(`${process.cwd()}/${repoName}`)) {
      await run.command(`rm -r ${repoName}`);
    }

    const botPwd = process.env.GITHUB_BOT_PWD;
    const askPassFilePath = `${process.cwd()}/.ssh-askpass`;
    await run.command('touch $testing-file');
    await run.command(`echo ${botPwd} > ${askPassFilePath}`);
    await run.command('ls');

    process.env.SSH_ASKPASS = `/..${askPassFilePath}`;

    await run.command(
      `git clone -b ${branchName} https://github.com/${orgName}/${repoName}.git -s`,
    );
  }
  // Set process.env SNOOTY_ENV and PREFIX_PATH environment variables for frontend to retrieve at build time
  process.env.SNOOTY_ENV = buildEnvironment;
  process.env.PATH_PREFIX = docsetEntry.prefix[buildEnvironment];

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
    configEnvironment.METADATA_ENTRY,
    '\n POOL DB NAME: ',
    configEnvironment.POOL_DB_NAME,
    '\n SEARCH DB NAME: ',
    configEnvironment.SEARCH_DB_NAME,
  );
};

// const getRepoBranch = (
//   buildEnvironment: Environments,
//   configEnvironment: ConfigEnvironmentVariables,
// ) => {
//   // Check if repo name and branch name have been set as environment variables through Netlify UI
//   // Allows overwriting of database name values for testing
//   let branchName: string;
//   let repoName: string;

//   if (buildEnvironment !== 'dotcomstg' && buildEnvironment !== 'dotcomprd') {
//     branchName =
//       process.env.BRANCH_NAME ?? (configEnvironment.BRANCH as string);
//     repoName =
//       process.env.REPO_NAME ??
//       (process.env.REPOSITORY_URL?.split('/')?.pop() as string);
//   } else {
//     console.log(`Incoming hook body ${configEnvironment?.INCOMING_HOOK_BODY}`);
//     repoName = JSON.parse(
//       configEnvironment?.INCOMING_HOOK_BODY as string,
//     )?.repoName;
//     branchName = JSON.parse(
//       configEnvironment?.INCOMING_HOOK_BODY as string,
//     )?.branchName;
//   }
//   return { branchName, repoName };
// };

// Check if repo name and branch name have been set as environment variables through Netlify UI
// Allows overwriting of database name values for testing

// if (buildEnvironment !== 'dotcomstg' && buildEnvironment !== 'dotcomprd') {
//   branchName =
//     process.env.BRANCH_NAME ?? (configEnvironment.BRANCH as string);
//   repoName =
//     process.env.REPO_NAME ??
//     (process.env.REPOSITORY_URL?.split('/')?.pop() as string);
// } else {
//   console.log(`Incoming hook body ${configEnvironment?.INCOMING_HOOK_BODY}`);
//   repoName = JSON.parse(
//     configEnvironment?.INCOMING_HOOK_BODY as string,
//   )?.repoName;
//   branchName = JSON.parse(
//     configEnvironment?.INCOMING_HOOK_BODY as string,
//   )?.branchName;
// }
