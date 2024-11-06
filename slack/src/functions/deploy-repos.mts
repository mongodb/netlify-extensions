export default async (req: Request): Promise<Response> => {
  console.log('request received', req.headers);
  return new Response('request received', { status: 200 });
};
