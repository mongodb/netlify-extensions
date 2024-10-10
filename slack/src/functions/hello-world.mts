// Documentation: https://sdk.netlify.com
import crypto from "node:crypto";
import axios from "axios";
import { getQSString, validateSlackRequest } from "../process-slack-req.js";
import { displayRepoOptions } from "../build-modal.js";
import { getReposBranchesCollection } from "../dbConnector.js";

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

export default async (req: Request): Promise<Response> => {
  console.log("request received", req.headers.keys());
  console.log("slack request body", req);
  if (!req.body) {
    return new Response("Event body is undefined", { status: 400 });
  }
  const slackPayload = await new Response(req.body).text();
  const key_val = getQSString(slackPayload);
  const trigger_id = key_val["trigger_id"];

  if (!validateSlackRequest(req)) {
    console.log("slack request not validated");
    return new Response("Slack request not validated", { status: 400 });
  }
  const response: any = await displayRepoOptions([repos], trigger_id);
  console.log("Response is:", response);
  if (!response.data.ok) {
    console.log("Response metadata:", response?.data?.response_metadata);
  }

  const reposBranchesColl = await getReposBranchesCollection();
  const one = await reposBranchesColl.findOne();
  console.log(one);
  return new Response("Model requested", { status: 200 });
};
