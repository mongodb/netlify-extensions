export default async (req: any): Promise<Response> => {
  console.log('request received:', req);
  if (!req.body) {
    return new Response('request received', { status: 401 });
  }
  console.log(Object.keys(req));
  console.log(`headers: ${req.headers}`);
  const decoded = decodeURIComponent(req).split('=');
  // const parsed = JSON.parse(decoded);
  // const stateValues = parsed.view.state.values;
  // console.log(`Parsed type ${parsed.type}`);
  // console.log(`State values: ${stateValues}`);
  return new Response('request received', { status: 200 });
};
