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
      '401 Status Returned: eSlack request not validated, client may not be authorized',
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
  for (const individualRepo of selectedRepos) {
    const { repoName, branchName } = individualRepo.value.split('/');
    // TODO: add job title to title of deploy
    const jobTitle = `Slack deploy: ${individualRepo}, by ${user}`;
    if (repoName && branchName) {
      // TODO: add other conditionals here to deploy based on branchName
      console.log(`deploying branch ${branchName} of repo ${repoName}`);
      if (repoName === 'Docs-landing' && branchName === 'master') {
        console.log('Deploying master branch of docs-landing');
        // Currently: sends build hook to deploy to docs-frontend-stg site, builds docs-landing master by default
        // TODO: DOP-5202, Send conditionally to build hooks of different sites ('docs-frontend-dotcomstg' or 'docs-frontend-dotcomprd') depending on which modal request received from
        const resp = await axios.post(
          'https://api.netlify.com/build_hooks/6723eca38897343993c049b5?trigger_branch=master&trigger_title=testing+deployHook+title',
        );
      }
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
