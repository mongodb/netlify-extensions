// Documentation: https://sdk.netlify.com
import { getReposBranchesCollection } from 'util/databaseConnection/fetchReposBranchesData';
import { getQSString, validateSlackRequest } from '../process-slack-req.js';
import { displayModal } from '../utils/build-modal.js';
import { getDeployableRepos } from '../utils/getRepos.js';
import { getDbConfig } from 'util/assertDbEnvVars';

export default async (req: Request): Promise<Response> => {
  if (!req.body) {
    return new Response('Event body is undefined', { status: 400 });
  }
  const requestBody = await new Response(req.body).text();
  const key_val = getQSString(requestBody);
  const trigger_id = key_val.trigger_id;

  const dbEnvVars = getDbConfig();
  console.log(Object.keys(dbEnvVars));

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
    URI: dbEnvVars.ATLAS_CLUSTER0_URI,
    databaseName: 'pool',
    collectionName: dbEnvVars.REPOS_BRANCHES_COLLECTION,
  });

  const deployableRepos = await getDeployableRepos(reposBranchesCollection);

  const response = await displayModal(deployableRepos, trigger_id);

  if (!response?.data?.ok) {
    console.log('Response metadata:', response?.data?.response_metadata);
  }

  return new Response('Model requested and displayed', { status: 200 });
};
