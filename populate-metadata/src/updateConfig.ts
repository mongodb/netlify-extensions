import { getProperties } from './getProperties';
import type { DocsConfig } from './types';

export const updateConfig = async (config: DocsConfig) => {
  const branchName =
    process.env.BRANCH_NAME ?? config.build?.environment.BRANCH;
  const repoName = process.env.REPO_NAME ?? config.build?.environment.SITE_NAME;

  if (!branchName || !repoName) {
    throw new Error('RepoName or branch name missing from deploy');
  }

  //check if build was triggered by a webhook (If so, it was a prod deploy);
  const isProdDeploy = !!(
    config.build.environment?.INCOMING_HOOK_URL &&
    config.build.environment?.INCOMING_HOOK_TITLE &&
    config.build.environment?.INCOMING_HOOK_BODY
  );
  config.build.environment.PRODUCTION = isProdDeploy;
  //set environment to dotcomprd or prd if it is a writer build, only the Mongodb-Snooty site name is pre-configured (to dotcomstg)
  process.env.ENV ??= isProdDeploy ? 'dotcomprd' : 'prd';

  const { repo, docsetEntry } = await getProperties({
    branchName: branchName,
    repoName: repoName,
  });

  console.log(repo, docsetEntry);
  const { branches: branch, ...repoEntry } = repo;
  config.build.environment.REPO_ENTRY = repoEntry;
  config.build.environment.DOCSET_ENTRY = docsetEntry;
  config.build.environment.BRANCH_ENTRY = branch;

  console.log(
    config.build.environment.PRODUCTION,
    config.build.environment.REPO_ENTRY,
    config.build.environment.DOCSET_ENTRY,
    config.build.environment.BRANCH_ENTRY,
  );
};
