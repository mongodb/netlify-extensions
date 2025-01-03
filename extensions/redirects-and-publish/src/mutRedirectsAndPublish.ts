import type { ConfigEnvironmentVariables } from 'util/extension';
import type { NetlifyPluginUtils } from '@netlify/build';

const MUT_VERSION = process.env.MUT_VERSION;
const MANIFEST_PATH = `${process.cwd()}/bundle.zip`;

export const mutRedirectsAndPublish = async (
  configEnvironment: ConfigEnvironmentVariables,
  run: NetlifyPluginUtils['run'],
): Promise<void> => {
  // Connect to mongodb and pool.docsets to get bucket
  const docsetEntry = configEnvironment?.DOCSET_ENTRY;
  console.log('Succesfully got docsets entry:', docsetEntry);

  // We want to copy the snooty folder and run `npm run build` instead of `npm run build:no-prefix` as it does in the build.sh
  // We do this so when we run mut-publish we are able to uplaod the correct files with the correct paths
  await run.command('rm -f -r running-mut');
  await run.command('mkdir -p running-mut');

  if (configEnvironment?.SITE_NAME === 'mongodb-snooty') {
    // Since mongodb-snooty is not a content repo the file structure is different and needs to be treated as such
    await run.command('mkdir -p running-mut/snooty');
    await run.command(
      `rsync -q -i -av --progress  ${process.cwd()} ${process.cwd()}/running-mut/snooty --exclude node_modules --exclude .cache --exclude running-mut`,
    );
    process.chdir(`${process.cwd()}/running-mut/snooty/repo`);
  } else {
    await run.command('cp -r snooty running-mut');
    process.chdir(`${process.cwd()}/running-mut/snooty`);
  }

  process.env.GATSBY_MANIFEST_PATH = MANIFEST_PATH;
  // TODO: When uploaded to prod, run this command instead: process.env.PATH_PREFIX = `/${docsetEntry?.prefix?.[configEnvironment.ENV]}`; (DOP-5178)
  process.env.PATH_PREFIX = `/${docsetEntry?.prefix?.dotcomstg}`;
  process.env.GATSBY_PARSER_USER = 'buildbot';
  await run.command('npm ci');
  await run.command('npm run clean');
  await run.command('npm run build');

  // Running mut-redirects -------------------------------------------------------
  console.log('Downloading Mut...', configEnvironment?.SITE_NAME);

  await run('curl', [
    '-L',
    '-o',
    'mut.zip',
    `https://github.com/mongodb/mut/releases/download/v${MUT_VERSION}/mut-v${MUT_VERSION}-linux_x86_64.zip`,
  ]);

  await run.command('unzip -d . -qq mut.zip');

  try {
    console.log('Running mut-redirects...');
    // TODO: Change hard coded `docs-landing` to whatever repo is being built after DOP-5159 is completed
    const redirectPath =
      configEnvironment.SITE_NAME === 'mongodb-snooty'
        ? 'docs-landing/config/redirects'
        : '../../config/redirects';
    await run.command(
      `${process.cwd()}/mut/mut-redirects ${redirectPath} -o public/.htaccess`,
    );
  } catch (e) {
    console.log(`Error occurred while running mut-redirects: ${e}`);
  }

  //Running mut-publish ----------------------------------------------------------

  //TODO: Mut and populate-metadata extensions use different env variable names for the same values (set to team wide in future)
  process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;
  process.env.AWS_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Credentials not found');
  }

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
        `--prefix=/${docsetEntry?.prefix?.dotcomstg}`,
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
};
