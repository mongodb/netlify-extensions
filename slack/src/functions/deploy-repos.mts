export default async (req: Request): Promise<Response> => {
  console.log('request received:', req.headers);
  if (!req.body) {
    return new Response('request received', { status: 401 });
  }
  // console.log(decodeURIComponent(req.headers).split('='));
  // const decoded = decodeURIComponent(req).split('=');
  // const parsed = JSON.parse(decoded);
  // const stateValues = parsed.view.state.values;
  // console.log(`Parsed type ${parsed.type}`);
  // console.log(`State values: ${stateValues}`);
  return new Response('request received', { status: 200 });
};
