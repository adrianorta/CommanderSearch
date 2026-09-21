export function createAppState() {
  return {
    colors: new Set(),
    kwOpen: null,
    kwMode: 'and',
    idMode: 'identity',
    cmcMin: 0,
    cmcMax: 15,
    next: null,
    total: 0,
    shown: 0,
    parts: [],
    tree: { id: 'root', kind: 'group', op: null, not: false, children: [] },
    focusId: 'root',
    builderOpen: false,
    lineageSlug: null,
    lineageOpen: {},
    kwSearch: '',
    resultCols: 2,
    searchController: null,
    searchRequest: 0,
    kwTriggerGroup: null,
  };
}

export function createTreeIdFactory() {
  let sequence = 1;
  return () => 'n' + sequence++;
}
