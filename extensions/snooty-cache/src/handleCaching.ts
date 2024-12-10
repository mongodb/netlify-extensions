import type { NetlifyPluginUtils } from '@netlify/build';
import { checkForNewSnootyVersion } from './snooty-frontend-version-check';
import { readdir } from 'node:fs';
import { promisify } from 'node:util';

const readdirAsync = promisify(readdir);

const getCacheFilePaths = (filesPaths: string[]): string[] =>
  filesPaths.filter((filePath) => filePath.endsWith('.cache.gz'));

export const restoreFrontendCache = async (
  cache: NetlifyPluginUtils['cache'],
  run: NetlifyPluginUtils['run'],
) => {
  const files: string[] = await cache.list();

  const cacheFiles = getCacheFilePaths(files);

  if (!cacheFiles.length) {
    console.log('No Snooty frontend cache files found');

    return;
  }

  // Don't want to restore duplicates, only restore Snooty frontend cache files
  console.log('Restoring Snooty frontend cache files');

  await Promise.all(cacheFiles.map((cacheFile) => cache.restore(cacheFile)));

  await checkForNewSnootyVersion(run);
};

export const createFrontendCache = async (
  cache: NetlifyPluginUtils['cache'],
  run: NetlifyPluginUtils['run'],
) => {
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
};

export const createParserCache = async (
  run: NetlifyPluginUtils['run'],
  status: NetlifyPluginUtils['status'],
) => {
  console.log('Creating parser cache files...');
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
};
