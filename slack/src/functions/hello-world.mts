// Documentation: https://sdk.netlify.com

export default async (req: Request) => {
	console.log('request received', req);
	return new Response('Hello, world!');
};
