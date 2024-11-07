export default async (req: any): Promise<Response> => {
  console.log('request received:', req);
  if (!req.body) {
    return new Response('request received', { status: 401 });
  }
  console.log(`request body: ${req.body}`);
  console.log(`request payload: ${req?.body?.payload}`);
  if (req?.body?.payload) {
    console.log(`parsed payload: ${JSON.parse(req?.body?.payload)}`);
  }
  // console.log(`headers: ${JSON.stringify(req.headers)}`);
  const decoded = decodeURIComponent(req);
  console.log(decoded);
  // const parsed = JSON.parse(decoded);
  // const stateValues = parsed.view.state.values;
  // console.log(`Parsed type ${parsed.type}`);
  // console.log(`State values: ${stateValues}`);
  return new Response('request received', { status: 200 });
};
