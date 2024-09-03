import { JSONPath } from "jsonpath-plus";
import { Facet } from "./createFacets";
import { ManifestEntry } from "./manifestEntry";

export class Document {
  //Return indexing data from a page's JSON-formatted AST for search purposes
  tree: any;
  robots: any;
  keywords: any;
  description: any;
  paragraphs: string;
  code: { lang: string; value: any }[];
  title: any;
  headings: any;
  slug: string;
  preview?: string;
  facets: any;
  noIndex: any;
  reasons: any;

  constructor(doc: any) {
    this.tree = doc;

    //find metadata
    [this.robots, this.keywords, this.description] = this.findMetadata();
    //find paragraphs
    this.paragraphs = this.findParagraphs();
    //find code
    this.code = this.findCode();

    //find title, headings
    [this.title, this.headings] = this.findHeadings();

    //derive slug
    this.slug = this.deriveSlug();

    //derive preview
    this.preview = this.derivePreview();

    //derive facets
    this.facets = deriveFacets(this.tree);

    //noindex, reasons
    [this.noIndex, this.reasons] = this.getNoIndex();
  }

  findMetadata() {
    let robots: Boolean = true; //can be set in the rst if the page is supposed to be crawled
    let keywords: string | null = null; //keywords is an optional list of strings
    let description: string | null = null; //this can be optional??

    let results = JSONPath({
      path: "$..children[?(@.name=='meta')]..options",
      json: this.tree,
    });
    if (results.length) {
      if (results.length > 1)
        console.log(
          "length of results is greater than one, it's: " + results.length
        );
      const val = results[0];
      //check if robots, set to false if no robots
      if ("robots" in val && (val.robots == "None" || val.robots == "noindex"))
        robots = false;

      keywords = val?.keywords ?? null;
      description = val?.description ?? null;
    }

    return [robots, keywords, description];
  }

  findParagraphs() {
    let paragraphs = "";

    let results = JSONPath({
      path: "$..children[?(@.type=='paragraph')]..value",
      json: this.tree,
    });

    for (let r of results) {
      paragraphs += " " + r;
    }
    return paragraphs.trim();
  }

  findCode() {
    let results = JSONPath({
      path: "$..children[?(@.type=='code')]",
      json: this.tree,
    });

    let codeContents = [];
    for (let r of results) {
      const lang = r.lang ?? null;
      codeContents.push({ lang: lang, value: r.value });
    }
    return codeContents;
  }

  findHeadings() {
    let headings: string[] = [];
    let title: string = "";
    // Get the children of headings nodes

    let results = JSONPath({
      path: "$..children[?(@.type=='heading')].children",
      json: this.tree,
    });

    //no heading nodes found?? page doesn't have title, or headings
    if (!results.length) return [title, headings];

    for (let r of results) {
      let heading = [];
      const parts = JSONPath({
        path: "$..value",
        json: r,
      });

      //add a check in case there is no parts found
      for (let part of parts) {
        // add a check in case there is no value field found
        heading.push(part);
      }
      headings.push(heading.join());
    }

    title = headings.shift() ?? "";
    return [title, headings];
  }

  deriveSlug() {
    let pageId = this.tree["filename"]?.split(".")[0];
    if (pageId == "index") pageId = "";
    return pageId;
  }

  derivePreview() {
    //set preview to the meta description if one is specified

    if (this.description) return this.description;

    // Set preview to the paragraph value that's a child of a 'target' element
    // (for reference pages that lead with a target definition)

    let results = JSONPath({
      path: "$..children[?(@.type=='target')].children[?(@.type=='paragraph')]",
      json: this.tree,
    });

    if (!results.length) {
      //  Otherwise attempt to set preview to the first content paragraph on the page,
      //   excluding admonitions.
      results = JSONPath({
        path: "$..children[?(@.type=='section')].children[?(@.type=='paragraph')]",
        json: this.tree,
      });
    }

    if (results.length) {
      let strList = [];

      //get value in results
      const first = JSONPath({
        path: "$..value",
        json: results[0],
      });

      for (let f of first) {
        strList.push(f);
      }
      return strList.join("");
    }

    //else, give up and don't provide a preview
    return null;
  }

  getNoIndex() {
    //determining indexability

    let noIndex = false;
    let reasons: string[] = [];

    //if :robots: None in metadata, do not index
    if (!this.robots) {
      noIndex = true;
      reasons.push("robots=None or robots=noindex in meta directive");
    }

    //if page has no title, do not index
    if (!this.title) {
      noIndex = true;
      reasons.push("This page has no headings");
    }

    return [noIndex, reasons];
  }

  exportAsManifestDocument = () => {
    // Generate the manifest dictionary entry from the AST source

    if (this.noIndex) {
      console.info("Refusing to index");
      return null;
    }

    const document = new ManifestEntry({
      slug: this.slug,
      title: this.title,
      headings: this.headings,
      paragraphs: this.paragraphs,
      code: this.code,
      preview: this.preview,
      keywords: this.keywords,
      facets: this.facets,
    });

    return document;
  };
}

const deriveFacets = (tree: any) => {
  //Format facets for ManifestEntry from bson entry tree['facets'] if it exists

  const insertKeyVals = (facet: any, prefix = "") => {
    const key = prefix + facet.category;
    documentFacets[key] = documentFacets[key] ?? [];
    documentFacets[key].push(facet.value);

    if (!facet.subFacets) return;

    for (let subFacet of facet.subFacets) {
      insertKeyVals(subFacet, key + ">" + facet.value + ">");
    }
  };

  const createFacet = (facetEntry: any) => {
    const facet = new Facet(
      facetEntry.category,
      facetEntry.value,
      facetEntry.sub_facets
    );
    insertKeyVals(facet);
  };

  let documentFacets: any = {};
  if (tree["facets"]) {
    for (let facetEntry of tree["facets"]) {
      createFacet(facetEntry);
    }
  }
  return documentFacets;
};
