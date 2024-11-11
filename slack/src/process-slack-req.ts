import crypto from 'node:crypto';

export function getQSString(qs: string) {
  const key_val: any = {};
  const arr = qs.split('&');
  if (arr) {
    for (const keyval of arr) {
      const kvpair = keyval.split('=');
      key_val[kvpair[0]] = kvpair[1];
    }
  }
  return key_val;
}

export const validateSlackRequest = async (
  payload: Request,
): Promise<boolean> => {
  // 1. Grab slack signing secret
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    return false;
  }

  // 2. Get timestamp header from request
  const timestamp = payload.headers.get('X-Slack-Request-Timestamp');
  console.log('timestamp:', timestamp);

  // 3. Concatenate version number, timestamp, and request body together
  const headerSlackSignature = payload.headers.get('X-Slack-Signature');
  console.log(`Header slack signature: ${headerSlackSignature}`);
  const [version, header_signature] = headerSlackSignature?.split('=') ?? [];

  const payloadBody = payload.body;
  console.log(`payloadBody: ${payloadBody}`);
  const baseString = `${version}:${timestamp}:${payloadBody}`;

  //hash the resulting string
  const hmac = crypto.createHmac('sha256', signingSecret);
  hmac.update(baseString);

  const digestVal = `v0=${hmac.digest('hex')}`;
  console.log(`Digest val: ${digestVal}`);

  const tsCompare = timeSafeCompare(header_signature, digestVal);
  console.log(tsCompare);
  return true;
};

function bufferEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function timeSafeCompare(a: string, b: string) {
  const sa = String(a);
  const sb = String(b);
  const key = crypto.pseudoRandomBytes(32);
  const ah = crypto.createHmac('sha256', key).update(sa).digest();
  const bh = crypto.createHmac('sha256', key).update(sb).digest();
  console.log('ah', ah, 'bh', bh);
  console.log('a', a, 'b', b);
  return bufferEqual(ah, bh) && a === b;
}
