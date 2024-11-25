import axios from 'axios';
import { validateSlackRequest } from '../process-slack-req.js';
import { getDbConfig } from 'util/assertDbEnvVars';

export default async (req: Request) => {
  if (!req?.body) {
    return new Response('Request received without a body', { status: 401 });
  }
  const requestBody = await new Response(req.body).text();
  const dbEnvVars = getDbConfig();

  if (
    !validateSlackRequest({
      requestHeaders: req.headers,
      requestBody,
      signingSecret: dbEnvVars.SLACK_SIGNING_SECRET,
    })
  ) {
    console.log(
      '401 Status Returned: Slack request not validated, client may not be authorized',
    );
    return new Response(
      'Slack request not validated, client may not be authorized',
      { status: 401 },
    );
  }

  // Decodes request body (a url encoded string) before parsing
  const decoded = decodeURIComponent(requestBody).split('=')[1];
  // TODO: Create an interface for slack view_submission payloads
  const parsed = JSON.parse(decoded);
  console.log(JSON.stringify(parsed));
  console.log(`keys: ${Object.keys(parsed)}`);

  const user = parsed?.user?.username;
  const stateValues = parsed?.view?.state?.values;
  const selectedRepos =
    stateValues?.block_repo_option?.repo_option?.selected_options;

  if (parsed?.type !== 'view_submission') {
    const response = new Response(
      'Form not submitted, will not process request',
      { status: 200 },
    );
    return response;
  }

  // TODO: Send message to user that their job has been enqueued (DOP-5096)
  // const messageResponse = await sendMessage(
  //   'this is a test message',
  //   parsed?.user?.id,
  // );

  // TODO: send branch name, payload in POST request, DOP-5201
  console.log(`Selected repos: ${JSON.stringify(selectedRepos)}`);

  for (const individualRepo of selectedRepos) {
    const [repoName, branchName] = individualRepo.value.split('/');
    const jobTitle = `Slack deploy: repoName ${repoName}, branchName ${branchName}, by ${user}`;
    if (repoName && branchName) {
      // TODO: add other conditionals here to deploy based on branchName
      console.log(`Deploying branch ${branchName} of repo ${repoName}`);
      // Currently: sends build hook to deploy to docs-frontend-dotcomstg site
      // TODO: DOP-5202, Send conditionally to build hooks of different sites ('docs-frontend-dotcomstg' or 'docs-frontend-dotcomprd') depending on which modal request received from
      const resp = await axios.post(
        `https://api.netlify.com/build_hooks/673bd8c7938ade69f9530ec5?trigger_branch=main&trigger_title=deployHook+${jobTitle}`,
        { repoName: repoName, branchName: branchName },
      );
    }
  }
};

// Send message to user that their job has been enqueued (DOP-5096)
const sendMessage = async (
  message: string,
  user: string,
  slackAuthToken: string,
): Promise<Response> => {
  try {
    const body = {
      channel: user,
      text: message,
    };
    console.log('body of message:', message);
    if (!slackAuthToken) {
      throw new Error('No Slack token provided');
    }
    return await axios.post('https://slack.com/api/chat.postMessage', body, {
      headers: {
        Authorization: [`Bearer ${slackAuthToken}`],
        'Content-type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Slack SendMessage', error);
    throw new Error();
  }
};
