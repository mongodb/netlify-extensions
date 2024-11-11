import type * as mongodb from 'mongodb';
import type { ReposBranchesDocument } from '../../../search-manifest/src/types.js';

import { capitalizeFirstLetter } from './utils.js';

export type branchOption = {
  text: {
    type: string;
    text: string;
  };
  value: string;
};

export type repoOption = {
  label: {
    type: string;
    text: string;
  };
  options: Array<branchOption>;
};

type slackBlock = {
  type: 'plain_text';
  text: string;
};

export type dropdownView = {
  trigger_id: string;
  view: {
    type: 'modal';
    title: slackBlock;
    submit: slackBlock;
    close: slackBlock;
    blocks: [
      {
        type: 'input';
        block_id: 'block_repo_option';
        label: slackBlock;
        element: {
          type: 'multi_static_select';
          action_id: 'repo_option';
          placeholder: slackBlock;
          option_groups: Array<repoOption>;
        };
      },
    ];
  };
};

export const buildRepoGroups = async (
  cursor: mongodb.FindCursor<mongodb.WithId<ReposBranchesDocument>>,
): Promise<Array<repoOption>> => {
  const repoOptions: Array<repoOption> = [];
  for await (const repo of cursor) {
    const repoName = repo.repoName;

    if (repo?.branches?.length) {
      const options: Array<branchOption> = [];
      for (const branch of repo.branches) {
        const active = branch.active;
        const branchName = branch.gitBranchName;
        options.push({
          text: {
            type: 'plain_text',
            text: active ? branchName : `(!inactive) ${branchName}`,
          },
          value: `${repoName}/${branchName}`,
        });
      }
      const sortedOptions = sortOptions(options);
      const repoOption = {
        label: {
          type: 'plain_text',
          text: capitalizeFirstLetter(repoName),
        },
        //sort the options by version number
        options: sortedOptions,
      };
      repoOptions.push(repoOption);
    }
  }
  return repoOptions.sort((repoOne, repoTwo) =>
    repoOne.label.text.localeCompare(repoTwo.label.text),
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
          .replace(/\d+/g, (n) => (+n + 100000).toString()),
      ),
  );
  return sortedOptions;
};

export function getDropDownView(
  triggerId: string,
  repos: Array<repoOption>,
): dropdownView {
  return {
    trigger_id: triggerId,
    view: {
      type: 'modal',
      title: {
        type: 'plain_text',
        text: 'Deploy Docs',
      },
      submit: {
        type: 'plain_text',
        text: 'Submit',
      },
      close: {
        type: 'plain_text',
        text: 'Cancel',
      },
      blocks: [
        {
          type: 'input',
          block_id: 'block_repo_option',
          label: {
            type: 'plain_text',
            text: 'Select Repo',
          },
          element: {
            type: 'multi_static_select',
            action_id: 'repo_option',
            placeholder: {
              type: 'plain_text',
              text: 'Select a repo to deploy',
            },
            option_groups: repos,
          },
        },
      ],
    },
  };
}
