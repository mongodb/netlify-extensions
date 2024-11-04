// Documentation: https://sdk.netlify.com

import { NetlifyExtension } from '@netlify/sdk';

import { readdir } from 'node:fs';

import { promisify } from 'node:util';
import { envVarToBool } from './extension';
import { checkForNewSnootyVersion } from './snooty-frontend-version-check';

const readdirAsync = promisify(readdir);

const getCacheFilePaths = (filesPaths: string[]): string[] =>
  filesPaths.filter((filePath) => filePath.endsWith('.cache.gz'));

const extension = new NetlifyExtension();

extension.addBuildEventHandler(
  'onPreBuild',
  async ({ utils: { cache, run } }) => {
    if (!envVarToBool(process.env.SNOOTY_CACHE_ENABLED)) return;

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

extension.addBuildEventHandler(
  'onSuccess',
  async ({ utils: { run, cache } }) => {
    if (!envVarToBool(process.env.SNOOTY_CACHE_ENABLED)) return;

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

extension.addBuildEventHandler('onEnd', async ({ utils: { run, status } }) => {
  if (!envVarToBool(process.env.SNOOTY_CACHE_ENABLED)) return;

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
});

export { extension };
