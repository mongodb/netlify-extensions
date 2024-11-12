// TODO: consolidate with populate-metadata extension
type EnvironmentConfig = {
  dev?: string;
  stg: string;
  dotcomstg: string;
  prd: string;
  dotcomprd: string;
};
export interface DocsetsDocument {
  bucket: EnvironmentConfig;
  project: string;
  url: EnvironmentConfig;
  prefix: EnvironmentConfig;
}

export interface BranchEntry {
  name?: string;
  gitBranchName: string;
  urlSlug: string;
  isStableBranch: boolean;
  active: boolean;
}

export interface ReposBranchesDocument {
  repoName: string;
  project: string;
  search?: {
    categoryTitle: string;
    categoryName?: string;
  };
  branches?: Array<BranchEntry>;
  prodDeployable: boolean;
  internalOnly: boolean;
}

export function readEnvConfigs({
  env,
  docsetEntry,
  repoEntry,
  branchEntry,
}: {
  env: string;
  docsetEntry: DocsetsDocument;
  repoEntry: ReposBranchesDocument;
  branchEntry: BranchEntry;
}) {
  const docset: DocsetsDocument = docsetEntry;
  const bucketName = docset.bucket[env as keyof EnvironmentConfig] ?? '';
  const project: string = repoEntry?.project ?? '';
  const version = branchEntry?.gitBranchName ?? '';
  return { bucketName, fileName: `${project}-${version}.tar.gz` };
}
