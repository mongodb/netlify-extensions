import axios, { type AxiosResponse } from 'axios';

export const displayModal = async ({
  repos,
  triggerId,
  slackAuthToken,
}: {
  repos: Array<repoOption>;
  triggerId: string;
  slackAuthToken: string;
}): Promise<AxiosResponse> => {
  const repoOptView = getDropDownView(triggerId, repos);
  if (!slackAuthToken) {
    throw new Error('No Slack token provided');
  }
  const slackUrl = 'https://slack.com/api/views.open';
  return await axios.post(slackUrl, repoOptView, {
    headers: {
      Authorization: [`Bearer ${slackAuthToken}`],
      'Content-type': 'application/json; charset=utf-8',
    },
  });
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
