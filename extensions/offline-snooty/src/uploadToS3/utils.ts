import type {
  ReposBranchesDocument,
  BranchEntry,
  EnvironmentConfig,
  DocsetsDocument,
} from 'util/databaseConnection/types';

/**
 * Returns buckets that are preconfigured to public URL
 * Some projects are stored in different buckets,
 * but offline versions are stored in general usage bucket
 * to route to same URL
 */
function getBucketName(env: keyof EnvironmentConfig) {
  return `docs-mongodb-org-${env}`;
}

export function readEnvConfigs({
  env,
  repoEntry,
  branchEntry,
  docsetEntry,
}: {
  env: keyof EnvironmentConfig;
  repoEntry: ReposBranchesDocument;
  branchEntry: BranchEntry;
  docsetEntry: DocsetsDocument;
}) {
  const bucketName = getBucketName(env);
  const project: string = repoEntry?.project ?? '';
  const version = branchEntry?.gitBranchName ?? '';
  return {
    bucketName,
    fileName: `${project}-${version}.tar.gz`,
    baseUrl: docsetEntry?.url[env] ?? '',
  };
}
