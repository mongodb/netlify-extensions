import axios from "axios";
import { capitalizeFirstLetter } from "./utils.js";
import type { branchOption } from "./types.js";

export const buildRepoGroups = async (cursor: any) => {
  const repoOptions: any[] = [];
  for await (const repo of cursor) {
    const repoName = repo.repoName;

    if (repo.branches.length) {
      const options = [];
      for (const branch of repo.branches) {
        const buildWithSnooty = branch["buildsWithSnooty"];

        if (buildWithSnooty) {
          const active = branch["active"];
          const branchName = capitalizeFirstLetter(branch["gitBranchName"]);

          options.push({
            text: {
              type: "plain_text",
              text: active ? branchName : `(!inactive) ${branchName}`,
            },
            value: branchName,
          });
        }
      }
      const sortedOptions = sortOptions(options);
      const repoOption = {
        label: {
          type: "plain_text",
          text: capitalizeFirstLetter(repoName),
        },
        //sort the options by version number
        options: sortedOptions,
      };
      repoOptions.push(repoOption);
    }
  }
  return repoOptions.sort((repoOne, repoTwo) =>
    repoOne.label.text.localeCompare(repoTwo.label.text)
  );
};

export const sortOptions = (options: Array<branchOption>) => {
  const sortedOptions = options.sort((branchOne, branchTwo) =>
    branchTwo.text.text
      .toString()
      .replace(/\d+/g, (n) => (+n + 100000).toString())
      .localeCompare(
        branchOne.text.text
          .toString()
          .replace(/\d+/g, (n) => (+n + 100000).toString())
      )
  );
  return sortedOptions;
};

export function getDropDownView(triggerId: string, repos: Array<unknown>) {
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
    },
  };
}
