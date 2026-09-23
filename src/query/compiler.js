const CMC_MAX = 15;

function selectedColors(colors) {
  return ['W', 'U', 'B', 'R', 'G'].filter(
    (color) => colors?.has?.(color) || colors?.includes?.(color)
  );
}

export function identityClause(colors, idMode) {
  const picked = selectedColors(colors);
  const colorless = colors?.has?.('C') || colors?.includes?.('C');
  if (!picked.length && !colorless) return '';
  if (!picked.length && colorless) {
    if (idMode === 'exact') return 'c=c';
    if (idMode === 'identity') return 'id<=c';
    if (idMode === 'inside') return 'c=c';
    return 'c>=c';
  }
  const code = picked.join('').toLowerCase();
  if (idMode === 'exact') return 'c=' + code;
  if (idMode === 'identity') return 'id<=' + code;
  if (idMode === 'inside') return 'c<=' + code + ' -c:c';
  return 'c>=' + code;
}

export function typeQuery(type) {
  return String(type).includes(' ') ? 't:"' + type + '"' : 't:' + type;
}

export function isQuery(value) {
  return 'is:' + String(value).toLowerCase();
}

export function layoutQuery(value) {
  return 'layout:' + String(value).toLowerCase();
}

function isSimpleTerm(query) {
  const value = String(query || '').trim();
  return /^[a-z]+:[^\s()]+$/i.test(value) || /^[a-z]+:"[^"]+"$/i.test(value);
}

export function negateTerm(query) {
  const value = String(query || '').trim();
  if (!value) return '';
  if (value.startsWith('-')) return value;
  if (value.startsWith('(') || !isSimpleTerm(value)) {
    return value.startsWith('(') ? '-' + value : '-(' + value + ')';
  }
  return '-' + value;
}

export function compileNode(node, kwMode) {
  if (!node) return '';
  if (node.kind === 'leaf') {
    const query = String(node.query || '').trim();
    if (!query) return '';
    return node.not ? negateTerm(query) : query;
  }
  const parts = (node.children || []).map((child) => compileNode(child, kwMode)).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) {
    const inner = parts[0];
    return node.not ? negateTerm(inner) : inner;
  }
  let inner;
  if (node.op === 'or') inner = '(' + parts.join(' or ') + ')';
  else if (node.op === 'and') inner = parts.join(' ');
  else if (node.id === 'root')
    inner = kwMode === 'or' ? '(' + parts.join(' or ') + ')' : parts.join(' ');
  else inner = '';
  if (!inner) return '';
  return node.not ? negateTerm(inner) : inner;
}

function parseOracleQuery(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  const tokens = [];
  const pattern = /"([^"]+)"|([^,\s]+)|,/g;
  let match;
  while ((match = pattern.exec(value))) {
    if (match[1] || match[2]) tokens.push((match[1] || match[2]).trim());
  }
  const included = [];
  const excluded = [];
  tokens.forEach((token) => {
    if (!token) return;
    const negated = token.startsWith('-') || token.startsWith('−');
    const name = (negated ? token.slice(1) : token).trim().toLowerCase();
    if (!name) return;
    const term =
      name.includes(' ') || name.includes("'") || name.includes(',')
        ? 'o:"' + name + '"'
        : 'o:' + name;
    (negated ? excluded : included).push(negated ? '-' + term : term);
  });
  const parts = [];
  if (included.length === 1) parts.push(included[0]);
  else if (included.length > 1) parts.push('(' + included.join(' or ') + ')');
  parts.push(...excluded);
  return parts.join(' ');
}

function parseSubtypeQuery(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  const tokens = [];
  const pattern = /"([^"]+)"|([^,\s]+)|,/g;
  let match;
  while ((match = pattern.exec(value))) {
    if (match[1] || match[2]) tokens.push((match[1] || match[2]).trim());
  }
  const included = [];
  const excluded = [];
  tokens.forEach((token) => {
    if (!token) return;
    const negated = token.startsWith('-') || token.startsWith('−');
    const name = (negated ? token.slice(1) : token).trim().toLowerCase();
    if (!name) return;
    const term =
      name.includes(' ') || name.includes("'") || name.includes(',')
        ? 't:"' + name + '"'
        : 't:' + name;
    (negated ? excluded : included).push(negated ? '-' + term : term);
  });
  const parts = [];
  if (included.length === 1) parts.push(included[0]);
  else if (included.length > 1) parts.push('(' + included.join(' or ') + ')');
  parts.push(...excluded);
  return parts.join(' ');
}

export function cmcIsAny(min, max) {
  return min <= 0 && max >= CMC_MAX;
}

export function cmcClause(min, max) {
  if (cmcIsAny(min, max)) return '';
  if (min === max) return 'cmc=' + min;
  return 'cmc>=' + min + ' cmc<=' + max;
}

export function buildQuery({
  colors,
  idMode,
  cmcMin,
  cmcMax,
  parts = [],
  tree,
  kwMode,
  oracle = '',
  subtype = '',
  set = '',
  rarity = '',
  yearFrom = '',
  yearTo = '',
}) {
  const clauses = ['f:commander', 'game:paper'];
  const identity = identityClause(colors, idMode);
  if (identity) clauses.push(identity);
  const oracleText = parseOracleQuery(oracle);
  if (oracleText) clauses.push(oracleText);
  const subtypes = parseSubtypeQuery(subtype);
  if (subtypes) clauses.push(subtypes);
  
  const cmc = cmcClause(cmcMin, cmcMax);
  if (cmc) clauses.push(cmc);
  clauses.push(...metadataClauses({ set, rarity, yearFrom, yearTo }));
  const match = tree?.children?.length ? compileNode(tree, kwMode) : partsClause(parts, kwMode);
  if (match) clauses.push(match);
  return clauses.join(' ');
}

function partsClause(parts, kwMode) {
  const queries = parts.map((part) => String(part.query || '').trim()).filter(Boolean);
  if (!queries.length) return '';
  if (queries.length === 1) return queries[0];
  return kwMode === 'or' ? '(' + queries.join(' or ') + ')' : queries.join(' ');
}

function fieldValue(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function metadataClauses({ set = '', rarity = '', yearFrom = '', yearTo = '' } = {}) {
  const clauses = [];
  const setValue = fieldValue(set);
  const rarityValue = fieldValue(rarity);
  const from = String(yearFrom || '').trim();
  const to = String(yearTo || '').trim();
  if (setValue) {
    const normalizedSet = setValue.toLowerCase();
    clauses.push(
      normalizedSet.includes(' ')
        ? 'set:"' + normalizedSet.replace(/"/g, '') + '"'
        : 'set:' + normalizedSet
    );
  }
  const rarities = Array.isArray(rarity)
    ? rarity
        .map(fieldValue)
        .filter(Boolean)
        .map((value) => value.toLowerCase())
    : rarityValue
      ? [rarityValue.toLowerCase()]
      : [];
  if (rarities.length === 1) clauses.push('rarity:' + rarities[0]);
  if (rarities.length > 1)
    clauses.push('(' + rarities.map((value) => 'rarity:' + value).join(' or ') + ')');
  if (/^\d{4}$/.test(from)) clauses.push('released>=' + from + '-01-01');
  if (/^\d{4}$/.test(to)) clauses.push('released<=' + to + '-12-31');
  return clauses;
}

export function kwQuery(name) {
  const key = String(name).toLowerCase();
  const quoted = /[\s\-!]/.test(key);
  const kw = quoted ? 'kw:"' + key + '"' : 'kw:' + key;
  const oracle = quoted ? 'o:"' + key + '"' : 'o:' + key;
  return '(' + kw + ' or ' + oracle + ')';
}
