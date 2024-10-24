import type { WithId } from "mongodb";
import type { ManifestEntry } from "./manifestEntry";

type EnvironmentConfig = {
	dev: string;
	stg: string;
	dotcomstg: string;
	dotcomprd: string;
	prd: string;
};

type BucketNames = {
	regression: string;
	dev: string;
	stg: string;
	prd: string;
	dotcomstg: string;
	dotcomprd: string;
};

export interface DocsetsDocument extends WithId<Document> {
	url: EnvironmentConfig;
	prefix: EnvironmentConfig;
	bucket: BucketNames;
}

export interface DatabaseDocument extends ManifestEntry {
	url: string;
	lastModified: Date;
	manifestRevisionId: string;
	searchProperty: string[];
	includeInGlobalSearch: boolean;
}

export interface ReposBranchesDocument extends WithId<Document> {
	project: string;
	search: {
		categoryTitle: string;
		categoryName?: string;
	};
	branches: Array<BranchEntry>;
	prodDeployable: boolean;
	internalOnly: boolean;
}

export interface BranchEntry {
	name?: string;
	gitBranchName: string;
	urlSlug: string;
	isStableBranch: boolean;
	active: boolean;
}
