import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import type { NetlifyPluginUtils } from '@netlify/build';
import axios from 'axios';

import { readFile } from 'node:fs';
import { promisify } from 'node:util';

const readFileAsync = promisify(readFile);

interface GitHubCommitResponse {
  commit: {
    sha: string;
  };
}

/**
 * This function returns the latest commit for the netlify-poc branch which is used
 * to compare the commit of the frontend currently stored in the worker.
 * TODO: Refactor this to get the latest release once we've merged the netlify-poc branch to main
 * @returns latest commit hash of the netlify-poc branch
 */
async function getLatestSnootyCommit(): Promise<string | undefined> {
  try {
    const response = await axios.get<GitHubCommitResponse>(
      'https://api.github.com/repos/mongodb/snooty/branches/netlify-poc',
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    const latestSha = response.data.commit.sha;

    return latestSha;
  } catch (e) {
    console.error('Could not retrieve latest SHA', e);
  }
}

async function getPackageLockHash(): Promise<string> {
  const packageLock = await readFileAsync(
    `${process.cwd()}/snooty/package-lock.json`,
  );

  const hashSum = createHash('sha256');
  hashSum.update(packageLock);

  return hashSum.digest('hex');
}

/**
 * First checks if the snooty directory exists, and if it does,
 * it checks to see if the latest commit sha matches
 * @param run the exec util provided by Netlify
 */
export async function checkForNewSnootyVersion(run: NetlifyPluginUtils['run']) {
  console.log('Checking Snooty frontend version');
  const snootyDirExists = existsSync(`${process.cwd()}/snooty`);

  if (snootyDirExists) {
    const latestSha = await getLatestSnootyCommit();

    const { stdout: currentSha } = await run.command('git rev-parse HEAD', {
      cwd: `${process.cwd()}/snooty`,
    });

    if (currentSha === latestSha) {
      console.log('No changes to the frontend. No update needed.');
      return;
    }
    console.log(
      'Current commit does not match the latest commit. Updating the snooty frontend repo',
    );
    const prevPackageLockHash = await getPackageLockHash();
    await run.command('git pull --rebase', { cwd: `${process.cwd()}/snooty` });

    const updatedPackageLockHash = await getPackageLockHash();

    if (prevPackageLockHash === updatedPackageLockHash) {
      console.log(
        'Package-lock.json is unchanged. Not installing any additional dependencies',
      );
      return;
    }
    console.log('Dependencies updating. Installing updates.');
    await run.command('npm ci', { cwd: `${process.cwd()}/snooty` });
    console.log('Updates for the frontend completed!');
  }
}
