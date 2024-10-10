// Documentation: https://sdk.netlify.com
import crypto from "node:crypto";
import axios from "axios";
import { getQSString, validateSlackRequest } from "../process-slack-req.js";
import { displayRepoOptions } from "../build-modal.js";

export default async (req: Request): Promise<Response> => {
  console.log("request received", req.headers.keys());
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
  const repos = {
    label: {
      type: "plain_text",
      text: "repoName",
    },
    options: [
      {
        text: {
          type: "plain_text",
          text: "repo Name",
        },
        value: "repo Name",
      },
    ],
  };
  const response: any = await displayRepoOptions([repos], trigger_id);
  console.log("Response is:", response);
  console.log("Response metadata:", response?.data?.response_metadata);
  return new Response("Model requested", { status: 200 });
};
