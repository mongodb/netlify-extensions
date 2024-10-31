import crypto from 'node:crypto';
import type { BranchEntry } from './types';

export function generateHash(data: string): Promise<string> {
  const hash = crypto.createHash('sha256');

  return new Promise((resolve) => {
    hash.on('readable', () => {
      const data = hash.read();
      if (data) {
        resolve(data.toString('hex'));
      }
    });

    hash.write(data);
    hash.end();
  });
}

export function joinUrl({
  base,
  path,
}: {
  base: string;
  path: string;
}): string {
  return base.replace(/\/*$/, '/') + path.replace(/^\/*/, '');
}

export function assertTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

// helper function to find the associated branch
export const getBranch = (branches: Array<BranchEntry>, branchName: string) => {
  const branchObj = branches.find(
    (branch) => branch.gitBranchName.toLowerCase() === branchName.toLowerCase(),
  );
  if (!branchObj)
    throw new Error(`Branch ${branchName} not found in branches object`);
  return branchObj;
};
