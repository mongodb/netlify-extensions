import type { ConfigEnvironmentVariables } from './types';
import type { NetlifyPluginUtils } from '@netlify/build';

const MUT_VERSION = process.env.MUT_VERSION;
const MANIFEST_PATH = `${process.cwd()}/bundle.zip`;

export const mutRedirectsAndPublish = async (
  configEnvironment: ConfigEnvironmentVariables,
  run: NetlifyPluginUtils['run'],
): Promise<void> => {

  console.log(process.cwd());
  // connect to mongodb and pool.docsets to get bucket
  const docsetEntry = configEnvironment?.DOCSET_ENTRY;
  console.log('Succesfully got docsets entry:', docsetEntry);
  
  // we want to copy the snooty folder and run `npm run build` instead of `npm run build:no-prefix` as it does in the build.sh --------------------------
  // we do this so when we run mut-publish we are able to uplaod the correct files with the correct paths
  await run.command('rm -f -r running-mut');
  await run.command('mkdir -p running-mut');

  if (configEnvironment?.SITE_NAME === 'mongodb-snooty') {
    // since mongodb-snooty is not a content repo the file structure is different and needs to be treated as such
    await run.command('rm -f -r running-mut/snooty');
    await run.command('mkdir -p running-mut/snooty');
    await run.command(
      'cp -r AWSCLIV2.pkg build.sh bundle.zip CHANGELOG.md code-of-conduct.md component-factory-transformer docs-landing gatsby-browser.js gatsby-config.js gatsby-ssr.js jest.config.js jest-preprocess.js Makefile __mocks__ netlify.toml node_modules package.json package-lock.json plugins public README.md scripts snooty-parser snooty-parser.zip src static stubs tests running-mut/snooty/',
    );
  } else {
    await run.command('cp -r snooty running-mut');
    await run.command('ls running-mut/snooty');
  }

  await run.command('ls running-mut/snooty');
  process.chdir(`${process.cwd()}/running-mut/snooty`);
  process.env.GATSBY_MANIFEST_PATH = MANIFEST_PATH;
  // TODO: when uploaded to prod, run this command instead  process.env.PATH_PREFIX = `/${docsetEntry?.prefix?.[configEnvironment.ENV]}`;
  process.env.PATH_PREFIX = `/${docsetEntry?.prefix?.dotcomstg}`;
  process.env.GATSBY_PARSER_USER = 'buildbot';
  await run.command('npm run clean');
  await run.command('npm run build');

  // running mut-redirects -------------------------------------------------------
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

    if (configEnvironment?.SITE_NAME === 'mongodb-snooty') {
      // so mongodb-snooty can launch with docs-landing
      await run.command(
        `${process.cwd()}/mut/mut-redirects docs-landing/config/redirects -o public/.htaccess`,
      );
    } else {
      await run.command(
        `${process.cwd()}/mut/mut-redirects ../../config/redirects -o public/.htaccess`,
      );
    }
  } catch (e) {
    console.log(`Error occurred while running mut-redirects: ${e}`);
  }

  // running mut-publish ----------------------------------------------------------
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Credentials not found');
  }

  //TODO: change these teamwide env vars in Netlify UI when ready to move to prod
  process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;
  process.env.AWS_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;

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
      throw new Error();
    }

    console.log(
      'In the bucket of',
      docsetEntry?.bucket,
      docsetEntry?.bucket?.dotcomstg,
    ); // subbed in docs-mongodb-org-dotcomstg
    console.log(
      'With a prefix of',
      docsetEntry?.prefix,
      `--prefix=${docsetEntry?.prefix?.dotcomstg}`,
    ); // subbed in /netlify/docs-qa
    console.log('And a URL of: ', docsetEntry?.url); // https://mongodbcom-cdn.website.staging.corp.mongodb.com/

    // TODO: do I need to log this command below ?
    if (configEnvironment.ENV === 'dotcomstg') {
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
    } else if (configEnvironment.ENV === 'dotcomprd') {
      // we will want to do this in the future but not in this PR
      // await run(
      //   `${process.cwd()}/mut/mut-publish`,
      //   [
      //     'public',
      //     `${docsetEntry?.bucket?.dotcomprd}`,
      //     `--prefix=/${docsetEntry?.prefix?.dotcomprd}`,
      //     '--deploy',
      //     `--deployed-url-prefix=s${docsetEntry?.url?.dotcomprd}`,
      //     '--json',
      //     '--all-subdirectories',
      //   ],
      //   { input: 'y' },
      // );
    }
  } catch (e) {
    console.log(`Error occurred while running mut-publish: ${e}`);
  }
};
