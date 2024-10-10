import axios from "axios";

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
      ],
      // blocks: [
      //   {
      //     type: "input",
      //     block_id: "block_repo_option",
      //     label: {
      //       type: "plain_text",
      //       text: "Select Repo",
      //     },
      //     element: {
      //       type: "multi_static_select",
      //       action_id: "repo_option",
      //       placeholder: {
      //         type: "plain_text",
      //         text: "Select a repo to deploy",
      //       },
      //       option_groups: repos,
      //     },
      //   },
      //   {
      //     type: "input",
      //     block_id: "block_hash_option",
      //     element: {
      //       type: "plain_text_input",
      //       action_id: "hash_option",
      //       placeholder: {
      //         type: "plain_text",
      //         text: "Enter a commit hash (defaults to latest master commit)",
      //       },
      //     },
      //     optional: true,
      //     label: {
      //       type: "plain_text",
      //       text: "Commit Hash",
      //     },
      //   },
      //   {
      //     type: "section",
      //     block_id: "block_deploy_option",
      //     text: {
      //       type: "plain_text",
      //       text: "How would you like to deploy docs sites?",
      //     },
      //     accessory: {
      //       type: "radio_buttons",
      //       action_id: "deploy_option",
      //       initial_option: {
      //         value: "deploy_individually",
      //         text: {
      //           type: "plain_text",
      //           text: "Deploy individual repos",
      //         },
      //       },
      //       options: [
      //         {
      //           value: "deploy_individually",
      //           text: {
      //             type: "plain_text",
      //             text: "Deploy individual repos",
      //           },
      //         },
      //         {
      //           value: "deploy_all",
      //           text: {
      //             type: "plain_text",
      //             text: "Deploy all repos",
      //           },
      //         },
      //       ],
      //     },
      //   },
      // ],
    },
  };
}

export async function displayRepoOptions(
  repos: Array<any>,
  triggerId: string
): Promise<unknown> {
  const repoOptView = getDropDownView(triggerId, repos);
  //TODO: INSERT ENV VARS HERE
  const slackToken = process.env.SLACK_AUTH_TOKEN;
  if (!slackToken) return false;
  const slackUrl = "https://slack.com/api/views.open";
  return await axios.post(slackUrl, repoOptView, {
    headers: {
      Authorization: [`Bearer ${slackToken}`],
      "Content-type": "application/json; charset=utf-8",
    },
  });
}
