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
  console.log(JSON.stringify(key_val));
  return key_val;
}

export function validateSlackRequest(payload: Request): boolean {
  // params needed to verify for slack
  const headerSlackSignature = payload.headers.get('X-Slack-Signature');
  console.log(`Header slack signature: ${headerSlackSignature}`);
  const timestamp = payload.headers.get('X-Slack-Request-Timestamp');
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    return false;
  }
  const hmac = crypto.createHmac('sha256', signingSecret);
  const [version, hash] = headerSlackSignature?.split('=') ?? [];
  const baseString = `${version}:${timestamp}:${payload.body}`;
  console.log('base', baseString);
  hmac.update(baseString);
  hmac.digest('hex');

  console.log(`hmac: ${hmac}`);

  const tsCompare = timeSafeCompare(hash, hmac.digest('hex'));
  return true;
}

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
  return bufferEqual(ah, bh) && a === b;
}
