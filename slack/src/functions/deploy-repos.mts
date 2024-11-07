export default async (req: Request): Promise<Response> => {
  console.log('request received:', req);
  if (!req.body) {
    return new Response('request received', { status: 401 });
  }
  console.log(`request state: ${req.state}`);
  console.log(`request body: ${req.body}`);

  // console.log(`requestJSon: ${reqJson}`);
  const slackPayload = await new Response(req.body).text();
  console.log(`Slack payload: ${slackPayload}`);

  // This is coming in as urlencoded string, need to decode before parsing
  const decoded = decodeURIComponent(slackPayload).split('=');
  console.log(decoded);
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
  return new Response('request received', { status: 200 });
};
