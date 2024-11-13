import type * as mongodb from 'mongodb';
import type { ReposBranchesDocument } from 'util/databaseConnection/types';
import type { branchOption, repoOption } from './build-modal.js';
import { capitalizeFirstLetter } from './utils.js';

export async function getDeployableRepos(
  reposBranchesColl: mongodb.Collection<ReposBranchesDocument>,
) {
  const query = { prodDeployable: true, internalOnly: false };
  const options = { projection: { repoName: 1, branches: 1 } };
  const cursor = reposBranchesColl.find(query, options);
  return await buildRepoGroups(cursor);
}

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
