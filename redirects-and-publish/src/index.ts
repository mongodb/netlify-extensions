// Documentation: https://sdk.netlify.com
import { NetlifyExtension } from '@netlify/sdk';
import { getProperties } from './getProperties';

const extension = new NetlifyExtension();

const MUT_VERSION = '0.11.4';

extension.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { status, git, run }, netlifyConfig }) => {
    if (!process.env.MUT_COMMANDS_ENABLED) return;

    // running mut-redirects -------------------------------------------------------
    const redirectErrs = '';
    console.log('Downloading Mut...');
    await run('curl', [
      '-L',
      '-o',
      'mut.zip',
      `https://github.com/mongodb/mut/releases/download/v${MUT_VERSION}/mut-v${MUT_VERSION}-linux_x86_64.zip`,
    ]);
    await run.command('unzip -d . -qq mut.zip');
    try {
      console.log('Running mut-redirects...');
      await run.command(
        `${process.cwd()}/mut/mut-redirects config/redirects -o snooty/public/.htaccess`,
      );
    } catch (e) {
      console.log(`Error occurred while running mut-redirects: ${e}`);
    }

    // running mut-publish ----------------------------------------------------------
    //TODO: change these teamwide env vars in Netlify UI when ready to move to prod
    process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;
    process.env.AWS_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('credentials not found');
    }

    console.log('start of the mut-publish plugin -----------');

    const repoName =
      process.env.REPO_NAME ?? netlifyConfig.build.environment.SITE_NAME;
    if (!repoName) {
      throw new Error(
        'No repo name supplied as environment variable, manifest cannot be uploaded to Atlas Search.Documents collection ',
      );
    }
    console.log('repo name is:', repoName);

    // connect to mongodb and pool.docsets to get bucket
    const docsetEntry = await getProperties(repoName);
    console.log('Succesfully got docsets entry:', docsetEntry);

    /*Usage: mut-publish <source> <bucket> --prefix=prefix
                    (--stage|--deploy)
                    [--all-subdirectories]
                    [--redirects=htaccess]
                    [--deployed-url-prefix=prefix]
                    [--redirect-prefix=prefix]...
                    [--dry-run] [--verbose] [--json] */
    try {
      console.log('Running mut-publish...');
      // TODO: do I need to log this command below
      // TODO: "do I need to change the prefix to be: docsEntry.prefix.dotcomstg, or do we want to add /netlify"
      // also, in production do we leave it as dotcomstg or what bucket should it be changed to?
      await run(
        `${process.cwd()}/mut/mut-publish`,
        [
          'snooty/public',
          docsetEntry.bucket.dotcomstg,
          '--prefix=/netlify/docs-qa',
          '--deploy',
          `--deployed-url-prefix=${docsetEntry.url.dotcomstg}`,
          '--json',
          '--all-subdirectories',
        ],
        { input: 'y' },
      );
    } catch (e) {
      console.log(`Error occurred while running mut-publish: ${e}`);
    }
  },
);

export { extension };
