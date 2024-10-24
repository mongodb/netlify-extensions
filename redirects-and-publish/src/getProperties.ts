import type {
	DatabaseDocument,
	DocsetsDocument,
	ReposBranchesDocument,
} from "./types";
import { getCollection, getSnootyDb } from "./searchConnector";
import type { Collection } from "mongodb";

export const getProperties = async (repoName: string) => {
	//connect to database and get reposBranches, docsets collections
	console.log("connectiong to mongodb...");
	const dbSession = await getSnootyDb();
	const reposBranches = getCollection(dbSession, "repos_branches");
	const docsets = getCollection(dbSession, "docsets");

	console.log("querying repobranches...");
	const repo: ReposBranchesDocument = await getRepoEntry({
		repoName: repoName,
		reposBranches,
	});

	console.log("querying docsets...");
	const { project } = repo;
	const docsetEntry: DocsetsDocument = await getDocsetEntry(docsets, project);

	return docsetEntry;
};

export const getDocsetEntry = async (
	docsets: Collection<DatabaseDocument>,
	project: string,
) => {
	const docsetsQuery = { project: { $eq: project } };
	const docset = await docsets.findOne<DocsetsDocument>(docsetsQuery);
	if (!docset) {
		throw new Error("Error while getting docsets entry in Atlas");
	}
	return docset;
};

export const getRepoEntry = async ({
	repoName,
	reposBranches,
}: {
	repoName: string;
	reposBranches: Collection<DatabaseDocument>;
}) => {
	const query = {
		repoName: repoName,
	};

	const repo = await reposBranches.findOne<ReposBranchesDocument>(query, {
		projection: {
			_id: 0,
			project: 1,
			search: 1,
			branches: 1,
			prodDeployable: 1,
			internalOnly: 1,
		},
	});
	if (!repo) {
		throw new Error(
			`Could not get reposBranches entry for repo ${repoName}, ${repo}, ${JSON.stringify(
				query,
			)}`,
		);
	}

	return repo;
};
