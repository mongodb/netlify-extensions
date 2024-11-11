// Documentation: https://sdk.netlify.com
import axios, { type AxiosResponse } from 'axios';
import { validateSlackRequest } from '../process-slack-req.js';
import { getReposBranchesCollection } from '../dbConnector.js';
import { getDeployableRepos } from '../utils/getRepos.js';
import { getDropDownView, type repoOption } from '../utils/build-modal.js';

export const displayRepoOptions = async (
  repos: Array<repoOption>,
  triggerId: string,
): Promise<AxiosResponse> => {
  const repoOptView = getDropDownView(triggerId, repos);
  //TODO: get slack auth token from dbEnvVars argument in buildEventHandlers
  const slackToken = process.env.SLACK_AUTH_TOKEN;
  if (!slackToken) {
    throw new Error('No Slack token provided');
  }
  const slackUrl = 'https://slack.com/api/views.open';
  return await axios.post(slackUrl, repoOptView, {
    headers: {
      Authorization: [`Bearer ${slackToken}`],
      'Content-type': 'application/json; charset=utf-8',
    },
  });
};

export default async (req: Request): Promise<Response> => {
  if (!req.body) {
    return new Response('Event body is undefined', { status: 400 });
  }
  const slackPayload = await new Response(req.body).text();
  // const key_val = getQSString(slackPayload);
  // const trigger_id = key_val.trigger_id;
  const trigger_id = 'dummyVal';

  if (!validateSlackRequest(req)) {
    console.log('Slack request not validated');
    return new Response('Slack request not validated', { status: 400 });
  }

  const reposBranchesCollection = await getReposBranchesCollection();

  const deployableRepos = await getDeployableRepos(reposBranchesCollection);

  const response = await displayRepoOptions(deployableRepos, trigger_id);

  if (!response?.data?.ok) {
    console.log('Response metadata:', response?.data?.response_metadata);
  }

  return new Response('Model requested and displayed', { status: 200 });
};
