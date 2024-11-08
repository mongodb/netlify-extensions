import axios from 'axios';

export default async (req: Request): Promise<Response> => {
  console.log('request received:', req);
  if (!req.body) {
    return new Response('request received', { status: 401 });
  }

  // console.log(`requestJSon: ${reqJson}`);
  const slackPayload = await new Response(req.body).text();

  // This is coming in as urlencoded string, need to decode before parsing
  const decoded = decodeURIComponent(slackPayload).split('=')[1];
  const parsed = JSON.parse(decoded);
  console.log('Parsed', parsed);

  const user = parsed?.user?.username;
  const stateValues = parsed?.view?.state?.values;
  const selected =
    stateValues?.block_repo_option?.repo_option?.selected_options;

  if (parsed.type !== 'view_submission') {
    //TODO: create an interface for slack view_submission payloads
    const response = new Response(
      'Form not submitted, will not process request',
      { status: 200 },
    );
    return response;
  }

  sendMessage('this is a test message', parsed?.user?.id);

  const deployable = [];

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
  return new Response('', { status: 200 });
};

const sendMessage = async (message: any, user: string): Promise<any> => {
  try {
    const body = {
      channel: user,
      text: message,
    };
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
  }
  return {};
};
