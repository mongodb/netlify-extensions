// Documentation: https://sdk.netlify.com

import { NetlifyIntegration } from '@netlify/sdk';

import { readdir } from 'node:fs';

import { promisify } from 'node:util';
import { checkForNewSnootyVersion } from './snooty-frontend-version-check';

const readdirAsync = promisify(readdir);

const MUT_VERSION = '0.11.4';

const getCacheFilePaths = (filesPaths: string[]): string[] =>
  filesPaths.filter((filePath) => filePath.endsWith('.cache.gz'));

const integration = new NetlifyIntegration();

integration.addBuildEventHandler(
  'onPreBuild',
  async ({ utils: { cache, run } }) => {
    const files: string[] = await cache.list();

    const cacheFiles = getCacheFilePaths(files);

    if (!cacheFiles.length) {
      console.log('No snooty cache files found');

      return;
    }
    // Don't want to restore duplicates, only restore snooty cache files
    console.log('restoring snooty cache files');

    await Promise.all(cacheFiles.map((cacheFile) => cache.restore(cacheFile)));

    await checkForNewSnootyVersion(run);
  },
);

integration.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { run, cache } }) => {
    console.log('Creating cache files...');
    await run.command('./snooty-parser/snooty/snooty create-cache .');
    console.log('Cache files created');
    const filesPaths = await readdirAsync(process.cwd());

    const cacheFiles = getCacheFilePaths(filesPaths);

    await Promise.all(
      cacheFiles.map(async (filePath) => {
        console.log(`Adding cache file: ${filePath}`);
        await cache.save(filePath);
      }),
    );
  },
);

// integration.addBuildEventHandler(
//   'onSuccess',
//   async ({ utils: { run, status } }) => {
//     const redirectErrs = '';

//     console.log('Downloading Mut...');
//     await run('curl', [
//       '-L',
//       '-o',
//       'mut.zip',
//       `https://github.com/mongodb/mut/releases/download/v${MUT_VERSION}/mut-v${MUT_VERSION}-linux_x86_64.zip`,
//     ]);
//     await run.command('unzip -d . -qq mut.zip');
//     try {
//       console.log('Running mut-redirects...');
//       await run.command(
//         `${process.cwd()}/mut/mut-redirects config/redirects -o snooty/public/.htaccess`,
//       );
//     } catch (e) {
//       console.log(`Error occurred while running mut-redirects: ${e}`);
//     }
//   },
// );

integration.addBuildEventHandler(
  'onEnd',
  async ({ utils: { run, status } }) => {
    console.log('Creating cache files...');
    const { all, stderr, stdout } = await run.command(
      './snooty-parser/snooty/snooty create-cache .',
      { all: true },
    );

    const logs = all ?? stdout + stderr;

    const logsSplit =
      logs
        .split('\n')
        .filter(
          (row) =>
            !row.includes('INFO:snooty.gizaparser.domain') &&
            !row.includes('INFO:snooty.parser:cache'),
        ) || [];

    let errorCount = 0;
    let warningCount = 0;

    for (const row of logsSplit) {
      if (row.includes('ERROR')) errorCount += 1;
      if (row.includes('WARNING')) warningCount += 1;
    }

    status.show({
      title: `Snooty Parser Logs - Errors: ${errorCount} | Warnings: ${warningCount}`,
      summary: logsSplit.join('\n'),
    });
  },
);

export { integration };
