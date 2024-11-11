import crypto from 'node:crypto';

export function validateSlackRequest(payload: Request): boolean {
  // params needed to verify for slack
  const headerSlackSignature =
    payload.headers.get('X-Slack-Signature')?.toString() ??
    payload.headers.get('x-slack-signature')?.toString();
  console.log(`Header slack signature: ${headerSlackSignature}`);
  const timestamp =
    payload.headers.get('X-Slack-Request-Timestamp') ??
    payload.headers.get('x-slack-request-timestamp');
  console.log(`Timestamp: ${timestamp}`);
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    return false;
  }
  const hmac = crypto.createHmac('sha256', signingSecret);
  const [version, hash] = headerSlackSignature?.split('=') ?? [];
  const base = `${version}:${timestamp}:${payload.body}`;
  hmac.update(base);
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
