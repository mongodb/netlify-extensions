import * as mongodb from "mongodb";
import type { ReposBranchesDocument } from "../../search-manifest/src/types.js";
import { buildRepoGroups } from "./build-modal.js";

export async function getDeployableRepos(
  reposBranchesColl: mongodb.Collection<ReposBranchesDocument>
) {
  const query = { prodDeployable: true, internalOnly: false };
  const options = { projection: { repoName: 1, branches: 1 } };
  const cursor = reposBranchesColl.find(query, options);
  return await buildRepoGroups(cursor);
}
