export function createAppState() {
  return {
    colors: new Set(),
    kwOpen: null,
    kwMode: 'and',
    idMode: 'identity',
    cmcMin: 0,
    cmcMax: 15,
    nameQuery: '',
    powMin: '',
    powMax: '',
    touMin: '',
    touMax: '',
    usdMin: '',
    usdMax: '',
    next: null,
    total: 0,
    shown: 0,
    parts: [],
    tree: { id: 'root', kind: 'group', op: 'or', not: false, children: [] },
    oracleTree: {
      id: 'oracle-root',
      kind: 'group',
      op: 'and',
      children: [{ id: 'oracle-initial', kind: 'leaf', term: '', not: false }],
    },
    focusId: 'root',
    builderOpen: false,
    builderPickerOpen: false,
    lineageSlug: null,
    lineageOpen: {},
    kwSearch: '',
    resultCols: 5,
    searchController: null,
    searchRequest: 0,
    kwTriggerGroup: null,
  };
}

export function createTreeIdFactory() {
  let sequence = 1;
  return () => 'n' + sequence++;
}
