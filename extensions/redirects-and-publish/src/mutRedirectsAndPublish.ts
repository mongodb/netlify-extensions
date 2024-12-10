import type { ConfigEnvironmentVariables } from 'util/extension';
import type { NetlifyPluginUtils } from '@netlify/build';
import type { BranchEntry } from 'util/databaseConnection/types';

const getRepoAliases = (branchEntry: BranchEntry) => {
  // use slice() to create shallow copy of the branch's aliases
  const urlAliases = branchEntry.urlAliases
    ? branchEntry.urlAliases.slice()
    : [];

  if (
    !!branchEntry.publishOriginalBranchName &&
    !urlAliases.includes(branchEntry.gitBranchName)
  ) {
    // Add current branch to list of aliases
    urlAliases.push(branchEntry.gitBranchName);
  }
  if (urlAliases.length === 0) {
    urlAliases.push(branchEntry.urlSlug);
  }
  return urlAliases;
};

const setMutEnvVars = () => {
  process.env.GATSBY_MANIFEST_PATH = `${process.cwd()}/bundle.zip`;
  process.env.GATSBY_PARSER_USER = 'buildbot';
  //TODO: Mut and populate-metadata extensions use different env variable names for the same values (set to team wide in future)
  process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;
  process.env.AWS_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Credentials not found');
  }
};

export const mutRedirectsAndPublish = async (
  configEnvironment: ConfigEnvironmentVariables,
  run: NetlifyPluginUtils['run'],
): Promise<void> => {
  const repoName = configEnvironment.REPO_ENTRY?.repoName;

  // Get docset entry and branch entry from NetlifyConfig
  const docsetEntry = configEnvironment.DOCSET_ENTRY;
  const branchEntry = configEnvironment.BRANCH_ENTRY;
  if (!docsetEntry || !branchEntry) {
    throw new Error(
      `Unable to retrieve docset entry ${docsetEntry} or branch entry ${branchEntry} for repo ${repoName}`,
    );
  }

  // Get the array of the all the possible aliases, used to publish page info into the correct subdirectories in the bucket
  const urlAliases = getRepoAliases(branchEntry);

  // Set environment variables for Mut
  setMutEnvVars();

  // Copy the Snooty frontend folder and rerun the frontend build WITH a Gatsby prefix (instead of `npm run build:no-prefix` as done in the build.sh)
  await run.command('rm -f -r running-mut');
  await run.command('mkdir -p running-mut');
  // TODO: this should also happen for dotcomprd if configEnvironment.ENV == dotcomprd
  if (configEnvironment?.ENV === 'dotcomstg') {
    await run.command('mkdir -p running-mut/snooty');
    await run.command(
      `rsync -q -i -av --progress  ${process.cwd()} ${process.cwd()}/running-mut/snooty --exclude node_modules --exclude .cache --exclude running-mut`,
    );
    process.chdir(`${process.cwd()}/running-mut/snooty/repo`);
  }

  console.log(`Downloading and unzipping mut for ${repoName}`);
  await run('curl', [
    '-L',
    '-o',
    'mut.zip',
    `https://github.com/mongodb/mut/releases/download/v${process.env.MUT_VERSION}/mut-v${process.env.MUT_VERSION}-linux_x86_64.zip`,
  ]);
  await run.command('unzip -d . -qq mut.zip');

  for (const alias of urlAliases) {
    // Building frontend ------------------------------------------------------------
    // TODO: When uploaded to prod, run this command instead: process.env.PATH_PREFIX = `/${docsetEntry?.prefix?.[configEnvironment.ENV]}`; (DOP-5178)
    const prefix = alias
      ? `/${docsetEntry.prefix.dotcomstg}/${alias}`
      : `/${docsetEntry.prefix.dotcomstg}`;
    process.env.PATH_PREFIX = prefix;

    await run.command('npm ci');
    await run.command('npm run clean');
    await run.command('npm run build');

    // Running mut-redirects -------------------------------------------------------
    try {
      console.log(
        `Running mut-redirects... for ${repoName} with alias ${alias}`,
      );
      await run.command(
        `${process.cwd()}/mut/mut-redirects ${repoName}/config/redirects -o public/.htaccess`,
      );
    } catch (e) {
      console.log(`Error occurred while running mut-redirects: ${e}`);
    }
    //Running mut-publish ----------------------------------------------------------
    console.log('Start of the mut-publish plugin -----------');
    /*Usage: mut-publish <source> <bucket> --prefix=prefix
                      (--stage|--deploy)
                      [--all-subdirectories]
                      [--redirects=htaccess]
                      [--deployed-url-prefix=prefix]
                      [--redirect-prefix=prefix]...
                      [--dry-run] [--verbose] [--json] */
    try {
      console.log('Running mut-publish...');
      if (!docsetEntry?.bucket || !docsetEntry?.prefix || !docsetEntry?.url) {
        throw new Error(
          `DocsetEntry information missing. bucket: ${docsetEntry?.bucket}, ...etc`,
        );
      }
      // TODO: In future we change to docsetEntry?.prefix?.[configEnvironment.ENV] and docsetEntry?.url?.[configEnvironment.ENV] (DOP-5178)
      await run(
        `${process.cwd()}/mut/mut-publish`,
        [
          'public',
          `${docsetEntry?.bucket?.dotcomstg}`,
          `--prefix=${prefix}`,
          '--deploy',
          `--deployed-url-prefix=s${docsetEntry?.url?.dotcomstg}`,
          '--json',
          '--all-subdirectories',
        ],
        { input: 'y' },
      );
    } catch (e) {
      console.log(`Error occurred while running mut-publish: ${e}`);
    }
  }
};
