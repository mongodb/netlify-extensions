import axios from 'axios';
import { getQSString } from '../process-slack-req.js';

export default async (req: Request) => {
  if (!req?.body) {
    return new Response('Request received without a body', { status: 401 });
  }

  const slackPayload = await new Response(req.body).text();
  const key_val = getQSString(slackPayload);
  console.log(`key_val: ${key_val}`);

  // This is coming in as urlencoded string, need to decode before parsing
  const decoded = decodeURIComponent(slackPayload).split('=')[1];
  //TODO: create an interface for slack view_submission payloads
  const parsed = JSON.parse(decoded);

  const user = parsed?.user?.username;
  const stateValues = parsed?.view?.state?.values;
  const selected =
    stateValues?.block_repo_option?.repo_option?.selected_options;

  if (parsed?.type !== 'view_submission') {
    const response = new Response(
      'Form not submitted, will not process request',
      { status: 200 },
    );
    return response;
  }

  // TODO: send message to user that their job has been enqueued
  // const messageResponse = await sendMessage(
  //   'this is a test message',
  //   parsed?.user?.id,
  // );

  for (let i = 0; i < selected?.length; i++) {
    const { repoName, branchName } = selected[i].value.split('/');
    // TODO: add job title to title of deploy
    const jobTitle = `Slack deploy: ${selected[i].value}, by ${user}`;
    if (repoName && branchName) {
      // TODO: add other conditionals here to deploy based on branchName
      if (repoName === 'docs-landing' && branchName === 'master') {
        // Send build hook to deploy MongoDB-snooty site which builds docs-landing master
        const resp = await axios.post(
          'https://api.netlify.com/build_hooks/6723eca38897343993c049b5?trigger_branch=master&trigger_title=testing+deployHook+title',
        );
      }
    }
  }
};

const sendMessage = async (
  message: string,
  user: string,
): Promise<Response> => {
  try {
    const body = {
      channel: user,
      text: message,
    };
    console.log('body of message:', message);
    const slackToken = process.env.SLACK_AUTH_TOKEN;
    if (!slackToken) {
      throw new Error('No Slack token provided');
    }
    return await axios.post('https://slack.com/api/chat.postMessage', body, {
      headers: {
        Authorization: [`Bearer ${slackToken}`],
        'Content-type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Slack SendMessage', error);
    throw new Error();
  }
};
