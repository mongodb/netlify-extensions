export interface Facet {
  category: string;
  value: string;
  subFacets: Array<Facet> | null;
}

export const createFacet = (facet: Facet) => {
  const subFacetsArr = [];
  if (facet.subFacets) {
    for (const subFacet of facet.subFacets) {
      subFacetsArr.push(
        createFacet({
          category: subFacet.category,
          value: subFacet.value,
          subFacets: subFacet.subFacets,
        }),
      );
    }
  }
  const newFacet: Facet = {
    category: facet.category,
    value: facet.value,
    subFacets: subFacetsArr ?? null,
  };
  return newFacet;
};
