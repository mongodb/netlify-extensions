import axios from 'axios';

export default async (req: Request): Promise<any> => {
  console.log('request received:', req);
  if (!req.body) {
    return new Response('request received', { status: 401 });
  }
  console.log(`request body: ${req.body}`);

  // console.log(`requestJSon: ${reqJson}`);
  const slackPayload = await new Response(req.body).text();
  console.log(`Slack payload: ${slackPayload}`);

  // This is coming in as urlencoded string, need to decode before parsing
  const decoded = decodeURIComponent(slackPayload).split('=')[1];
  const parsed = JSON.parse(decoded);
  const stateValues = parsed.view.state.values;
  const selected = stateValues.block_repo_option.repo_option.selected_options;
  console.log(selected);

  if (parsed.type !== 'view_submission') {
    //TODO: create an interface for slack view_submission payloads
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Form not submitted, will not process request',
    };
    return response;
  }

  const deployable = [];

  for (let i = 0; i < selected.length; i++) {
    const splitValues = selected[i].value.split('/');
    // TODO: add in slack username here
    const jobTitle = `Slack deploy: ${selected[i].value}, by person`;
    if (splitValues.length === 2) {
      const repoName = splitValues[0];
      const branchName = splitValues[1];
      if (splitValues[0] === 'docs-landing') {
        return await axios.post(
          'https://api.netlify.com/build_hooks/6723eca38897343993c049b5',
        );
      }
    }
  }
};

// const parsed = JSON.parse(decoded);
// const stateValues = parsed.view.state.values;

// if (req?.body?.payload) {
//   console.log(`parsed payload: ${JSON.parse(req?.body?.payload)}`);
// }
// console.log(`headers: ${JSON.stringify(req.headers)}`);
// const decoded = decodeURIComponent(req);
// console.log(decoded);
// const parsed = JSON.parse(decoded);
// const stateValues = parsed.view.state.values;
// console.log(`Parsed type ${parsed.type}`);
// console.log(`State values: ${stateValues}`);
// return new Response('request received', { status: 200 });
