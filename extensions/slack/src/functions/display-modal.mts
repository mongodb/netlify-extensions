// Documentation: https://sdk.netlify.com
import axios, { type AxiosResponse } from 'axios';
import { getQSString, validateSlackRequest } from '../process-slack-req.js';
import { getReposBranchesCollection } from '../dbConnector.js';
import {
  displayModal,
  getDropDownView,
  type repoOption,
} from '../utils/build-modal.js';
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

  if (!validateSlackRequest({ requestHeaders: req.headers, requestBody })) {
    console.log('Slack request not validated');
    return new Response('Slack request not validated', { status: 400 });
  }

  const reposBranchesCollection = await getReposBranchesCollection();

  const deployableRepos = await getDeployableRepos(reposBranchesCollection);

  const response = await displayModal(deployableRepos, trigger_id);

  if (!response?.data?.ok) {
    console.log('Response metadata:', response?.data?.response_metadata);
  }

  return new Response('Model requested and displayed', { status: 200 });
};
