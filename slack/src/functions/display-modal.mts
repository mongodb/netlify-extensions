// Documentation: https://sdk.netlify.com
import axios, { type AxiosResponse } from 'axios';
import { getQSString, validateSlackRequest } from '../process-slack-req.js';
import { getReposBranchesCollection } from '../dbConnector.js';
import { getDeployableRepos } from '../getRepos.js';
import { getDropDownView, type repoOption } from '../build-modal.js';
import type { ReposBranchesDocument } from '../../../search-manifest/src/types.js';

export const displayRepoOptions = async (
  repos: Array<repoOption>,
  triggerId: string,
): Promise<AxiosResponse> => {
  const repoOptView = getDropDownView(triggerId, repos);
  //TODO: INSERT ENV VARS HERE
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
  console.log('request received', req.headers.keys());
  if (!req.body) {
    return new Response('Event body is undefined', { status: 400 });
  }
  const slackPayload = await new Response(req.body).text();
  const key_val = getQSString(slackPayload);
  const trigger_id = key_val['trigger_id'];

  if (!validateSlackRequest(req)) {
    console.log('slack request not validated');
    return new Response('Slack request not validated', { status: 400 });
  }

  const reposBranchesCollection = await getReposBranchesCollection();

  const deployableRepos = await getDeployableRepos(reposBranchesCollection);
  console.log('deployable repos:', JSON.stringify(deployableRepos));

  const response = await displayRepoOptions(deployableRepos, trigger_id);

  if (!response.data.ok) {
    console.log('Response metadata:', response?.data?.response_metadata);
  }

  return new Response('Model requested and displayed', { status: 200 });
};
