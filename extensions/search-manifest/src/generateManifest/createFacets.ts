export interface Facet {
  category: string;
  value: string;
  subFacets: Array<Facet> | null;
}

export const createFacet = (facet: Facet) => {
  const category = facet.category;
  const value = facet.value;
  const subFacetsArr = [];
  if (facet.subFacets) {
    for (const subFacet of facet.subFacets) {
      subFacetsArr.push(
        createFacet({
          category: subFacet.category,
          value: subFacet.value,
          subFacets: subFacet.subFacets ?? [],
        }),
      );
    }
  }
  const newFacet: Facet = {
    category: category,
    value: value,
    subFacets: subFacetsArr ?? null,
  };
  return newFacet;
};
