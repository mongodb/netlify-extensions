// Documentation: https://sdk.netlify.com
import { getReposBranchesCollection } from 'util/databaseConnection/fetchReposBranchesData';
import { getQSString, validateSlackRequest } from '../process-slack-req.js';
import { displayModal } from '../utils/build-modal.js';
import { getDeployableRepos } from '../utils/getRepos.js';
import { getDbConfig } from 'util/assertDbEnvVars';

const EXTENSION_NAME = 'SLACK_DISPLAY_MODAL';

export default async (req: Request): Promise<Response> => {
  if (!req.body) {
    return new Response('Event body is undefined', { status: 400 });
  }
  const requestBody = await new Response(req.body).text();
  const key_val = getQSString(requestBody);
  console.log(`key val: ${JSON.stringify(key_val)}`);
  const triggerId = key_val.trigger_id;
  const dbEnvVars = getDbConfig();

  if (
    !validateSlackRequest({
      requestHeaders: req.headers,
      requestBody,
      signingSecret: dbEnvVars.SLACK_SIGNING_SECRET,
    })
  ) {
    console.log('Slack request not validated');
    return new Response('Slack request not validated', { status: 400 });
  }

  const reposBranchesCollection = await getReposBranchesCollection({
    clusterZeroURI: dbEnvVars.ATLAS_CLUSTER0_URI,
    // TODO: DOP-5202, Change this conditionally to 'pool' or 'pool_test' depending on which slash command has been triggered
    databaseName: 'pool',
    collectionName: dbEnvVars.REPOS_BRANCHES_COLLECTION,
    extensionName: EXTENSION_NAME,
  });

  const deployableRepos = await getDeployableRepos(reposBranchesCollection);

  const response = await displayModal({
    repos: deployableRepos,
    triggerId,
    slackAuthToken: dbEnvVars.SLACK_AUTH_TOKEN,
  });

  if (!response?.data?.ok) {
    console.log('Response metadata:', response?.data?.response_metadata);
  }

  return new Response('Model requested and displayed', { status: 200 });
};
