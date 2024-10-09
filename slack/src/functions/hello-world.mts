// Documentation: https://sdk.netlify.com
import crypto from "node:crypto";
import axios from "axios";
export default async (req: Request): Promise<Response> => {
  console.log("request received", JSON.stringify(req.headers.keys()));
  console.log("slack request body", req);
  if (!req.body) {
    return new Response("Event body is undefined", { status: 200 });
  }
  const slackPayload = await new Response(req.body).text();
  const key_val = getQSString(slackPayload);
  const trigger_id = key_val["trigger_id"];
  console.log("trigger_id:", trigger_id);
  if (!validateSlackRequest(req)) {
    console.log("slack request not validated");
    return new Response("Slack request not validated", { status: 200 });
  }

  const response = displayRepoOptions(["repo1", "repo2"], trigger_id);
  console.log("Response is:", response);
  return new Response("Model requested", { status: 200 });
};

function getDropDownView(triggerId: string, repos: Array<unknown>) {
  return {
    trigger_id: triggerId,
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: "Deploy Docs",
      },
      submit: {
        type: "plain_text",
        text: "Submit",
      },
      close: {
        type: "plain_text",
        text: "Cancel",
      },
      blocks: [
        {
          type: "input",
          block_id: "block_repo_option",
          label: {
            type: "plain_text",
            text: "Select Repo",
          },
          element: {
            type: "multi_static_select",
            action_id: "repo_option",
            placeholder: {
              type: "plain_text",
              text: "Select a repo to deploy",
            },
            option_groups: repos,
          },
        },
        {
          type: "input",
          block_id: "block_hash_option",
          element: {
            type: "plain_text_input",
            action_id: "hash_option",
            placeholder: {
              type: "plain_text",
              text: "Enter a commit hash (defaults to latest master commit)",
            },
          },
          optional: true,
          label: {
            type: "plain_text",
            text: "Commit Hash",
          },
        },
        {
          type: "section",
          block_id: "block_deploy_option",
          text: {
            type: "plain_text",
            text: "How would you like to deploy docs sites?",
          },
          accessory: {
            type: "radio_buttons",
            action_id: "deploy_option",
            initial_option: {
              value: "deploy_individually",
              text: {
                type: "plain_text",
                text: "Deploy individual repos",
              },
            },
            options: [
              {
                value: "deploy_individually",
                text: {
                  type: "plain_text",
                  text: "Deploy individual repos",
                },
              },
              {
                value: "deploy_all",
                text: {
                  type: "plain_text",
                  text: "Deploy all repos",
                },
              },
            ],
          },
        },
      ],
    },
  };
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
  const ah = crypto.createHmac("sha256", key).update(sa).digest();
  const bh = crypto.createHmac("sha256", key).update(sb).digest();
  return bufferEqual(ah, bh) && a === b;
}

function validateSlackRequest(payload: Request): boolean {
  // params needed to verify for slack
  const headerSlackSignature =
    payload.headers.get("X-Slack-Signature")?.toString() ??
    payload.headers.get("x-slack-signature")?.toString(); // no idea why `typeof <sig>` = object
  const timestamp =
    payload.headers.get("X-Slack-Request-Timestamp") ??
    payload.headers.get("x-slack-request-timestamp");
  return true;
  const signingSecret = process.env.SLACK_SECRET;
  if (signingSecret) {
    const hmac = crypto.createHmac("sha256", signingSecret);
    const [version, hash] = headerSlackSignature?.split("=") ?? [];
    const base = `${version}:${timestamp}:${payload.body}`;
    hmac.update(base);
    return timeSafeCompare(hash, hmac.digest("hex"));
  }
  return false;
}

async function displayRepoOptions(
  repos: string[],
  triggerId: string
): Promise<unknown> {
  const repoOptView = getDropDownView(triggerId, repos);
  //TODO: INSERT ENV VARS HERE
  const slackToken = process.env.SLACK_AUTH_TOKEN;
  const slackUrl = "https://slack.com/api/views.open";
  return await axios.post(slackUrl, repoOptView, {
    headers: {
      Authorization: [`Bearer ${slackToken}`],
      "Content-type": "application/json; charset=utf-8",
    },
  });
}

export function getQSString(qs: string) {
  const key_val: any = {};
  const arr = qs.split("&");
  if (arr) {
    arr.forEach((keyval) => {
      const kvpair = keyval.split("=");
      key_val[kvpair[0]] = kvpair[1];
    });
  }
  return key_val;
}
