//change this to an interface
export class ManifestEntry {
	slug: string;
	strippedSlug?: string;
	title: string;
	headings?: string[];
	paragraphs: string;
	code: { lang: string | null; value: string }[];
	preview?: string | null;
	tags: string | null;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	facets: any;

	// biome-ignore lint/suspicious/noExplicitAny: Want it to be any
	constructor(entry: any) {
		this.slug = entry.slug;
		this.title = entry.title;
		this.headings = entry.headings;
		this.paragraphs = entry.paragraphs;
		this.code = entry.code;
		this.preview = entry.preview;
		this.tags = entry.keywords;
		this.facets = entry.facets;
	}
}