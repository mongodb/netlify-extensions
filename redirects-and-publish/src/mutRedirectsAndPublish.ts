import type { ConfigEnvironmentVariables } from "./types";
import type { NetlifyPluginUtils } from '@netlify/build';

const MUT_VERSION = '0.11.4';
const SNOOTY_PATH = `${process.cwd()}/running-mut/snooty`
const MANIFEST_PATH = `${process.cwd()}/bundle.zip`

export const mutRedirectsAndPublish = async (
    configEnvironment: ConfigEnvironmentVariables,
    run: NetlifyPluginUtils['run'],
): Promise<void> => {

    // create and cd to new dir
    // clone snooty directory into the new sub directory
    // in that sub directory run 'npm run build'
    // might have to come out of the paths for directories 
    // await run.command(``);

    
    console.log(await run.command('ls'));
    console.log(await run.command('rm -f -r running-mut'));
    console.log(await run.command('mkdir -p running-mut'));

    if (configEnvironment?.SITE_NAME !== 'mongodb-snooty') {
      console.log(await run.command('cp -r snooty running-mut'));
      console.log(await run.command('ls running-mut/snooty'));
      console.log(process.chdir(`${process.cwd()}/running-mut/snooty`));
    } else {
      console.log(await run.command('cp -r ./* running-mut'))
      console.log(process.chdir(`${process.cwd()}/running-mut`));
    }
      
    console.log(await run.command('ls'));
    
    process.env.GATSBY_MANIFEST_PATH = MANIFEST_PATH;
    process.env.PATH_PREFIX = '/docs-qa';
    process.env.GATSBY_PARSER_USER='buildbot';
    console.log(await run.command('npm run clean'));
    console.log(await run.command('npm run build'));


    // echo GATSBY_MANIFEST_PATH=$(pwd)/bundle.zip >> ./snooty/.env.production


    // console.log(await run.command('ls'));
    // console.log(await run.command('npm run build'));
    // console.log(await run.command('cd ../'));
    // await run.command('cd redirects-and-publish');

    // running mut-redirects -------------------------------------------------------
    console.log('Downloading Mut...',configEnvironment?.SITE_NAME );

    await run('curl', [
      '-L',
      '-o',
      'mut.zip',
      `https://github.com/mongodb/mut/releases/download/v${MUT_VERSION}/mut-v${MUT_VERSION}-linux_x86_64.zip`,
    ]);

    await run.command('unzip -d . -qq mut.zip');

    try {
      console.log('Running mut-redirects...');
      
      if (configEnvironment?.SITE_NAME === "mongodb-snooty") {
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
    //TODO: change these teamwide env vars in Netlify UI when ready to move to prod
    process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;
    process.env.AWS_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('Credentials not found');
    }

    console.log('Start of the mut-publish plugin -----------');

    const repoName =
      process.env.REPO_NAME ?? configEnvironment?.SITE_NAME;

    if (!repoName) {
      throw new Error(
        'No repo name supplied as environment variable, manifest cannot be uploaded to Atlas Search.Documents collection ',
      );
    }
    console.log('Repo name is:', repoName);

    // connect to mongodb and pool.docsets to get bucket
    const docsetEntry = configEnvironment?.DOCSET_ENTRY;

    //TODO: we only want to run mut publish for dotcomprod and dotcomstg
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
      if (!docsetEntry?.bucket || !docsetEntry?.prefix || !docsetEntry?.url) {
        throw new Error;
      }

      // TODO: sub in the temporary values for the real values (this values from docs-landing staging)
      console.log('In the bucket of', docsetEntry?.bucket, docsetEntry?.bucket?.dotcomstg); // subbed in docs-mongodb-org-dotcomstg
      console.log('With a prefix of', docsetEntry?.prefix, `--prefix=${docsetEntry?.prefix?.dotcomstg}`); // subbed in /netlify/docs-qa
      console.log('And a URL of: ',  docsetEntry?.url); // https://mongodbcom-cdn.website.staging.corp.mongodb.com/
      
      // TODO: do I need to log this command below ?
      if (docsetEntry?.bucket?.dotcomstg === 'docs-mongodb-org-dotcomstg' && docsetEntry.project === 'landing' && configEnvironment?.SITE_NAME === "mongodb-snooty") {
        console.log("Testing docs-landing in dotcomstg...");
        await run.command('ls public/')
        await run(
          `${process.cwd()}/mut/mut-publish`,
          [
            'public',
            'docs-mongodb-org-dotcomstg',
            '--prefix=/docs-qa',
            '--deploy',
            '--deployed-url-prefix=https://mongodbcom-cdn.website.staging.corp.mongodb.com/',
            '--json',
            '--all-subdirectories',
            '--verbose'
          ],
          { input: 'y' },
        );
      } else {
        await run(
          `${process.cwd()}/mut/mut-publish`,
          [
            'public',
            'docs-mongodb-org-dotcomstg',
            '--prefix=/docs-qa',
            '--deploy',
            '--deployed-url-prefix=https://mongodbcom-cdn.website.staging.corp.mongodb.com/',
            '--json',
            '--all-subdirectories',
          ],
          { input: 'y' },
        );
      }
      
    } catch (e) {
      console.log(`Error occurred while running mut-publish: ${e}`);
    }
}