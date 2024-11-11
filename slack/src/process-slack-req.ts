import crypto from 'node:crypto';

export function getQSString(qs: string) {
  const key_val: Record<string, string> = {};
  const arr = qs.split('&');
  if (arr) {
    for (const keyval of arr) {
      const kvpair = keyval.split('=');
      key_val[kvpair[0]] = kvpair[1];
    }
  }
  return key_val;
}

// Refer to Slack API docs on verifying requests from Slack
// https://api.slack.com/authentication/verifying-requests-from-slack#:~:text=Verify%20requests%20from%20Slack%20with,case%20should%20not%20be%20assumed).
export const validateSlackRequest = async ({
  requestHeaders,
  requestBody,
}: {
  requestHeaders: Headers;
  requestBody: string;
}): Promise<boolean> => {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    return false;
  }

  const timestamp = requestHeaders.get('X-Slack-Request-Timestamp');

  const headerSlackSignature = requestHeaders.get('X-Slack-Signature');
  const [version, header_signature] = headerSlackSignature?.split('=') ?? [];

  const baseString = `${version}:${timestamp}:${requestBody}`;

  const hmac = crypto.createHmac('sha256', signingSecret);
  hmac.update(baseString);

  const digestVal = hmac.digest('hex');

  const tsCompare = timeSafeCompare(header_signature, digestVal);
  return tsCompare;
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
  return bufferEqual(ah, bh) && a === b;
}
