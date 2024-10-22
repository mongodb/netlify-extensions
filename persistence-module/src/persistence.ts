import { existsSync } from 'node:fs';
import type { NetlifyPluginUtils } from '@netlify/build';

const WORKER_POOL_PATH = `${process.cwd()}/docs-worker-pool`;
const PERSISTENCE_PATH = `${WORKER_POOL_PATH}/modules/persistence`;

export async function downloadPersistenceModule(
  run: NetlifyPluginUtils['run'],
): Promise<void> {
  const isModuleDownloaded = existsSync(WORKER_POOL_PATH);

  if (isModuleDownloaded) return;

  await run.command(
    'git clone --depth 1 --filter=tree:0 https://github.com/mongodb/docs-worker-pool.git --sparse',
  );

  await run.command('git sparse-checkout set --no-cone modules/persistence', {
    cwd: WORKER_POOL_PATH,
  });

  await run.command('npm ci', {
    cwd: PERSISTENCE_PATH,
  });

  await run.command('npm run build', {
    cwd: PERSISTENCE_PATH,
  });
}
