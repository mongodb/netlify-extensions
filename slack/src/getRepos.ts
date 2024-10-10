import * as mongodb from "mongodb";
import type { ReposBranchesDocument } from "../../search-manifest/src/types.js";

export async function getDeployableRepos(
  reposBranchesColl: mongodb.Collection<ReposBranchesDocument>
) {
  const query = { prodDeployable: true, internalOnly: false };
  const options = { projection: { repoName: 1, branches: 1 } };
  const cursor = reposBranchesColl.find(query, options);
  return await buildGroups(cursor);
}

export const buildGroups = async (cursor: any) => {
  const repoOptions: any[] = [];
  for await (const repo of cursor) {
    const repoName = repo.repoName;

    if (repo.branches.length) {
      const options = [];
      for (const branch of repo.branches) {
        const buildWithSnooty = branch["buildsWithSnooty"];

        if (buildWithSnooty) {
          const active = branch["active"];
          const branchName = branch["gitBranchName"];
          const repoPath = `${repoName}/${branchName}`;
          let txt: string;
          if (!active) {
            txt = `(!inactive) ${repoPath}`;
          } else {
            txt = repoPath;
          }
          options.push({
            text: {
              type: "plain_text",
              text: txt,
            },
            value: repoPath,
          });
        }
      }
      const sortedOptions = sortOptions(options);
      const repoOption = {
        label: {
          type: "plain_text",
          text: repoName,
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

export type branchOption = {
  text: {
    type: string;
    text: string;
  };
  value: string;
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
