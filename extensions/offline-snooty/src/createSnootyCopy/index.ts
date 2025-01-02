import type { NetlifyPluginUtils } from '@netlify/build';
import { promises } from 'node:fs';

export const createSnootyCopy = async (
  run: NetlifyPluginUtils['run'],
  targetPath: string,
) => {
  await run.command(
    `rsync -a ${process.cwd()}/snooty ${targetPath} --exclude public --exclude node_modules`,
  );

  const offlineSnootyPath = `${targetPath}/snooty`;

  await run.command('npm ci --legacy-peer-deps', {
    cwd: offlineSnootyPath,
  });

  await run.command('npm run clean', {
    cwd: offlineSnootyPath,
  });

  await promises.appendFile(
    `${offlineSnootyPath}/.env.production`,
    '\nOFFLINE_DOCS=TRUE\n',
  );

  await run.command('cat ./.env.production', { cwd: offlineSnootyPath });

  await run.command('npm run build:no-prefix', {
    cwd: offlineSnootyPath,
  });
};
