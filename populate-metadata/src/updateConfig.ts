import { getProperties } from './getProperties';
import type { DocsConfig } from './types';

export const updateConfig = async (config: DocsConfig) => {
  const branchName =
    process.env.BRANCH_NAME ?? config.build?.environment.BRANCH;
  const repoName = process.env.REPO_NAME ?? config.build?.environment.SITE_NAME;

  if (!branchName || !repoName) {
    throw new Error('Repo name or branch name missing from deploy');
  }

  // Check if build was triggered by a webhook
  // TODO: add more specific logic dependent on hook title, url, body, etc. once Slack deploy apps have been implemented
  const isWebhookDeploy = !!(
    config.build.environment?.INCOMING_HOOK_URL &&
    config.build.environment?.INCOMING_HOOK_TITLE &&
    config.build.environment?.INCOMING_HOOK_BODY
  );

  // Check if this was an engineering build or writer's build; writer's builds by default are all builds not built on the "mongodb-snooty" site
  // Environment is either dotcomprd or prd if it is a writer build
  if (config.build.environment.SITE_NAME !== 'mongodb-snooty') {
    config.build.environment.PRODUCTION = isWebhookDeploy;
    process.env.ENV = isWebhookDeploy ? 'dotcomprd' : 'prd';
  } else {
    config.build.environment.PRODUCTION = false;
    process.env.ENV = isWebhookDeploy ? 'dotcomstg' : 'stg';
  }
  const { repo, docsetEntry } = await getProperties({
    branchName: branchName,
    repoName: repoName,
  });

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
