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
  // params needed to verify for slack
  const headerSlackSignature = payload.headers.get('X-Slack-Signature');
  console.log(`Header slack signature: ${headerSlackSignature}`);
  const timestamp = payload.headers.get('X-Slack-Request-Timestamp');
  console.log('timestamp:', timestamp);
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    return false;
  }
  const hmac = crypto.createHmac('sha256', signingSecret);
  const [version, hash] = headerSlackSignature?.split('=') ?? [];
  const payloadBody = payload.body;
  console.log(payloadBody);
  const baseString = `${version}:${timestamp}:${payloadBody}`;
  console.log('base', JSON.stringify(baseString));
  hmac.update(baseString);

  console.log(`hmac: ${JSON.stringify(hmac.digest('hex'))}`);

  const tsCompare = timeSafeCompare(hash, `v0=${hmac.digest('hex')}`);
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
