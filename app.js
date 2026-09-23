import {
  buildQuery as compileQuery,
  cmcClause as compileCmcClause,
  cmcIsAny as isCmcAny,
  identityClause as compileIdentityClause,
  isQuery,
  kwQuery,
  layoutQuery,
  typeQuery
} from "./src/query/compiler.js";
import { createScryfallClient } from "./src/api/scryfall-client.js";
import { facesFor, formatPrice, imageFor, priceFromObj, typeFor } from "./src/ui/cards.js";
import { createAppState, createTreeIdFactory } from "./src/ui/state.js";

const COLORS = ["W", "U", "B", "R", "G"];
const ALL_COLORS = [...COLORS, "C"];
const CMC_MAX = 15;
const ROLE_ITEMS = {
  "Ramp": [
    ["Ramp", "otag:ramp"],
    ["Mana rock", "otag:mana-rock"],
    ["Mana dork", "otag:mana-dork"],
    ["Ritual", "otag:ritual"],
    ["Cost reduce", "otag:cost-reducer"],
    ["Treasure", "kw:treasure"],
  ],
  "Combat": [
    ["Extra combat", "otag:extra-combat-phase"],
    ["Anthem", "otag:anthem"],
    ["Attacks trigger", "otag:attack-trigger"],
    ["Overrun", "otag:overrun"],
  ],
  "Evasion": [
    ["Unblockable", "otag:unblockable"],
  ],
  "Protection": [
    ["Pillowfort", "otag:pillowfort"],
    ["Fog", "otag:fog"],
    ["Grant hexproof", "otag:gives-hexproof"],
    ["Grant indestructible", "otag:gives-indestructible"],
  ],
  "Removal": [
    ["Board wipe", "otag:sweeper"],
    ["Spot removal", "otag:removal-creature"],
    ["Edict", "otag:removal-sacrifice"],
    ["Fight", "otag:removal-fight"],
    ["Burn", "otag:burn"],
    ["Counterspell", "otag:counterspell"],
    ["Stifle", "otag:counterspell-ability"],
    ["Bounce", "otag:bounce"],
    ["Prison", "otag:pacifism"],
    ["Theft", "otag:theft-creature"],
    ["Artifact hate", "otag:removal-artifact"],
    ["Enchantment hate", "otag:removal-enchantment"],
    ["Land destruction", "otag:removal-land"],
    ["Graveyard hate", "otag:hate-graveyard"],
    ["Hand hate", "otag:hate-discard"],
    ["Discard", "otag:discard"],
  ],
  "Card Draw": [
    ["Draw", "otag:draw"],
    ["Cantrip", "otag:cantrip"],
    ["Loot", "otag:loot"],
    ["Impulse", "otag:impulse"],
    ["Wheel", "otag:wheel"],
    ["Scry", "kw:scry"],
    ["Surveil", "kw:surveil"],
    ["Clue", "kw:clue"],
    ["Blood", "kw:blood"],
  ],
  "Tutors": [
    ["Tutor", "otag:tutor"],
  ],
  "Graveyard": [
    ["Sac outlet", "otag:sacrifice-outlet-creature"],
    ["Mill", "otag:mill"],
    ["Self-mill", "otag:mill-self"],
    ["Dies", "otag:death-trigger"],
  ],
  "Recursion": [
    ["Recursion", "otag:recursion"],
    ["Reanimate", "otag:reanimate"],
    ["Blink", "otag:flicker"],
  ],
  "Life": [
    ["Lifegain", "otag:lifegain"],
    ["Drain", "otag:drain-life"],
    ["Food", "kw:food"],
  ],
  "Cast": [
    ["Cast trigger", "otag:cast-trigger"],
  ],
  "Copy": [
    ["Copy", "otag:copy"],
    ["Clone", "otag:clone"],
  ],
  "Politics": [
    ["Group hug", "otag:group-hug"],
    ["Goad", "kw:goad"],
    ["Stax", "otag:tax"],
    ["Monarch", "otag:monarch-matters"],
    ["Initiative", "otag:take-the-initiative"],
    ["The Ring", "otag:the-ring-tempts-you"],
  ],
  "Finishers": [
    ["Extra turn", "otag:extra-turn"],
    ["Poison", "otag:poisonous"],
  ],
};
const TAG_GRAPH = {"ramp":{"slug":"ramp","label":"ramp","n":555,"parents":[],"children":[{"slug":"land-ramp","label":"land ramp","n":497},{"slug":"combat-ramp","label":"combat ramp","n":160},{"slug":"mana-producer","label":"mana producer","n":125},{"slug":"ramp-with-set-s-mechanic","label":"ramp with set's mechanic","n":78},{"slug":"ritual","label":"ritual","n":70},{"slug":"mana-increaser","label":"mana increaser","n":64},{"slug":"extra-land","label":"extra land","n":36},{"slug":"repeatable-landers","label":"repeatable landers","n":3}],"siblings":[]},"mana-rock":{"slug":"mana-rock","label":"mana rock","n":110,"parents":[{"slug":"mana-producer","label":"mana producer","n":125}],"children":[{"slug":"utility-mana-rock","label":"utility mana rock","n":252},{"slug":"mana-rock-with-set-s-mechanic","label":"mana rock with set's mechanic","n":108},{"slug":"moxen","label":"moxen","n":10}],"siblings":[{"slug":"mana-dork","label":"mana dork","n":462},{"slug":"mana-dork-egg","label":"mana dork egg","n":32}]},"mana-dork":{"slug":"mana-dork","label":"mana dork","n":462,"parents":[{"slug":"mana-producer","label":"mana producer","n":125}],"children":[],"siblings":[{"slug":"mana-rock","label":"mana rock","n":110},{"slug":"mana-dork-egg","label":"mana dork egg","n":32}]},"ritual":{"slug":"ritual","label":"ritual","n":70,"parents":[{"slug":"ramp","label":"ramp","n":555}],"children":[],"siblings":[{"slug":"land-ramp","label":"land ramp","n":497},{"slug":"combat-ramp","label":"combat ramp","n":160},{"slug":"mana-producer","label":"mana producer","n":125},{"slug":"ramp-with-set-s-mechanic","label":"ramp with set's mechanic","n":78},{"slug":"mana-increaser","label":"mana increaser","n":64},{"slug":"extra-land","label":"extra land","n":36},{"slug":"repeatable-landers","label":"repeatable landers","n":3}]},"cost-reducer":{"slug":"cost-reducer","label":"cost reducer","n":114,"parents":[],"children":[{"slug":"cost-reducer-creature","label":"cost-reducer-creature","n":85},{"slug":"cost-reducer-activated-ability","label":"cost-reducer-activated-ability","n":25},{"slug":"cost-reducer-colored-mana","label":"cost-reducer-colored-mana","n":21},{"slug":"cost-reducer-equip-ability","label":"cost-reducer-equip-ability","n":21},{"slug":"cost-reducer-artifact","label":"cost-reducer-artifact","n":20},{"slug":"gives-affinity","label":"gives affinity","n":17},{"slug":"gives-convoke","label":"gives convoke","n":14},{"slug":"cost-reducer-enchantment","label":"cost-reducer-enchantment","n":11},{"slug":"cost-reducer-noncreature","label":"cost-reducer-noncreature","n":11},{"slug":"cost-reducer-planeswalker","label":"cost-reducer-planeswalker","n":5}],"siblings":[]},"extra-combat-phase":{"slug":"extra-combat-phase","label":"extra combat phase","n":54,"parents":[{"slug":"phase-manipulation","label":"phase manipulation","n":15}],"children":[],"siblings":[{"slug":"skip-draw-step","label":"skip draw step","n":20},{"slug":"skip-untap-step","label":"skip untap step","n":11},{"slug":"extra-upkeep","label":"extra upkeep","n":7},{"slug":"extra-draw-step","label":"extra draw step","n":4}]},"anthem":{"slug":"anthem","label":"anthem","n":576,"parents":[],"children":[],"siblings":[]},"unblockable":{"slug":"unblockable","label":"unblockable","n":206,"parents":[{"slug":"evasion","label":"evasion","n":4745}],"children":[],"siblings":[{"slug":"gains-flying","label":"gains flying","n":319},{"slug":"gains-menace","label":"gains menace","n":87},{"slug":"french-vanilla-walker","label":"french vanilla walker","n":68},{"slug":"unique-evasion","label":"unique evasion","n":51},{"slug":"daunt","label":"daunt","n":42},{"slug":"gains-protection","label":"gains protection","n":42},{"slug":"high-flying","label":"high flying","n":35},{"slug":"stalking","label":"stalking","n":28}]},"evasion":{"slug":"evasion","label":"evasion","n":4745,"parents":[],"children":[{"slug":"gains-flying","label":"gains flying","n":319},{"slug":"unblockable","label":"unblockable","n":206},{"slug":"gains-menace","label":"gains menace","n":87},{"slug":"french-vanilla-walker","label":"french vanilla walker","n":68},{"slug":"unique-evasion","label":"unique evasion","n":51},{"slug":"daunt","label":"daunt","n":42},{"slug":"gains-protection","label":"gains protection","n":42},{"slug":"high-flying","label":"high flying","n":35},{"slug":"stalking","label":"stalking","n":28},{"slug":"skulk","label":"skulk","n":18}],"siblings":[]},"attack-trigger":{"slug":"attack-trigger","label":"attack trigger","n":2077,"parents":[{"slug":"triggered-ability","label":"triggered ability","n":7961}],"children":[{"slug":"titan-trigger","label":"titan trigger","n":175},{"slug":"firebend-like","label":"firebend-like","n":45},{"slug":"gains-firebending","label":"gains firebending","n":1}],"siblings":[{"slug":"intervening-if-clause","label":"intervening if clause","n":2207},{"slug":"delayed-trigger","label":"delayed trigger","n":1132},{"slug":"death-trigger","label":"death trigger","n":593},{"slug":"block-trigger","label":"block trigger","n":422},{"slug":"reflexive-trigger","label":"reflexive trigger","n":317},{"slug":"ward","label":"ward","n":168},{"slug":"cast-trigger","label":"cast trigger","n":148},{"slug":"trigger-from-graveyard","label":"trigger from graveyard","n":147}]},"fog":{"slug":"fog","label":"fog","n":36,"parents":[{"slug":"damage-prevention","label":"damage prevention","n":373}],"children":[{"slug":"fog-selective","label":"fog-selective","n":61}],"siblings":[{"slug":"damage-redirection","label":"damage redirection","n":51},{"slug":"absorb","label":"absorb","n":24},{"slug":"ablative-armor","label":"ablative armor","n":22},{"slug":"dolmen-ability","label":"dolmen ability","n":9},{"slug":"circle-of-protection","label":"circle of protection","n":9}]},"overrun":{"slug":"overrun","label":"overrun","n":97,"parents":[{"slug":"gives-trample","label":"gives trample","n":451},{"slug":"power-boost-to-all","label":"power boost to all","n":959}],"children":[],"siblings":[{"slug":"gives-pp-counters-to-all","label":"gives pp counters to all","n":207},{"slug":"trumpet-blast","label":"trumpet blast","n":35},{"slug":"battle-cry","label":"battle cry","n":18},{"slug":"prowess-anthem","label":"prowess anthem","n":8}]},"pillowfort":{"slug":"pillowfort","label":"pillowfort","n":21,"parents":[],"children":[{"slug":"tax-attack","label":"tax attack","n":41}],"siblings":[]},"gives-hexproof":{"slug":"gives-hexproof","label":"gives hexproof","n":168,"parents":[{"slug":"protection","label":"protection","n":0}],"children":[],"siblings":[{"slug":"protects-creature","label":"protects-creature","n":781},{"slug":"protects-all","label":"protects-all","n":293},{"slug":"gives-indestructible","label":"gives indestructible","n":287},{"slug":"gives-protection","label":"gives protection","n":127},{"slug":"protects-planeswalker","label":"protects-planeswalker","n":102},{"slug":"gives-ward","label":"gives ward","n":71},{"slug":"protects-artifact","label":"protects-artifact","n":65},{"slug":"gains-hexproof","label":"gains hexproof","n":63}]},"gives-indestructible":{"slug":"gives-indestructible","label":"gives indestructible","n":287,"parents":[{"slug":"protection","label":"protection","n":0}],"children":[],"siblings":[{"slug":"protects-creature","label":"protects-creature","n":781},{"slug":"protects-all","label":"protects-all","n":293},{"slug":"gives-hexproof","label":"gives hexproof","n":168},{"slug":"gives-protection","label":"gives protection","n":127},{"slug":"protects-planeswalker","label":"protects-planeswalker","n":102},{"slug":"gives-ward","label":"gives ward","n":71},{"slug":"protects-artifact","label":"protects-artifact","n":65},{"slug":"gains-hexproof","label":"gains hexproof","n":63}]},"sweeper":{"slug":"sweeper","label":"sweeper","n":741,"parents":[{"slug":"removal","label":"removal","n":0}],"children":[{"slug":"sweeper-one-sided","label":"sweeper-one-sided","n":243}],"siblings":[{"slug":"spot-removal","label":"spot removal","n":5529},{"slug":"removal-creature","label":"removal-creature","n":1930},{"slug":"repeatable-removal","label":"repeatable removal","n":1786},{"slug":"removal-destroy","label":"removal-destroy","n":1718},{"slug":"multi-removal","label":"multi removal","n":680},{"slug":"removal-exile","label":"removal-exile","n":454},{"slug":"removal-nonland","label":"removal-nonland","n":402},{"slug":"removal-sacrifice","label":"removal-sacrifice","n":364}]},"removal":{"slug":"removal","label":"removal","n":0,"parents":[],"children":[{"slug":"spot-removal","label":"spot removal","n":5529},{"slug":"removal-creature","label":"removal-creature","n":1930},{"slug":"repeatable-removal","label":"repeatable removal","n":1786},{"slug":"removal-destroy","label":"removal-destroy","n":1718},{"slug":"sweeper","label":"sweeper","n":741},{"slug":"multi-removal","label":"multi removal","n":680},{"slug":"removal-exile","label":"removal-exile","n":454},{"slug":"removal-nonland","label":"removal-nonland","n":402},{"slug":"removal-sacrifice","label":"removal-sacrifice","n":364},{"slug":"removal-bounce","label":"removal-bounce","n":346}],"siblings":[]},"removal-creature":{"slug":"removal-creature","label":"removal-creature","n":1930,"parents":[{"slug":"removal","label":"removal","n":0}],"children":[{"slug":"burn-creature","label":"burn creature","n":1047},{"slug":"removal-toughness","label":"removal-toughness","n":614},{"slug":"removal-nonland","label":"removal-nonland","n":402},{"slug":"removal-permanent","label":"removal-permanent","n":213},{"slug":"man-o-war","label":"man-o'-war","n":99},{"slug":"pacifism","label":"pacifism","n":96},{"slug":"doom-blade","label":"doom blade","n":84},{"slug":"no-mercy","label":"no mercy","n":7},{"slug":"buttfight","label":"buttfight","n":4},{"slug":"removal-nonenchantment","label":"removal-nonenchantment","n":3}],"siblings":[{"slug":"spot-removal","label":"spot removal","n":5529},{"slug":"repeatable-removal","label":"repeatable removal","n":1786},{"slug":"removal-destroy","label":"removal-destroy","n":1718},{"slug":"sweeper","label":"sweeper","n":741},{"slug":"multi-removal","label":"multi removal","n":680},{"slug":"removal-exile","label":"removal-exile","n":454},{"slug":"removal-nonland","label":"removal-nonland","n":402},{"slug":"removal-sacrifice","label":"removal-sacrifice","n":364}]},"burn":{"slug":"burn","label":"burn","n":0,"parents":[],"children":[{"slug":"burn-player","label":"burn player","n":899},{"slug":"bombard-self","label":"bombard-self","n":134},{"slug":"bombard","label":"bombard","n":115},{"slug":"burn-battle","label":"burn battle","n":13},{"slug":"removal-burn","label":"removal-burn","n":0}],"siblings":[]},"counterspell":{"slug":"counterspell","label":"counterspell","n":98,"parents":[{"slug":"blue-effect","label":"blue effect","n":0}],"children":[{"slug":"counterspell-with-set-mechanic","label":"counterspell with set mechanic","n":169},{"slug":"counterspell-soft","label":"counterspell-soft","n":138},{"slug":"counterspell-reusable","label":"counterspell-reusable","n":76},{"slug":"counterspell-ability","label":"counterspell-ability","n":51},{"slug":"counterspell-creature","label":"counterspell-creature","n":51},{"slug":"counterspell-automatic","label":"counterspell-automatic","n":38},{"slug":"counterspell-exile","label":"counterspell-exile","n":38},{"slug":"counterspell-noncreature","label":"counterspell-noncreature","n":35},{"slug":"counterspell-sacrifice","label":"counterspell-sacrifice","n":31},{"slug":"counterspell-instant","label":"counterspell-instant","n":30}],"siblings":[{"slug":"removal-bounce","label":"removal-bounce","n":346},{"slug":"loot","label":"loot","n":121},{"slug":"extra-turn","label":"extra turn","n":64},{"slug":"loot-to-library","label":"loot to library","n":10}]},"bounce":{"slug":"bounce","label":"bounce","n":6,"parents":[],"children":[{"slug":"removal-bounce","label":"removal-bounce","n":346},{"slug":"bounce-self","label":"bounce-self","n":183},{"slug":"alternate-cost-bounce","label":"alternate-cost-bounce","n":40},{"slug":"rescue","label":"rescue","n":4}],"siblings":[]},"pacifism":{"slug":"pacifism","label":"pacifism","n":96,"parents":[{"slug":"removal-creature","label":"removal-creature","n":1930}],"children":[],"siblings":[{"slug":"burn-creature","label":"burn creature","n":1047},{"slug":"removal-toughness","label":"removal-toughness","n":614},{"slug":"removal-nonland","label":"removal-nonland","n":402},{"slug":"removal-permanent","label":"removal-permanent","n":213},{"slug":"man-o-war","label":"man-o'-war","n":99},{"slug":"doom-blade","label":"doom blade","n":84},{"slug":"no-mercy","label":"no mercy","n":7},{"slug":"buttfight","label":"buttfight","n":4}]},"theft-creature":{"slug":"theft-creature","label":"theft-creature","n":239,"parents":[{"slug":"theft","label":"theft","n":19}],"children":[],"siblings":[{"slug":"theft-cast","label":"theft-cast","n":210},{"slug":"threaten","label":"threaten","n":82},{"slug":"theft-artifact","label":"theft-artifact","n":58},{"slug":"theft-mass","label":"theft-mass","n":51},{"slug":"reanimate-from-opponent","label":"reanimate-from-opponent","n":50},{"slug":"theft-permanent","label":"theft-permanent","n":36},{"slug":"theft-land","label":"theft-land","n":26},{"slug":"theft-nonland","label":"theft-nonland","n":22}]},"removal-artifact":{"slug":"removal-artifact","label":"removal-artifact","n":341,"parents":[{"slug":"removal","label":"removal","n":0}],"children":[{"slug":"removal-nonland","label":"removal-nonland","n":402},{"slug":"removal-permanent","label":"removal-permanent","n":213},{"slug":"disenchant-naturalize","label":"disenchant/naturalize","n":179},{"slug":"abrade","label":"abrade","n":44},{"slug":"removal-noncreature","label":"removal-noncreature","n":15},{"slug":"removal-nonenchantment","label":"removal-nonenchantment","n":3}],"siblings":[{"slug":"spot-removal","label":"spot removal","n":5529},{"slug":"removal-creature","label":"removal-creature","n":1930},{"slug":"repeatable-removal","label":"repeatable removal","n":1786},{"slug":"removal-destroy","label":"removal-destroy","n":1718},{"slug":"sweeper","label":"sweeper","n":741},{"slug":"multi-removal","label":"multi removal","n":680},{"slug":"removal-exile","label":"removal-exile","n":454},{"slug":"removal-nonland","label":"removal-nonland","n":402}]},"removal-enchantment":{"slug":"removal-enchantment","label":"removal-enchantment","n":224,"parents":[{"slug":"removal","label":"removal","n":0}],"children":[{"slug":"removal-nonland","label":"removal-nonland","n":402},{"slug":"removal-permanent","label":"removal-permanent","n":213},{"slug":"disenchant-naturalize","label":"disenchant/naturalize","n":179},{"slug":"removal-noncreature","label":"removal-noncreature","n":15}],"siblings":[{"slug":"spot-removal","label":"spot removal","n":5529},{"slug":"removal-creature","label":"removal-creature","n":1930},{"slug":"repeatable-removal","label":"repeatable removal","n":1786},{"slug":"removal-destroy","label":"removal-destroy","n":1718},{"slug":"sweeper","label":"sweeper","n":741},{"slug":"multi-removal","label":"multi removal","n":680},{"slug":"removal-exile","label":"removal-exile","n":454},{"slug":"removal-nonland","label":"removal-nonland","n":402}]},"removal-land":{"slug":"removal-land","label":"removal-land","n":301,"parents":[{"slug":"removal","label":"removal","n":0}],"children":[{"slug":"removal-permanent","label":"removal-permanent","n":213},{"slug":"removal-noncreature","label":"removal-noncreature","n":15},{"slug":"removal-nonenchantment","label":"removal-nonenchantment","n":3}],"siblings":[{"slug":"spot-removal","label":"spot removal","n":5529},{"slug":"removal-creature","label":"removal-creature","n":1930},{"slug":"repeatable-removal","label":"repeatable removal","n":1786},{"slug":"removal-destroy","label":"removal-destroy","n":1718},{"slug":"sweeper","label":"sweeper","n":741},{"slug":"multi-removal","label":"multi removal","n":680},{"slug":"removal-exile","label":"removal-exile","n":454},{"slug":"removal-nonland","label":"removal-nonland","n":402}]},"hate-graveyard":{"slug":"hate-graveyard","label":"hate-graveyard","n":291,"parents":[{"slug":"hate","label":"hate","n":0}],"children":[{"slug":"sweeper-graveyard","label":"sweeper-graveyard","n":83},{"slug":"graveyard-seal","label":"graveyard seal","n":55},{"slug":"single-minded-graveyard-hate","label":"single-minded graveyard hate","n":16}],"siblings":[{"slug":"hate-attacker","label":"hate-attacker","n":374},{"slug":"hate-blocker","label":"hate-blocker","n":367},{"slug":"hate-set-mechanic","label":"hate-set-mechanic","n":274},{"slug":"hate-artifact","label":"hate-artifact","n":198},{"slug":"hate-high-pt","label":"hate-high-pt","n":168},{"slug":"hate-tapped","label":"hate-tapped","n":156},{"slug":"hate-flying","label":"hate-flying","n":142},{"slug":"hate-regenerate","label":"hate-regenerate","n":141}]},"hate-discard":{"slug":"hate-discard","label":"hate-discard","n":138,"parents":[{"slug":"hate","label":"hate","n":0}],"children":[],"siblings":[{"slug":"hate-attacker","label":"hate-attacker","n":374},{"slug":"hate-blocker","label":"hate-blocker","n":367},{"slug":"hate-graveyard","label":"hate-graveyard","n":291},{"slug":"hate-set-mechanic","label":"hate-set-mechanic","n":274},{"slug":"hate-artifact","label":"hate-artifact","n":198},{"slug":"hate-high-pt","label":"hate-high-pt","n":168},{"slug":"hate-tapped","label":"hate-tapped","n":156},{"slug":"hate-flying","label":"hate-flying","n":142}]},"tax":{"slug":"tax","label":"tax","n":1,"parents":[],"children":[{"slug":"rhystic","label":"rhystic","n":269},{"slug":"toll","label":"toll","n":195},{"slug":"cast-tax","label":"cast tax","n":17}],"siblings":[]},"sacrifice-outlet-creature":{"slug":"sacrifice-outlet-creature","label":"sacrifice outlet-creature","n":898,"parents":[{"slug":"sacrifice-outlet","label":"sacrifice outlet","n":12}],"children":[{"slug":"sacrifice-outlet-universal","label":"sacrifice outlet-universal","n":53},{"slug":"fling","label":"fling","n":34},{"slug":"sacrifice-outlet-nonland","label":"sacrifice outlet-nonland","n":18},{"slug":"emerge-from-creature","label":"emerge-from-creature","n":14},{"slug":"gives-casualty","label":"gives casualty","n":4}],"siblings":[{"slug":"repeatable-sacrifice-outlet","label":"repeatable sacrifice outlet","n":599},{"slug":"sacrifice-outlet-artifact","label":"sacrifice outlet-artifact","n":294},{"slug":"sacrifice-outlet-land","label":"sacrifice outlet-land","n":240},{"slug":"bombard","label":"bombard","n":115},{"slug":"plunder","label":"plunder","n":81},{"slug":"sacrifice-outlet-enchantment","label":"sacrifice outlet-enchantment","n":62},{"slug":"sacrifice-outlet-universal","label":"sacrifice outlet-universal","n":53},{"slug":"sacrifice-outlet-token","label":"sacrifice outlet-token","n":46}]},"flicker":{"slug":"flicker","label":"flicker","n":1,"parents":[],"children":[{"slug":"flicker-creature","label":"flicker-creature","n":137},{"slug":"flicker-slow","label":"flicker-slow","n":110},{"slug":"flicker-self","label":"flicker-self","n":41},{"slug":"flicker-artifact","label":"flicker-artifact","n":16},{"slug":"flicker-land","label":"flicker-land","n":7},{"slug":"flicker-enchantment","label":"flicker-enchantment","n":3},{"slug":"flicker-planeswalker","label":"flicker-planeswalker","n":2},{"slug":"flicker-vehicle","label":"flicker-vehicle","n":1},{"slug":"flicker-nonenchantment","label":"flicker-nonenchantment","n":1}],"siblings":[]},"clone":{"slug":"clone","label":"clone","n":64,"parents":[{"slug":"copy","label":"copy","n":7}],"children":[{"slug":"clone-graveyard","label":"clone graveyard","n":7},{"slug":"clone-assassin","label":"clone assassin","n":2}],"siblings":[{"slug":"copy-creature","label":"copy-creature","n":364},{"slug":"copy-self","label":"copy-self","n":314},{"slug":"copy-instant","label":"copy-instant","n":161},{"slug":"copy-sorcery","label":"copy-sorcery","n":156},{"slug":"copy-spell","label":"copy-spell","n":155},{"slug":"shapesharing","label":"shapesharing","n":72},{"slug":"copy-artifact","label":"copy-artifact","n":71},{"slug":"copy-token","label":"copy-token","n":56}]},"lifegain":{"slug":"lifegain","label":"lifegain","n":893,"parents":[],"children":[{"slug":"repeatable-lifegain","label":"repeatable lifegain","n":1412},{"slug":"drain-life","label":"drain life","n":399},{"slug":"gives-lifelink","label":"gives lifelink","n":234},{"slug":"gains-lifelink","label":"gains lifelink","n":105},{"slug":"drain-creature","label":"drain creature","n":97},{"slug":"old-lifelink","label":"old lifelink","n":28},{"slug":"gives-lifelink-noncreature","label":"gives lifelink noncreature","n":9},{"slug":"gainland","label":"gainland","n":8}],"siblings":[]},"drain-life":{"slug":"drain-life","label":"drain life","n":399,"parents":[{"slug":"lifegain","label":"lifegain","n":893},{"slug":"inverted-effects","label":"inverted effects","n":71}],"children":[{"slug":"blood-artist-ability","label":"blood artist ability","n":41},{"slug":"gives-extort","label":"gives extort","n":1}],"siblings":[{"slug":"repeatable-lifegain","label":"repeatable lifegain","n":1412},{"slug":"gives-lifelink","label":"gives lifelink","n":234},{"slug":"gains-lifelink","label":"gains lifelink","n":105},{"slug":"drain-creature","label":"drain creature","n":97},{"slug":"old-lifelink","label":"old lifelink","n":28},{"slug":"drain-strength","label":"drain strength","n":27},{"slug":"gives-lifelink-noncreature","label":"gives lifelink noncreature","n":9},{"slug":"gainland","label":"gainland","n":8}]},"draw":{"slug":"draw","label":"draw","n":0,"parents":[{"slug":"card-advantage","label":"card advantage","n":57}],"children":[{"slug":"pure-draw","label":"pure draw","n":1280},{"slug":"burst-draw","label":"burst draw","n":655},{"slug":"curiosity","label":"curiosity","n":258},{"slug":"loot","label":"loot","n":121},{"slug":"rummage","label":"rummage","n":119},{"slug":"plunder","label":"plunder","n":81},{"slug":"enchantment-engine","label":"enchantment engine","n":21},{"slug":"brainstorm","label":"brainstorm","n":16},{"slug":"loot-to-library","label":"loot to library","n":10},{"slug":"rummage-to-library","label":"rummage to library","n":10}],"siblings":[{"slug":"repeatable-card-advantage","label":"repeatable card advantage","n":350},{"slug":"life-for-cards","label":"life for cards","n":299},{"slug":"tome","label":"tome","n":159},{"slug":"impulse","label":"impulse","n":66},{"slug":"consult","label":"consult","n":36},{"slug":"regrowth","label":"regrowth","n":36},{"slug":"impulsive-draw","label":"impulsive draw","n":31},{"slug":"land-or-hand","label":"land or hand","n":17}]},"cantrip":{"slug":"cantrip","label":"cantrip","n":688,"parents":[{"slug":"pure-draw","label":"pure draw","n":1280}],"children":[],"siblings":[{"slug":"repeatable-pure-draw","label":"repeatable pure draw","n":1408},{"slug":"delayed-cantrip","label":"delayed cantrip","n":59},{"slug":"opaline-effect","label":"opaline effect","n":18},{"slug":"drawlink","label":"drawlink","n":11}]},"loot":{"slug":"loot","label":"loot","n":121,"parents":[{"slug":"blue-effect","label":"blue effect","n":0},{"slug":"discard-outlet","label":"discard outlet","n":499},{"slug":"draw","label":"draw","n":0}],"children":[{"slug":"repeatable-loot","label":"repeatable loot","n":254},{"slug":"catalog","label":"catalog","n":51},{"slug":"sift","label":"sift","n":17},{"slug":"compulsive-research","label":"compulsive research","n":13},{"slug":"probe","label":"probe","n":7}],"siblings":[{"slug":"pure-draw","label":"pure draw","n":1280},{"slug":"burst-draw","label":"burst draw","n":655},{"slug":"removal-bounce","label":"removal-bounce","n":346},{"slug":"curiosity","label":"curiosity","n":258},{"slug":"rummage","label":"rummage","n":119},{"slug":"counterspell","label":"counterspell","n":98},{"slug":"plunder","label":"plunder","n":81},{"slug":"free-discard-outlet","label":"free discard outlet","n":69}]},"impulse":{"slug":"impulse","label":"impulse","n":66,"parents":[{"slug":"card-advantage","label":"card advantage","n":57}],"children":[{"slug":"repeatable-impulse","label":"repeatable impulse","n":173},{"slug":"impulse-creature","label":"impulse-creature","n":152},{"slug":"mulch","label":"mulch","n":120},{"slug":"impulse-land","label":"impulse-land","n":106},{"slug":"impulse-artifact","label":"impulse-artifact","n":44},{"slug":"impulse-permanent","label":"impulse-permanent","n":37},{"slug":"impulse-enchantment","label":"impulse-enchantment","n":25},{"slug":"impulse-cast","label":"impulse-cast","n":25},{"slug":"impulse-instant","label":"impulse-instant","n":22},{"slug":"impulse-sorcery","label":"impulse-sorcery","n":22}],"siblings":[{"slug":"repeatable-card-advantage","label":"repeatable card advantage","n":350},{"slug":"life-for-cards","label":"life for cards","n":299},{"slug":"tome","label":"tome","n":159},{"slug":"consult","label":"consult","n":36},{"slug":"regrowth","label":"regrowth","n":36},{"slug":"impulsive-draw","label":"impulsive draw","n":31},{"slug":"land-or-hand","label":"land or hand","n":17},{"slug":"impulsive-mill","label":"impulsive mill","n":5}]},"wheel":{"slug":"wheel","label":"wheel","n":1,"parents":[{"slug":"draw","label":"draw","n":0}],"children":[{"slug":"wheel-one-sided","label":"wheel-one-sided","n":107},{"slug":"miniwheel","label":"miniwheel","n":48},{"slug":"wheel-symmetrical","label":"wheel-symmetrical","n":42},{"slug":"whirlpool","label":"whirlpool","n":36}],"siblings":[{"slug":"pure-draw","label":"pure draw","n":1280},{"slug":"burst-draw","label":"burst draw","n":655},{"slug":"curiosity","label":"curiosity","n":258},{"slug":"loot","label":"loot","n":121},{"slug":"rummage","label":"rummage","n":119},{"slug":"plunder","label":"plunder","n":81},{"slug":"enchantment-engine","label":"enchantment engine","n":21},{"slug":"brainstorm","label":"brainstorm","n":16}]},"discard":{"slug":"discard","label":"discard","n":572,"parents":[{"slug":"hand-disruption","label":"hand disruption","n":15},{"slug":"black-effect","label":"black effect","n":0}],"children":[{"slug":"discard-symmetrical","label":"discard-symmetrical","n":29},{"slug":"torment","label":"torment","n":17}],"siblings":[{"slug":"life-for-cards","label":"life for cards","n":299},{"slug":"discard-with-set-s-mechanic","label":"discard with set's mechanic","n":204},{"slug":"thoughtseize","label":"thoughtseize","n":156},{"slug":"tutor-card","label":"tutor-card","n":112},{"slug":"discard-to-exile","label":"discard to exile","n":75},{"slug":"specter-ability","label":"specter ability","n":63},{"slug":"deal-with-the-devil","label":"deal with the devil","n":47},{"slug":"random-discard","label":"random discard","n":39}]},"mill":{"slug":"mill","label":"mill","n":0,"parents":[],"children":[{"slug":"mill-self","label":"mill-self","n":341},{"slug":"mill-opponent","label":"mill-opponent","n":196},{"slug":"mill-any","label":"mill-any","n":191},{"slug":"mill-exile","label":"mill-exile","n":122},{"slug":"grind","label":"grind","n":10}],"siblings":[]},"mill-self":{"slug":"mill-self","label":"mill-self","n":341,"parents":[{"slug":"mill","label":"mill","n":0}],"children":[{"slug":"surveil","label":"surveil","n":224},{"slug":"mill-any","label":"mill-any","n":191},{"slug":"mulch","label":"mulch","n":120},{"slug":"mill-each","label":"mill-each","n":61}],"siblings":[{"slug":"mill-opponent","label":"mill-opponent","n":196},{"slug":"mill-any","label":"mill-any","n":191},{"slug":"mill-exile","label":"mill-exile","n":122},{"slug":"grind","label":"grind","n":10}]},"tutor":{"slug":"tutor","label":"tutor","n":0,"parents":[],"children":[{"slug":"tutor-card","label":"tutor-card","n":112},{"slug":"tutor-creature","label":"tutor-creature","n":96},{"slug":"tutor-mv","label":"tutor-mv","n":90},{"slug":"tutors-by-name","label":"tutors by name","n":82},{"slug":"tutor-artifact","label":"tutor-artifact","n":47},{"slug":"tutor-instant","label":"tutor-instant","n":23},{"slug":"tutor-copy","label":"tutor-copy","n":18},{"slug":"tutor-from-opponent","label":"tutor-from-opponent","n":17},{"slug":"tutor-enchantment","label":"tutor-enchantment","n":16},{"slug":"tutor-sorcery","label":"tutor-sorcery","n":16}],"siblings":[]},"recursion":{"slug":"recursion","label":"recursion","n":0,"parents":[],"children":[{"slug":"gives-castable-from-graveyard","label":"gives castable from graveyard","n":116},{"slug":"copy-from-graveyard","label":"copy from graveyard","n":50},{"slug":"demilich-effect","label":"demilich effect","n":37},{"slug":"regrowth","label":"regrowth","n":36},{"slug":"impulsive-recursion","label":"impulsive recursion","n":21},{"slug":"grim-return","label":"grim return","n":15},{"slug":"recursion-instant","label":"recursion-instant","n":13},{"slug":"reanimate","label":"reanimate","n":11},{"slug":"recursion-sorcery","label":"recursion-sorcery","n":11},{"slug":"recursion-artifact","label":"recursion-artifact","n":2}],"siblings":[]},"reanimate":{"slug":"reanimate","label":"reanimate","n":11,"parents":[{"slug":"recursion","label":"recursion","n":0}],"children":[{"slug":"reanimate-creature","label":"reanimate-creature","n":559},{"slug":"reanimate-self","label":"reanimate-self","n":277},{"slug":"reanimate-cast","label":"reanimate-cast","n":151},{"slug":"reanimate-artifact","label":"reanimate-artifact","n":74},{"slug":"reanimate-permanent","label":"reanimate-permanent","n":62},{"slug":"reanimate-land","label":"reanimate-land","n":52},{"slug":"reanimate-from-opponent","label":"reanimate-from-opponent","n":50},{"slug":"reanimate-enchantment","label":"reanimate-enchantment","n":34},{"slug":"reanimate-nonland","label":"reanimate-nonland","n":25},{"slug":"reanimate-aura","label":"reanimate-aura","n":21}],"siblings":[{"slug":"gives-castable-from-graveyard","label":"gives castable from graveyard","n":116},{"slug":"copy-from-graveyard","label":"copy from graveyard","n":50},{"slug":"demilich-effect","label":"demilich effect","n":37},{"slug":"regrowth","label":"regrowth","n":36},{"slug":"impulsive-recursion","label":"impulsive recursion","n":21},{"slug":"grim-return","label":"grim return","n":15},{"slug":"recursion-instant","label":"recursion-instant","n":13},{"slug":"recursion-sorcery","label":"recursion-sorcery","n":11}]},"copy":{"slug":"copy","label":"copy","n":7,"parents":[],"children":[{"slug":"copy-creature","label":"copy-creature","n":364},{"slug":"copy-self","label":"copy-self","n":314},{"slug":"copy-instant","label":"copy-instant","n":161},{"slug":"copy-sorcery","label":"copy-sorcery","n":156},{"slug":"copy-spell","label":"copy-spell","n":155},{"slug":"shapesharing","label":"shapesharing","n":72},{"slug":"copy-artifact","label":"copy-artifact","n":71},{"slug":"clone","label":"clone","n":64},{"slug":"copy-token","label":"copy-token","n":56},{"slug":"copy-legendary","label":"copy-legendary","n":51}],"siblings":[]},"death-trigger":{"slug":"death-trigger","label":"death trigger","n":593,"parents":[{"slug":"triggered-ability","label":"triggered ability","n":7961}],"children":[{"slug":"death-trigger-self","label":"death trigger-self","n":712},{"slug":"death-trigger-opponent","label":"death trigger opponent","n":74},{"slug":"blood-artist-ability","label":"blood artist ability","n":41},{"slug":"hunger-trigger","label":"hunger trigger","n":10},{"slug":"gives-persist","label":"gives persist","n":7}],"siblings":[{"slug":"intervening-if-clause","label":"intervening if clause","n":2207},{"slug":"attack-trigger","label":"attack trigger","n":2077},{"slug":"delayed-trigger","label":"delayed trigger","n":1132},{"slug":"block-trigger","label":"block trigger","n":422},{"slug":"reflexive-trigger","label":"reflexive trigger","n":317},{"slug":"ward","label":"ward","n":168},{"slug":"cast-trigger","label":"cast trigger","n":148},{"slug":"trigger-from-graveyard","label":"trigger from graveyard","n":147}]},"cast-trigger":{"slug":"cast-trigger","label":"cast trigger","n":148,"parents":[{"slug":"triggered-ability","label":"triggered ability","n":7961}],"children":[{"slug":"cast-trigger-you","label":"cast trigger-you","n":1320},{"slug":"cast-trigger-self","label":"cast trigger-self","n":253},{"slug":"cast-trigger-other","label":"cast trigger-other","n":128},{"slug":"mana-gorger","label":"mana gorger","n":14}],"siblings":[{"slug":"intervening-if-clause","label":"intervening if clause","n":2207},{"slug":"attack-trigger","label":"attack trigger","n":2077},{"slug":"delayed-trigger","label":"delayed trigger","n":1132},{"slug":"death-trigger","label":"death trigger","n":593},{"slug":"block-trigger","label":"block trigger","n":422},{"slug":"reflexive-trigger","label":"reflexive trigger","n":317},{"slug":"ward","label":"ward","n":168},{"slug":"trigger-from-graveyard","label":"trigger from graveyard","n":147}]},"group-hug":{"slug":"group-hug","label":"group hug","n":190,"parents":[],"children":[{"slug":"selective-group-hug","label":"selective group hug","n":221},{"slug":"bribery","label":"bribery","n":32}],"siblings":[]},"monarch-matters":{"slug":"monarch-matters","label":"monarch matters","n":49,"parents":[],"children":[],"siblings":[]},"take-the-initiative":{"slug":"take-the-initiative","label":"take the initiative","n":23,"parents":[{"slug":"tutor-land-basic","label":"tutor-land-basic","n":357},{"slug":"tutor-to-hand","label":"tutor-to-hand","n":575},{"slug":"gives-pp-counters","label":"gives pp counters","n":1384},{"slug":"scry","label":"scry","n":286}],"children":[],"siblings":[{"slug":"gives-pp-counters-to-all","label":"gives pp counters to all","n":207},{"slug":"repeatable-scry","label":"repeatable scry","n":185},{"slug":"support","label":"support","n":64},{"slug":"pwdeck-tutor","label":"pwdeck-tutor","n":36},{"slug":"earthbend","label":"earthbend","n":36},{"slug":"tutor-land-basic-plains","label":"tutor-land-basic-plains","n":33},{"slug":"tutor-land-basic-forest","label":"tutor-land-basic-forest","n":27},{"slug":"tutor-land-basic-mountain","label":"tutor-land-basic-mountain","n":17}]},"the-ring-tempts-you":{"slug":"the-ring-tempts-you","label":"the ring tempts you","n":49,"parents":[{"slug":"gives-skulk","label":"gives skulk","n":9},{"slug":"legendify","label":"legendify","n":12}],"children":[],"siblings":[]},"extra-turn":{"slug":"extra-turn","label":"extra turn","n":64,"parents":[{"slug":"blue-effect","label":"blue effect","n":0}],"children":[],"siblings":[{"slug":"removal-bounce","label":"removal-bounce","n":346},{"slug":"loot","label":"loot","n":121},{"slug":"counterspell","label":"counterspell","n":98},{"slug":"loot-to-library","label":"loot to library","n":10}]},"poisonous":{"slug":"poisonous","label":"poisonous","n":131,"parents":[{"slug":"poison-mechanics","label":"poison mechanics","n":11}],"children":[],"siblings":[{"slug":"synergy-poison","label":"synergy-poison","n":42},{"slug":"poison-opponents","label":"poison opponents","n":21},{"slug":"gives-toxic","label":"gives toxic","n":9},{"slug":"gives-infect","label":"gives infect","n":8},{"slug":"gives-poisonous","label":"gives poisonous","n":6},{"slug":"gains-infect","label":"gains infect","n":4},{"slug":"gains-toxic","label":"gains toxic","n":2},{"slug":"removes-infect","label":"removes infect","n":1}]},"combat-trick":{"slug":"combat-trick","label":"combat trick","n":1104,"parents":[],"children":[{"slug":"giant-growth","label":"giant growth","n":169}],"siblings":[]},"protection":{"slug":"protection","label":"protection","n":0,"parents":[],"children":[{"slug":"protects-creature","label":"protects-creature","n":781},{"slug":"protects-all","label":"protects-all","n":293},{"slug":"gives-indestructible","label":"gives indestructible","n":287},{"slug":"gives-hexproof","label":"gives hexproof","n":168},{"slug":"gives-protection","label":"gives protection","n":127},{"slug":"protects-planeswalker","label":"protects-planeswalker","n":102},{"slug":"gives-ward","label":"gives ward","n":71},{"slug":"protects-artifact","label":"protects-artifact","n":65},{"slug":"gains-hexproof","label":"gains hexproof","n":63},{"slug":"gives-shroud","label":"gives shroud","n":49}],"siblings":[]},"phase-manipulation":{"slug":"phase-manipulation","label":"phase manipulation","n":15,"parents":[],"children":[{"slug":"extra-combat-phase","label":"extra combat phase","n":54},{"slug":"skip-draw-step","label":"skip draw step","n":20},{"slug":"skip-untap-step","label":"skip untap step","n":11},{"slug":"extra-upkeep","label":"extra upkeep","n":7},{"slug":"extra-draw-step","label":"extra draw step","n":4}],"siblings":[]}};

const KEYWORD_BUCKETS = {
  "Evasion": [
    "Flying","Menace","Shadow","Skulk","Fear","Intimidate","Horsemanship",
    "Landwalk","Forestwalk","Islandwalk","Mountainwalk","Swampwalk","Plainswalk",
    "Desertwalk","Nonbasic landwalk","Legendary landwalk"
  ],
  "Combat": [
    "Trample","Haste","Vigilance","Deathtouch","First strike","Double strike",
    "Defender","Reach","Prowess","Flanking","Bushido","Exalted","Battle Cry","Melee",
    "Enlist","Provoke","Banding","Frenzy","Afflict","Rampage",
    "Power-up","Riot","Boast","Dethrone","Max speed",
    "Ninjutsu","Commander ninjutsu","Dash","Blitz","Prowl","Sneak","Web-slinging",
    "Awaken","Soulbond","Tribute","Mobilize","Exhaust"
  ],
  "Counters": [
    "Proliferate","Increment","Teamwork","Graft","Evolve","Bloodthirst","Renown",
    "Ravenous","Outlast","Backup","Fabricate","Mentor","Training","Unleash","Wither",
    "Amplify","Level Up","Reinforce","Sunburst","Modular"
  ],
  "Protection": [
    "Hexproof","Hexproof from","Shroud","Ward","Indestructible","Protection",
    "Umbra armor","Absorb"
  ],
  "Timing": [
    "Flash","Split second","Phasing","Vanishing","Fading","Suspend","Rebound",
    "Foretell","Plot","Warp","Hideaway","Daybound","Nightbound","Impending",
    "Morph","Megamorph","Disguise","Miracle","Fuse","Entwine","Splice","Read Ahead"
  ],
  "Ramp": [
    "Affinity","Convoke","Delve","Improvise","Kicker","Multikicker","Emerge","Evoke",
    "Offering","Prototype","Compleated","Assist","Surge","Spectacle","Escalate",
    "Cumulative upkeep","Echo","Undaunted","Gift","Freerunning","Spree","Tiered",
    "Cleave","Firebending"
  ],
  "Attachments": [
    "Equip","Enchant","Fortify","Reconfigure","Bestow","Aura Swap",
    "Living weapon","Living metal","For Mirrodin!",
    "Crew","Saddle","Station",
    "More Than Meets the Eye","Job select","Craft"
  ],
  "Removal": [
    "Overload","Annihilator"
  ],
  "Card Draw": [
    "Cycling","Typecycling","Landcycling","Basic landcycling","Plainscycling",
    "Islandcycling","Swampcycling","Mountaincycling","Forestcycling","Wizardcycling",
    "Slivercycling","Halflingcycling","Buyback","Madness","Forecast",
    "Cipher","Solved"
  ],
  "Tutors": [
    "Transmute","Transfigure"
  ],
  "Graveyard": [
    "Dredge","Exploit","Bargain","Casualty","Devour","Ingest","Decayed"
  ],
  "Recursion": [
    "Flashback","Jump-start","Retrace","Recover","Scavenge","Embalm","Eternalize",
    "Unearth","Escape","Disturb","Aftermath","Harmonize","Mayhem","Soulshift",
    "Encore","Persist","Undying","Afterlife","Haunt","Champion"
  ],
  "Life": [
    "Lifelink","Extort"
  ],
  "Cast": [
    "Cascade","Ripple","Paradigm"
  ],
  "Copy": [
    "Replicate","Demonstrate","Conspire","Offspring","Myriad","Squad"
  ],
  "Thresholds": [
    "Ascend","Storied","Threshold","Delirium","Metalcraft","Descend",
    "Fathomless descent","Spell mastery","Domain","Converge","Chroma",
    "Hellbent","Ferocious","Formidable","Coven","Corrupted","Celebration",
    "Raid","Battalion","Pack tactics","Morbid","Undergrowth","Fateful hour"
  ],
  "Commander": [
    "Partner","Partner with","Friends forever","Doctor's companion","Choose a background",
    "Companion"
  ],
  "Finishers": [
    "Storm","Gravestorm","Epic","Infect","Toxic","Poisonous"
  ],
};

const GROUP_ORDER = [
  "Ability words",
  "Attachments",
  "Card Draw",
  "Cast",
  "Combat",
  "Commander",
  "Copy",
  "Counters",
  "Evasion",
  "Finishers",
  "Graveyard",
  "Life",
  "Politics",
  "Protection",
  "Ramp",
  "Recursion",
  "Removal",
  "Thresholds",
  "Timing",
  "Tutors",
];

function titleWords(name) {
  return String(name).replace(/[A-Za-z][A-Za-z']*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

let printingsRequest = 0;

function syncModalLock() {
  const printingsOpen = !printingsModal.hasAttribute("hidden");
  const imageOpen = !imageModal.hasAttribute("hidden");
  document.documentElement.classList.toggle("modal-open", printingsOpen || imageOpen);
  document.body.classList.toggle("modal-open", printingsOpen || imageOpen);
}

function closePrintings() {
  printingsRequest += 1;
  printingsModal.setAttribute("hidden", "");
  printingsList.innerHTML = "";
  printingsStatus.textContent = "";
  syncModalLock();
}

function closeImageModal() {
  imageModal.setAttribute("hidden", "");
  imageModalImage.removeAttribute("src");
  syncModalLock();
}

function showImageModal(src, name) {
  imageModalTitle.textContent = name || "Card image";
  imageModalImage.src = src;
  imageModalImage.alt = name ? name + " full-size card image" : "Full-size card image";
  imageModal.removeAttribute("hidden");
  syncModalLock();
}

function printingPrice(card) {
  return priceFromObj(card.prices);
}

function renderPrintings(cards) {
  printingsList.innerHTML = "";
  cards.forEach((card) => {
    const row = document.createElement("article");
    row.className = "printing-row";
    const imageUris = card.image_uris || card.card_faces?.[0]?.image_uris || {};
    const image = imageUris.small;
    const fullImage = imageUris.normal || imageUris.large || imageUris.png || image;
    if (image) {
      const imageButton = document.createElement("button");
      imageButton.type = "button";
      imageButton.className = "printing-image-button";
      imageButton.setAttribute("aria-label", "View full-size image of " + (card.name || "card"));
      const img = document.createElement("img");
      img.src = image;
      img.alt = "";
      img.loading = "lazy";
      imageButton.appendChild(img);
      imageButton.addEventListener("click", () => showImageModal(fullImage, card.name));
      row.appendChild(imageButton);
    }
    const details = document.createElement("div");
    details.className = "printing-details";
    const name = document.createElement("strong");
    name.textContent = card.set_name || card.set || "Unknown set";
    const meta = document.createElement("span");
    meta.textContent = [
      card.released_at || "Release date unavailable",
      card.collector_number ? "#" + card.collector_number : "",
      card.rarity || "",
    ].filter(Boolean).join(" · ");
    const price = document.createElement("span");
    const value = printingPrice(card);
    price.textContent = value == null ? "—" : formatPrice(value);
    price.className = "printing-price";
    details.append(name, meta, price);
    if (card.scryfall_uri) {
      const link = document.createElement("a");
      link.href = card.scryfall_uri;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Open in Scryfall";
      details.appendChild(link);
    }
    row.appendChild(details);
    printingsList.appendChild(row);
  });
  }

async function showPrintings(card) {
  const request = ++printingsRequest;
  const oracleId = card.oracle_id;
  if (!oracleId) {
    printingsStatus.textContent = "Printings are unavailable for this card.";
    printingsModal.removeAttribute("hidden");
    return;
  }
  printingsTitle.textContent = (card.name || "Card") + " — Printings";
  printingsList.innerHTML = "";
  printingsStatus.textContent = "Loading printings…";
  printingsCard.scrollTop = 0;
  printingsModal.removeAttribute("hidden");
  syncModalLock();
  try {
    let url = null;
    const cards = [];
    let page = await scryfall.searchPrints("oracleid:" + oracleId);
    cards.push(...page.data);
    url = page.has_more ? page.next_page : null;
    while (url) {
      page = await scryfall.searchPage(url);
      cards.push(...page.data);
      url = page.has_more ? page.next_page : null;
    }
    if (request !== printingsRequest) return;
    renderPrintings(cards);
    printingsStatus.textContent = cards.length + " printing" + (cards.length === 1 ? "" : "s");
  } catch (error) {
    if (request !== printingsRequest) return;
    printingsStatus.textContent = error.message || "Unable to load printings.";
  }
}

const KEYWORD_CATEGORY = {};
Object.entries(KEYWORD_BUCKETS).forEach(([label, names]) => {
  names.forEach((name) => { KEYWORD_CATEGORY[name.toLowerCase()] = label; });
});

function categorizeKeyword(name) {
  const key = String(name).toLowerCase();
  if (KEYWORD_CATEGORY[key]) return KEYWORD_CATEGORY[key];
  if (key.includes("cycling")) return "Card Draw";
  if (key.includes("transmute") || key.includes("tutor")) return "Tutors";
  if (key.includes("overload") || key.includes("sweeper") || key.includes("wrath")) return "Removal";
  if (key.includes("affinity") || key.includes("convoke") || key.includes("delve") || key.includes("kicker")) return "Ramp";
  if (key.includes("walk") || key.includes("flying") || key.includes("menace") || key.includes("skulk")) return "Evasion";
  if (key.includes("hexproof") || key.includes("protection") || key.includes("ward") || key.includes("shroud")) return "Protection";
  if (key.includes("flash") || key.includes("morph") || key.includes("bound") || key.includes("suspend") || key.includes("foretell") || key.includes("warp")) return "Timing";
  if (key.includes("partner") || key.includes("companion") || key.includes("background") || key.includes("agenda")) return "Commander";
  if (key.includes("equip") || key.includes("enchant") || key.includes("bestow") || key.includes("fortify")) return "Attachments";
  if (key.includes("storm") || key.includes("epic")) return "Finishers";
  if (key.includes("cascade") || key.includes("ripple") || key.includes("paradigm")) return "Cast";
  if (key.includes("replicate") || key.includes("demonstrate") || key.includes("conspire")) return "Copy";
  if (key.includes("threshold") || key.includes("delirium") || key.includes("ascend") || key.includes("storied") || key.includes("metalcraft") || key.includes("descend")) return "Thresholds";
  if (key.includes("ninjutsu") || key.includes("trample") || key.includes("haste") || key.includes("reach") || key.includes("firebend")) return "Combat";
  if (key.includes("infect") || key.includes("toxic") || key.includes("poison")) return "Finishers";
  if (key.includes("proliferate") || key.includes("increment") || key.includes("graft") || key.includes("evolve") || key.includes("adapt") || key.includes("modular") || key.includes("mentor")) return "Counters";
  if (key.includes("crew") || key.includes("saddle") || key.includes("station") || key.includes("mobilize")) return "Combat";
  if (key.includes("encore") || key.includes("flashback") || key.includes("unearth") || key.includes("escape") || key.includes("persist") || key.includes("undying") || key.includes("aftermath")) return "Recursion";
  if (key.includes("dredge")) return "Graveyard";
  if (key.includes("extort") || key.includes("lifelink") || key.includes("lifegain")) return "Life";
  if (key.includes("exploit") || key.includes("devour") || key.includes("casualty") || key.includes("bargain")) return "Graveyard";
  return "Ability words";
}

function buildKeywordGroups() {
  const groups = GROUP_ORDER.map((label) => ({ label, items: [] }));
  const byLabel = Object.fromEntries(groups.map((g) => [g.label, g]));
  Object.entries(KEYWORD_BUCKETS).forEach(([label, names]) => {
    names.forEach((name) => {
      byLabel[label].items.push([name, kwQuery(name)]);
    });
  });
  Object.entries(ROLE_ITEMS).forEach(([label, items]) => {
    if (!byLabel[label]) return;
    byLabel[label].items = items.concat(byLabel[label].items);
  });
  byLabel["Ability words"].items = [
    ["Landfall","kw:landfall"],["Magecraft","kw:magecraft"],["Constellation","kw:constellation"],
    ["Revolt","kw:revolt"],["Eminence","kw:eminence"],
    ["Alliance","kw:alliance"],["Valiant","kw:valiant"],["Enrage","kw:enrage"],
    ["Changeling","kw:changeling"],["Devoid","kw:devoid"],["Specialize","kw:specialize"],
    ["Visit","kw:visit"],["Space Sculptor",'kw:"space sculptor"'],["Mutate","kw:mutate"],
  ];
  groups.forEach((group) => group.items.sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: "base" })));
  return groups;
}

const KEYWORD_GROUPS = buildKeywordGroups();

const state = createAppState();
const nextTreeId = createTreeIdFactory();

const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const resultsEl = $("results");
const moreBtn = $("moreBtn");
const queryPreview = $("queryPreview");
const scryfall = createScryfallClient();
const printingsModal = $("printingsModal");
const printingsCard = printingsModal.querySelector(".printings-card");
const printingsList = $("printingsList");
const printingsStatus = $("printingsStatus");
const printingsTitle = $("printingsTitle");
const imageModal = $("imageModal");
const imageModalImage = $("imageModalImage");
const imageModalTitle = $("imageModalTitle");
printingsModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-printings]")) closePrintings();
});
$("printingsClose").addEventListener("click", closePrintings);
imageModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-image]")) closeImageModal();
});
$("imageModalClose").addEventListener("click", closeImageModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !imageModal.hasAttribute("hidden")) {
    closeImageModal();
    return;
  }
  if (event.key === "Escape" && !printingsModal.hasAttribute("hidden")) closePrintings();
});
queryPreview.addEventListener("click", async () => {
  const q = buildQuery();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(q);
    else {
      const ta = document.createElement("textarea");
      ta.value = q;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      if (!document.execCommand("copy")) throw new Error("Clipboard copy was rejected.");
      ta.remove();
    }
    queryPreview.classList.add("copied");
    queryPreview.textContent = "Copied";
    setTimeout(() => {
      queryPreview.classList.remove("copied");
      queryPreview.textContent = buildQuery();
    }, 900);
  } catch (error) {
    console.warn("Unable to copy query.", error);
    queryPreview.classList.remove("copied");
    queryPreview.textContent = "Copy failed";
    setTimeout(() => {
      queryPreview.textContent = buildQuery();
    }, 1200);
  }
});
queryPreview.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    queryPreview.click();
  }
});

function selectedColors() {
  return COLORS.filter((c) => state.colors.has(c));
}

const MANA_RGB = {
  W: [248, 246, 216],
  U: [100, 167, 232],
  B: [138, 124, 168],
  R: [224, 106, 85],
  G: [92, 175, 110],
  C: [201, 196, 184],
};

// These are UI colors, not literal mana-symbol colors. They stay vivid on
// dark surfaces without turning white or colorless identities yellow.
const THEME_RGB = {
  W: [206, 183, 132],
  U: [74, 169, 207],
  B: [145, 113, 191],
  R: [218, 103, 82],
  G: [99, 180, 112],
  C: [137, 157, 180],
};

function hexFromRgb(rgb) {
  return "#" + rgb.map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("");
}

function applyThemeRgb(rgb) {
  const root = document.documentElement;
  const a = hexFromRgb(rgb);
  root.style.setProperty("--accent", a);
  root.style.setProperty("--accent-2", a);
  root.style.setProperty("--accent-glow", "color-mix(in srgb, " + a + " 42%, transparent)");
  root.style.setProperty("--accent-soft", "color-mix(in srgb, " + a + " 18%, #1b212b)");
  root.style.setProperty("--accent-wash", "color-mix(in srgb, " + a + " 10%, transparent)");
  root.style.setProperty("--accent-border", "color-mix(in srgb, " + a + " 58%, #526075)");
  root.style.setProperty("--accent-light", "color-mix(in srgb, " + a + " 58%, white)");
  root.style.setProperty("--accent-deep", "color-mix(in srgb, " + a + " 58%, #18212d)");
  root.style.setProperty("--bg", "color-mix(in srgb, " + a + " 5%, #080a0e)");
  root.style.setProperty("--panel", "color-mix(in srgb, " + a + " 7%, #11151c)");
  root.style.setProperty("--raised", "color-mix(in srgb, " + a + " 9%, #181e28)");
  root.style.setProperty("--line", "color-mix(in srgb, " + a + " 14%, #2b3443)");
}

function themeFromColors() {
  const picks = ALL_COLORS.filter((c) => state.colors.has(c));
  if (!picks.length) {
    applyThemeRgb(THEME_RGB.C);
    return;
  }
  const rgbs = picks.map((c) => THEME_RGB[c]);
  const avg = [0, 1, 2].map((i) => Math.round(rgbs.reduce((s, r) => s + r[i], 0) / rgbs.length));
  applyThemeRgb(avg);
}

function walkTree(node, fn, parent) {
  fn(node, parent);
  if (node.kind === "group") node.children.forEach((ch) => walkTree(ch, fn, node));
}
function treeLeaves() {
  const out = [];
  walkTree(state.tree, (n) => { if (n.kind === "leaf") out.push(n); });
  return out;
}
function findLeafByQuery(query) {
  return treeLeaves().find((n) => n.query === query) || null;
}
function findNode(id, node) {
  const root = node || state.tree;
  if (root.id === id) return root;
  if (root.kind !== "group") return null;
  for (const ch of root.children) {
    const hit = findNode(id, ch);
    if (hit) return hit;
  }
  return null;
}
function parentOf(id, node) {
  const root = node || state.tree;
  if (root.kind !== "group") return null;
  if (root.children.some((ch) => ch.id === id)) return root;
  for (const ch of root.children) {
    const hit = parentOf(id, ch);
    if (hit) return hit;
  }
  return null;
}
function englishNode(node) {
  if (!node) return "";
  if (node.kind === "leaf") return (node.not ? "not " : "") + node.label;
  const bits = (node.children || []).map(englishNode).filter(Boolean);
  if (!bits.length) return "";
  if (bits.length === 1) return node.not ? "not " + bits[0] : bits[0];
  if (!node.op) return node.not ? "not (" + bits.join(" · ") + ")" : bits.join(" · ");
  const join = node.op === "or" ? " or " : " and ";
  let inner = bits.join(join);
  if (node.id !== "root") inner = "(" + inner + ")";
  return node.not ? "not " + inner : inner;
}
function expressionIsSetup() {
  return state.tree.children.length > 0;
}

function partsEnglish() {
  const labels = state.parts.map((p) => p.label).filter(Boolean);
  if (!labels.length) return "";
  if (labels.length === 1) return labels[0];
  return labels.join(state.kwMode === "or" ? " or " : " and ");
}

function buildQuery() {
  const rarities = [...document.querySelectorAll("#rarityQuery [data-rarity].on")].map(
    (button) => button.dataset.rarity
  );
  return compileQuery({
    colors: state.colors,
    idMode: state.idMode,
    cmcMin: state.cmcMin,
    cmcMax: state.cmcMax,
    parts: state.parts,
    tree: state.tree,
    kwMode: state.kwMode,
    oracle: $("oracleQuery")?.value || "",
    subtype: $("subtypeQuery")?.value || "",
    set: $("setQuery")?.value || "",
    rarity: rarities,
    yearFrom: $("yearFrom")?.value || "",
    yearTo: $("yearTo")?.value || ""
  });
}

function identityClause() { return compileIdentityClause(state.colors, state.idMode); }
function cmcIsAny() { return isCmcAny(state.cmcMin, state.cmcMax); }
function cmcClause() { return compileCmcClause(state.cmcMin, state.cmcMax); }

function renderCmc() {
  const any = cmcIsAny();
  const label = any ? "Any" : state.cmcMin === state.cmcMax
    ? String(state.cmcMin)
    : state.cmcMin + "–" + state.cmcMax;
  const valueEl = $("cmcValue");
  if (valueEl) valueEl.textContent = label;
  const deskValueEl = $("cmcDeskValue");
  if (deskValueEl) deskValueEl.textContent = any ? "Any mana value" : "Mana value " + label;
  const deskHintEl = $("cmcDeskHint");
  if (deskHintEl) {
    deskHintEl.textContent = any
      ? "Pick a mana value to begin."
      : state.cmcMin === state.cmcMax
        ? "Pick another value to create a range."
        : "Range selected · click either endpoint to adjust.";
  }
  const pad = $("cmcPad");
  if (pad) {
    pad.setAttribute("aria-valuenow", String(state.cmcMin));
    pad.setAttribute("aria-valuetext", label);
  }
  $("cmcAny").classList.toggle("on", !any);
  $("cmcAny").disabled = any;
  const win = $("cmcWindow");
  if (win && pad) {
    const rail = pad.querySelector(".cmc-rail");
    const span = CMC_MAX || 1;
    const railW = rail.clientWidth || Math.max(1, pad.clientWidth - 28);
    const leftPad = rail.offsetLeft || 14;
    const x0 = leftPad + (state.cmcMin / span) * railW;
    const x1 = leftPad + (state.cmcMax / span) * railW;
    const windowLeft = Math.max(8, x0 - 10);
    const windowRight = Math.min(pad.clientWidth - 8, x1 + 10);
    win.style.left = windowLeft + "px";
    win.style.width = Math.max(28, windowRight - windowLeft) + "px";
  }
  const scale = $("cmcScale");
  if (scale) {
    if (!scale.dataset.ready) {
      scale.innerHTML = "";
      for (let n = 0; n <= CMC_MAX; n++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cmc-tick";
        btn.dataset.n = String(n);
        btn.textContent = String(n);
        btn.addEventListener("click", () => pickCmcTick(n));
        btn.addEventListener("pointerenter", (e) => {
          if (e.buttons && cmcTickDrag.from != null) {
            applyCmcWindow(cmcTickDrag.from, n);
          }
        });
        btn.addEventListener("pointerdown", () => { cmcTickDrag.from = n; });
        scale.appendChild(btn);
      }
      scale.dataset.ready = "1";
    }
    scale.querySelectorAll(".cmc-tick").forEach((btn) => {
      const n = Number(btn.dataset.n);
      btn.classList.toggle("on", !any && (n === state.cmcMin || n === state.cmcMax));
      btn.classList.toggle("span", !any && n > state.cmcMin && n < state.cmcMax);
    });
  }
}

const cmcTickDrag = { from: null };
window.addEventListener("pointerup", () => { cmcTickDrag.from = null; });

function pickCmcTick(n) {
  if (cmcIsAny()) {
    applyCmcWindow(n, n);
    return;
  }
  if (state.cmcMin === state.cmcMax) {
    if (n === state.cmcMin) applyCmcWindow(0, CMC_MAX);
    else applyCmcWindow(Math.min(n, state.cmcMin), Math.max(n, state.cmcMax));
    return;
  }
  applyCmcWindow(n, n);
}

function pruneEmptyGroups() {
  if (state.focusId !== "root" && !findNode(state.focusId)) state.focusId = "root";
}
function updatePreview() {
  pruneEmptyGroups();
  queryPreview.textContent = buildQuery();
  renderBuilder();
  paintTypePalette();
  renderLineage();
}

document.querySelectorAll("#colors .mana").forEach((btn) => {
  btn.addEventListener("click", () => {
    const c = btn.dataset.c;
    if (state.colors.has(c)) state.colors.delete(c);
    else state.colors.add(c);
    if (c === "C" && state.colors.has("C")) {
      selectedColors().forEach((x) => state.colors.delete(x));
    } else if (c !== "C" && state.colors.has("C") && selectedColors().length) {
      state.colors.delete("C");
    }
    document.querySelectorAll("#colors .mana").forEach((b) => {
      b.classList.toggle("on", state.colors.has(b.dataset.c));
      b.setAttribute("aria-pressed", String(state.colors.has(b.dataset.c)));
    });
    themeFromColors();
    updatePreview();
  });
});

document.querySelectorAll("#types .chip").forEach((btn) => {
  btn.dataset.label = btn.dataset.label || btn.textContent;
  btn.addEventListener("click", () => {
    togglePaletteLeaf({ label: btn.dataset.label, query: typeQuery(btn.dataset.t), source: "type" });
  });
});
document.querySelectorAll("#isFlags .chip").forEach((btn) => {
  btn.dataset.label = btn.dataset.label || btn.textContent;
  btn.addEventListener("click", () => {
    togglePaletteLeaf({ label: btn.dataset.label, query: isQuery(btn.dataset.is), source: "type" });
  });
});
document.querySelectorAll("#layouts .chip").forEach((btn) => {
  btn.dataset.label = btn.dataset.label || btn.textContent;
  btn.addEventListener("click", () => {
    togglePaletteLeaf({ label: btn.dataset.label, query: layoutQuery(btn.dataset.layout), source: "type" });
  });
});

function paintChipQuery(btn, query) {
  const used = !!(findLeafByQuery(query) || state.parts.some((p) => p.query === query));
  const base = btn.dataset.label || btn.textContent.replace(/^−/, "");
  btn.textContent = base;
  btn.classList.toggle("on", used);
  btn.classList.toggle("exclude", false);
  btn.setAttribute("aria-pressed", used ? "true" : "false");
}
function paintTypePalette() {
  document.querySelectorAll("#types .chip").forEach((btn) => paintChipQuery(btn, typeQuery(btn.dataset.t)));
  document.querySelectorAll("#isFlags .chip").forEach((btn) => paintChipQuery(btn, isQuery(btn.dataset.is)));
  document.querySelectorAll("#layouts .chip").forEach((btn) => paintChipQuery(btn, layoutQuery(btn.dataset.layout)));
}

function otagSlug(query) {
  const m = String(query || "").trim().match(/^otag:"?([^"]+)"?$/i);
  return m ? m[1].toLowerCase() : null;
}
function tagTitle(slug) {
  const g = TAG_GRAPH[slug];
  if (g && g.label) return g.label;
  return String(slug || "").replace(/-/g, " ");
}
function selectedOtagTags() {
  const seen = new Set();
  const out = [];
  function consider(query, label) {
    const slug = otagSlug(query);
    if (!slug || !TAG_GRAPH[slug] || seen.has(slug)) return;
    seen.add(slug);
    out.push({ slug, label: label || tagTitle(slug), query: "otag:" + slug });
  }
  state.parts.forEach((p) => consider(p.query, p.label));
  treeLeaves().forEach((n) => consider(n.query, n.label));
  return out;
}
function ensurePart(label, query, source) {
  if (!state.parts.some((p) => p.query === query)) {
    state.parts.push({ id: nextTreeId(), label, query, source: source || "role" });
  }
}
function ensureExprLeaf(label, query, source, fromSlug) {
  const box = focusedContainer();
  if (box.children.some((ch) => ch.kind === "leaf" && ch.query === query)) return;
  box.children.push({
    id: nextTreeId(),
    kind: "leaf",
    label,
    query,
    source: source || "role",
    fromSlug: fromSlug || null,
    not: false
  });
}
function removeLineageFromTree(fromSlug) {
  if (!fromSlug) return;
  const ids = [];
  walkTree(state.tree, (n, parent) => {
    if (parent && n.kind === "leaf" && n.fromSlug === fromSlug) ids.push(n.id);
  });
  ids.forEach((id) => {
    const parent = parentOf(id);
    if (parent) parent.children = parent.children.filter((ch) => ch.id !== id);
  });
}
function addTagToExpression(fromSlug, slug) {
  const q = "otag:" + slug;
  ensureExprLeaf(tagTitle(slug), q, "role", fromSlug);
  state.lineageSlug = slug;
  if (!state.lineageOpen) state.lineageOpen = {};
  state.lineageOpen[fromSlug] = state.lineageOpen[fromSlug] || false;
  state.lineageOpen[slug] = state.lineageOpen[slug] || false;
  renderKeywords();
  updatePreview();
}
function renderLineage() {
  const el = $("tagLineage");
  if (!el) return;
  const tags = selectedOtagTags();
  if (!tags.length) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  el.innerHTML = "";
  if (!state.lineageOpen) state.lineageOpen = {};
  tags.forEach((item) => {
    const tag = TAG_GRAPH[item.slug];
    const hasRelated = (tag.parents && tag.parents.length) || (tag.children && tag.children.length) || (tag.siblings && tag.siblings.length);
    if (!hasRelated) return;
    const box = document.createElement("details");
    box.className = "tag-box";
    const open = !!state.lineageOpen[item.slug];
    box.open = !!open;
    box.addEventListener("toggle", () => {
      state.lineageOpen[item.slug] = box.open;
    });
    const sum = document.createElement("summary");
    sum.textContent = item.label;
    box.appendChild(sum);
    const body = document.createElement("div");
    body.className = "tag-box-body";
    if (tag.parents && tag.parents.length) {
      const row = document.createElement("div");
      row.appendChild(document.createTextNode("In "));
      tag.parents.forEach((p) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = tagTitle(p.slug);
        btn.title = "Add otag:" + p.slug + " to the expression";
        btn.addEventListener("click", () => addTagToExpression(item.slug, p.slug));
        row.appendChild(btn);
      });
      body.appendChild(row);
    }
    const related = tag.children && tag.children.length ? tag.children : (tag.siblings || []);
    const relatedLabel = tag.children && tag.children.length ? "Includes " : "Siblings ";
    if (related.length) {
      const row = document.createElement("div");
      row.appendChild(document.createTextNode(relatedLabel));
      related.forEach((c) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = tagTitle(c.slug);
        btn.title = "Add otag:" + c.slug + " to the expression";
        btn.addEventListener("click", () => addTagToExpression(item.slug, c.slug));
        row.appendChild(btn);
      });
      body.appendChild(row);
    }
    box.appendChild(body);
    el.appendChild(box);
  });
  el.hidden = !el.children.length;
}
function wrapRootWithAndLeaf(leaf) {
  const kids = state.tree.children;
  const alreadyBoxed = kids.length === 1 && kids[0].kind === "group";
  if (alreadyBoxed || state.tree.op === "and") {
    state.tree.op = "and";
    state.tree.children.push(leaf);
    state.focusId = "root";
    return;
  }
  const inner = {
    id: nextTreeId(),
    kind: "group",
    op: state.tree.op,
    not: state.tree.not,
    children: kids
  };
  state.tree.op = "and";
  state.tree.not = false;
  state.tree.children = [leaf, inner];
  state.focusId = "root";
}
function removeQueryFromTree(query) {
  walkTree(state.tree, (n, parent) => {
    if (!parent || n.kind !== "leaf" || n.query !== query) return;
    parent.children = parent.children.filter((ch) => ch.id !== n.id);
  });
}
function togglePaletteLeaf({ label, query, source }) {
  const idx = state.parts.findIndex((p) => p.query === query);
  if (idx >= 0) {
    state.parts.splice(idx, 1);
  } else {
    state.parts.push({ id: nextTreeId(), label, query, source });
    if (source === "type" && expressionIsSetup() && !treeLeaves().some((n) => n.query === query)) {
      wrapRootWithAndLeaf({
        id: nextTreeId(),
        kind: "leaf",
        label,
        query,
        source,
        not: false
      });
    }
  }
  const slug = otagSlug(query);
  state.lineageSlug = slug || state.lineageSlug;
  if (slug) {
    if (!state.lineageOpen) state.lineageOpen = {};
    if (state.lineageOpen[slug] == null) state.lineageOpen[slug] = false;
  }
  renderKeywords();
  updatePreview();
}

function selectedInGroup(group) {
  const queries = new Set([...state.parts.map((p) => p.query), ...treeLeaves().map((n) => n.query)]);
  return group.items.filter(([, q]) => queries.has(q)).length;
}

function tagFamilyBits(slug) {
  const g = TAG_GRAPH[slug];
  const bits = [slug];
  if (!g) return bits;
  bits.push(g.slug, g.label);
  (g.parents || []).forEach((x) => bits.push(x.slug, x.label));
  (g.children || []).forEach((x) => bits.push(x.slug, x.label));
  (g.siblings || []).forEach((x) => bits.push(x.slug, x.label));
  return bits.filter(Boolean);
}
function matchingWhy(name, query, needle) {
  if (!needle) return "";
  if (name.toLowerCase().includes(needle)) return "";
  if (String(query).toLowerCase().includes(needle)) return query;
  const slug = otagSlug(query);
  const bits = tagFamilyBits(slug);
  const hit = bits.find((b) => String(b).toLowerCase().includes(needle));
  return hit ? String(hit).replace(/-/g, " ") : "";
}
function searchKeywordHits(raw) {
  const needle = String(raw || "").trim().toLowerCase();
  if (!needle) return null;
  const seen = new Set();
  const groups = [];
  KEYWORD_GROUPS.forEach((group) => {
    const items = [];
    group.items.forEach(([name, query]) => {
      const blob = [name, query].concat(tagFamilyBits(otagSlug(query))).join(" ").toLowerCase();
      if (!blob.includes(needle)) return;
      if (seen.has(query)) return;
      seen.add(query);
      items.push({ name, query, why: matchingWhy(name, query, needle), source: query.startsWith("kw:") ? "kw" : "role" });
    });
    if (items.length) groups.push({ label: group.label, items });
  });
  const related = [];
  const consider = [];
  Object.values(TAG_GRAPH).forEach((g) => {
    consider.push({ slug: g.slug, label: g.label });
    (g.parents || []).concat(g.children || []).concat(g.siblings || []).forEach((x) => consider.push(x));
  });
  consider.forEach((x) => {
    if (!x || !x.slug) return;
    const q = "otag:" + x.slug;
    if (seen.has(q)) return;
    const blob = ((x.slug || "") + " " + (x.label || "")).toLowerCase();
    if (!blob.includes(needle)) return;
    seen.add(q);
    related.push({ name: tagTitle(x.slug), query: q, why: "related tag", source: "role" });
  });
  related.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return { groups, related, needle };
}
function renderKeywords() {
  const root = $("keywords");
  root.innerHTML = "";
  const pads = document.createElement("div");
  pads.className = "kw-pads";
  const panel = document.createElement("div");
  panel.className = "kw-panel";
  const panelTitle = document.createElement("div");
  panelTitle.className = "kw-panel-title";
  const row = document.createElement("div");
  row.className = "keywords";
  panel.appendChild(panelTitle);
  panel.appendChild(row);

  function paintPads() {
    pads.querySelectorAll(".kw-pad").forEach((btn) => {
      const group = KEYWORD_GROUPS.find((g) => g.label === btn.dataset.group);
      const n = group ? selectedInGroup(group) : 0;
      btn.classList.toggle("on", state.kwOpen === btn.dataset.group);
      btn.classList.toggle("has", n > 0);
      btn.setAttribute("aria-pressed", n > 0 ? "true" : "false");
      btn.setAttribute("aria-expanded", state.kwOpen === btn.dataset.group ? "true" : "false");
      const count = btn.querySelector(".kw-count");
      if (count) count.textContent = n ? String(n) : "";
    });
  }

  function fillChipRow(target, group) {
    target.innerHTML = "";
    group.items.forEach(([name, query]) => {
      const btn = document.createElement("button");
      const used = !!(findLeafByQuery(query) || state.parts.some((p) => p.query === query));
      btn.className = "chip" + (used ? " on" : "");
      btn.type = "button";
      btn.textContent = name;
      btn.addEventListener("click", () => {
        togglePaletteLeaf({ label: name, query, source: "role" });
      });
      target.appendChild(btn);
    });
  }

  function showGroup(label) {
    const group = KEYWORD_GROUPS.find((g) => g.label === label);
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    const sheet = $("kwSheet");
    if (!group || state.kwOpen !== label) {
      panel.hidden = true;
      row.innerHTML = "";
      if (sheet) {
        sheet.classList.remove("open");
        sheet.hidden = true;
      }
      paintPads();
      syncSheetLock();
      return;
    }
    if (mobile && sheet) {
      panel.hidden = true;
      $("kwSheetTitle").textContent = group.label;
      fillChipRow($("kwSheetBody"), group);
      sheet.hidden = false;
      sheet.classList.add("open");
      $("kwSheetClose").focus();
    } else {
      if (sheet) {
        sheet.classList.remove("open");
        sheet.hidden = true;
      }
      panel.hidden = false;
      panelTitle.textContent = group.label;
      fillChipRow(row, group);
    }
    paintPads();
    syncSheetLock();
  }

  KEYWORD_GROUPS.forEach((group) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "kw-pad";
    btn.dataset.group = group.label;
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-expanded", "false");
    const label = document.createElement("span");
    label.textContent = group.label;
    const count = document.createElement("span");
    count.className = "kw-count";
    btn.appendChild(label);
    btn.appendChild(count);
    btn.addEventListener("click", () => {
      state.kwTriggerGroup = group.label;
      state.kwOpen = state.kwOpen === group.label ? null : group.label;
      showGroup(group.label);
    });
    pads.appendChild(btn);
  });

  const hits = searchKeywordHits(state.kwSearch);
  if (hits) {
    const box = document.createElement("div");
    box.className = "kw-results";
    if (!hits.groups.length && !hits.related.length) {
      const empty = document.createElement("div");
      empty.className = "expr-empty";
      empty.textContent = "No roles, keywords, or related tags match “" + hits.needle + "”.";
      box.appendChild(empty);
    } else {
      hits.groups.forEach((group) => {
        const h = document.createElement("div");
        h.className = "kw-hit-group";
        h.textContent = group.label;
        box.appendChild(h);
        group.items.forEach((item) => {
          const btn = document.createElement("button");
          const used = !!(findLeafByQuery(item.query) || state.parts.some((p) => p.query === item.query));
          btn.className = "chip" + (used ? " on" : "");
          btn.type = "button";
          btn.appendChild(document.createTextNode(item.name));
          if (item.why) {
            const why = document.createElement("span");
            why.className = "kw-why";
            why.textContent = item.why;
            btn.appendChild(why);
          }
          btn.addEventListener("click", () => {
            togglePaletteLeaf({ label: item.name, query: item.query, source: item.source === "kw" ? "role" : "role" });
          });
          box.appendChild(btn);
        });
      });
      if (hits.related.length) {
        const h = document.createElement("div");
        h.className = "kw-hit-group";
        h.textContent = "Related tags";
        box.appendChild(h);
        hits.related.forEach((item) => {
          const btn = document.createElement("button");
          const used = !!(findLeafByQuery(item.query) || state.parts.some((p) => p.query === item.query));
          btn.className = "chip" + (used ? " on" : "");
          btn.type = "button";
          btn.textContent = item.name;
          btn.addEventListener("click", () => {
            togglePaletteLeaf({ label: item.name, query: item.query, source: "role" });
          });
          box.appendChild(btn);
        });
      }
    }
    root.appendChild(box);
    return;
  }
  root.appendChild(pads);
  root.appendChild(panel);
  showGroup(state.kwOpen);
}


function focusedContainer() {
  const node = findNode(state.focusId) || state.tree;
  if (node.kind === "group") return node;
  return parentOf(node.id) || state.tree;
}
function containerDepth(node) {
  let d = 0, cur = node;
  while (cur && cur.id !== "root") { d += 1; cur = parentOf(cur.id); }
  return d;
}
function placePart(part, dest, index) {
  const box = dest || focusedContainer();
  const at = index == null ? box.children.length : Math.max(0, Math.min(index, box.children.length));
  box.children.splice(at, 0, {
    id: nextTreeId(), kind: "leaf", label: part.label, query: part.query, source: part.source, not: false
  });
  state.focusId = box.id;
  renderKeywords();
  updatePreview();
}
function addContainer(op, not, index) {
  const box = focusedContainer();
  if (containerDepth(box) >= 4) return;
  const child = { id: nextTreeId(), kind: "group", op: op || null, not: !!not, children: [] };
  const at = index == null ? box.children.length : Math.max(0, Math.min(index, box.children.length));
  box.children.splice(at, 0, child);
  state.focusId = child.id;
  updatePreview();
}
function setJoin(op) {
  const box = focusedContainer();
  box.op = op;
  if (box.id === "root") { state.kwMode = op || "and"; paintKwMode(); }
  updatePreview();
}
function wrapParens() {
  const focus = findNode(state.focusId) || state.tree;
  if (focus.kind === "leaf") {
    const parent = parentOf(focus.id);
    if (!parent) return;
    const idx = parent.children.findIndex((ch) => ch.id === focus.id);
    const group = { id: nextTreeId(), kind: "group", op: null, not: false, children: [focus] };
    parent.children.splice(idx, 1, group);
    state.focusId = group.id;
    updatePreview();
    return;
  }
  addContainer(null, false);
}
function toggleNegate() {
  const focus = findNode(state.focusId) || state.tree;
  if (focus.kind === "leaf") { focus.not = !focus.not; updatePreview(); return; }
  if (focus.id === "root") { addContainer(null, true); return; }
  focus.not = !focus.not;
  updatePreview();
}

function removeFocused() {
  const node = findNode(state.focusId);
  if (!node || node.id === "root") return;
  const parent = parentOf(node.id);
  if (!parent) return;
  parent.children = parent.children.filter((ch) => ch.id !== node.id);
  state.focusId = parent.id;
  renderKeywords();
  updatePreview();
}
function isDescendant(ancestor, node) {
  if (!ancestor || !node) return false;
  let found = false;
  walkTree(ancestor, (n) => { if (n.id === node.id && n !== ancestor) found = true; });
  return found;
}
function takeNode(id) {
  const parent = parentOf(id);
  if (!parent) return null;
  const idx = parent.children.findIndex((ch) => ch.id === id);
  if (idx < 0) return null;
  return parent.children.splice(idx, 1)[0];
}
function returnLeavesToParts(node) {
  walkTree(node, (n) => {
    if (n.kind !== "leaf") return;
    if (!state.parts.some((p) => p.query === n.query)) {
      state.parts.push({ id: nextTreeId(), label: n.label, query: n.query, source: n.source });
    }
  });
}
function dropPayload(payload, destId, index) {
  if (!payload) return;
  if (destId === "trash") {
    if (payload.kind !== "node") return;
    const node = findNode(payload.id);
    if (!node || node.id === "root") return;
    takeNode(payload.id);
    state.focusId = "root";
    renderKeywords();
    updatePreview();
    return;
  }
  if (destId === "parts") {
    if (payload.kind === "part" || payload.kind === "expr") return;
    const node = takeNode(payload.id);
    if (node) returnLeavesToParts(node);
    state.focusId = "root";
    renderKeywords();
    updatePreview();
    return;
  }
  const dest = destId === "root" ? state.tree : findNode(destId);
  if (!dest || dest.kind !== "group") return;
  if (payload.kind === "expr") {
    if (payload.expr === "and" || payload.expr === "or") {
      dest.op = payload.expr;
      if (dest.id === "root") { state.kwMode = dest.op; paintKwMode(); }
      state.focusId = dest.id;
      updatePreview();
      return;
    }
    const child = { id: nextTreeId(), kind: "group", op: null, not: payload.expr === "not", children: [] };
    dest.children.splice(Math.max(0, Math.min(index, dest.children.length)), 0, child);
    state.focusId = child.id;
    updatePreview();
    return;
  }
  if (payload.kind === "part") {
    const part = state.parts.find((p) => p.query === payload.query);
    if (!part) return;
    placePart(part, dest, index);
    return;
  }
  const moving = findNode(payload.id);
  if (!moving || moving.id === dest.id || isDescendant(moving, dest)) return;
  const node = takeNode(payload.id);
  if (!node) return;
  dest.children.splice(Math.max(0, Math.min(index, dest.children.length)), 0, node);
  state.focusId = dest.id;
  updatePreview();
}
const builderDrag = {
  on: false, moved: false, payload: null, ghost: null, fromEl: null, slot: null,
  ignoreClick: false, carry: null, holdTimer: null, pointerId: null
};
function clearHold() {
  if (builderDrag.holdTimer) { clearTimeout(builderDrag.holdTimer); builderDrag.holdTimer = null; }
}
function dragCleanup(keepCarry) {
  clearHold();
  if (!keepCarry && builderDrag.ghost) builderDrag.ghost.remove();
  if (builderDrag.slot) builderDrag.slot.remove();
  document.querySelectorAll(".drop-on, .is-dragging").forEach((el) => el.classList.remove("drop-on", "is-dragging"));
  builderDrag.on = false; builderDrag.moved = false; builderDrag.payload = null;
  builderDrag.fromEl = null; builderDrag.slot = null; builderDrag.pointerId = null;
  if (!keepCarry) {
    builderDrag.ghost = null;
    builderDrag.carry = null;
    document.body.classList.remove("builder-dragging");
    document.body.classList.remove("builder-node-dragging");
  }
}
function liftGhost(label, x, y) {
  if (!builderDrag.ghost) {
    const ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    document.body.appendChild(ghost);
    builderDrag.ghost = ghost;
  }
  builderDrag.ghost.textContent = label || "expr";
  builderDrag.ghost.style.left = x + "px";
  builderDrag.ghost.style.top = y + "px";
}
function startLift(payload, fromEl, x, y) {
  builderDrag.moved = true;
  builderDrag.payload = payload;
  if (fromEl) fromEl.classList.add("is-dragging");
  document.body.classList.add("builder-dragging");
  if (payload.kind === "node") document.body.classList.add("builder-node-dragging");
  liftGhost(payload.label, x, y);
}
function paintDrop(x, y) {
  document.querySelectorAll(".drop-on").forEach((n) => n.classList.remove("drop-on"));
  if (builderDrag.slot) { builderDrag.slot.remove(); builderDrag.slot = null; }
  const drop = currentDrop(x, y);
  if (!drop) return drop;
  drop.el.classList.add("drop-on");
  return drop;
}
function dropIndexFor(container, x) {
  const kids = [...container.querySelectorAll(":scope > [data-node-id]")];
  for (let i = 0; i < kids.length; i++) {
    const r = kids[i].getBoundingClientRect();
    if (x < r.left + r.width / 2) return i;
  }
  return kids.length;
}
function currentDrop(x, y) {
  const stack = document.elementsFromPoint(x, y);
  const hit = stack.find((n) => n.dataset && n.dataset.drop);
  if (!hit) return null;
  return { el: hit, dest: hit.dataset.drop, index: hit.dataset.drop === "parts" ? 0 : dropIndexFor(hit, x) };
}
function bindBuilderDrag(el, payload) {
  el.style.cursor = "grab";
  el.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    const owner = e.target.closest("[data-node-id]");
    if (owner && owner !== el) return;
    if (e.target.closest(".mini")) return;
    if (builderDrag.carry) return;
    clearHold();
    builderDrag.on = true;
    builderDrag.moved = false;
    builderDrag.payload = payload;
    builderDrag.fromEl = el;
    builderDrag.startX = e.clientX;
    builderDrag.startY = e.clientY;
    builderDrag.pointerId = e.pointerId;
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    builderDrag.holdTimer = setTimeout(() => {
      if (!builderDrag.on || builderDrag.moved) return;
      startLift(payload, el, e.clientX, e.clientY);
    }, 160);
  });
}
function onDragMove(e) {
  if ((!builderDrag.on && !builderDrag.carry) || (!builderDrag.payload && !builderDrag.carry)) return;
  const x = e.clientX, y = e.clientY;
  if (builderDrag.on && !builderDrag.moved) {
    if (Math.hypot(x - builderDrag.startX, y - builderDrag.startY) < 8) return;
    clearHold();
    startLift(builderDrag.payload, builderDrag.fromEl, x, y);
  }
  if (e.cancelable) e.preventDefault();
  const payload = builderDrag.payload || builderDrag.carry;
  if (builderDrag.ghost) liftGhost(payload && payload.label, x, y);
  paintDrop(x, y);
}
function onDragEnd(e) {
  if (builderDrag.carry && !builderDrag.on) {
    const drop = currentDrop(e.clientX, e.clientY);
    const payload = builderDrag.carry;
    builderDrag.ignoreClick = true;
    if (drop) {
      dragCleanup();
      dropPayload(payload, drop.dest, drop.index);
    }
    return;
  }
  if (!builderDrag.on) return;
  const payload = builderDrag.payload;
  const moved = builderDrag.moved;
  const drop = moved ? currentDrop(e.clientX, e.clientY) : null;
  clearHold();
  if (moved) builderDrag.ignoreClick = true;
  if (moved && payload && drop) {
    dragCleanup();
    dropPayload(payload, drop.dest, drop.index);
    return;
  }
  if (moved && payload && !drop) {
    builderDrag.carry = payload;
    dragCleanup(true);
    const hint = $("builderHint");
    if (hint) hint.textContent = "Carrying " + (payload.label || "item") + " — tap the canvas or a group to place it.";
    return;
  }
  dragCleanup();
}
document.addEventListener("pointermove", onDragMove, { passive: false, capture: true });
document.addEventListener("pointerup", onDragEnd, { capture: true });
document.addEventListener("pointercancel", onDragEnd, { capture: true });
document.addEventListener("touchmove", (e) => {
  if ((builderDrag.on && builderDrag.moved) || builderDrag.carry) {
    if (e.cancelable) e.preventDefault();
    const t = e.touches[0] || e.changedTouches[0];
    if (t) onDragMove({ clientX: t.clientX, clientY: t.clientY, cancelable: false });
  }
}, { passive: false, capture: true });

function renderBuilder() {
  const partsEl = $("parts");
  const space = $("workspace");
  const hint = $("builderHint");
  const read = $("builderRead");
  if (!partsEl || !space) return;
  partsEl.innerHTML = "";
  space.innerHTML = "";
  partsEl.dataset.drop = "parts";
  if (!state.parts.length) {
    const empty = document.createElement("div");
    empty.className = "expr-empty";
    empty.textContent = "Select a type or role above to create your first block.";
    partsEl.appendChild(empty);
  } else {
    state.parts.forEach((part) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "leaf on" + (part.source === "type" ? " type" : "");
      const used = treeLeaves().filter((n) => n.query === part.query).length;
      btn.appendChild(document.createTextNode(part.label + (used ? " · " + used : "")));
      const plus = document.createElement("span"); plus.className = "mini"; plus.textContent = "Add";
      btn.setAttribute("aria-label", "Add " + part.label + " to the script");
      btn.appendChild(plus);
      btn.addEventListener("click", () => {
        if (builderDrag.ignoreClick) { builderDrag.ignoreClick = false; return; }
        placePart(part);
      });
      bindBuilderDrag(btn, { kind: "part", query: part.query, label: part.label });
      partsEl.appendChild(btn);
    });
  }
  function joinEl(op) {
    const el = document.createElement("span");
    if (!op) { el.className = "join need"; el.textContent = ""; el.title = "Drop AND or OR"; }
    else { el.className = "join" + (op === "or" ? " or" : ""); el.textContent = op === "or" ? "OR" : "AND"; }
    return el;
  }
  function renderLeaf(node) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "leaf " + (node.not ? "not" : "on") + (node.source === "type" ? " type" : "") + (state.focusId === node.id ? " picked" : "");
    btn.dataset.nodeId = node.id;
    btn.appendChild(document.createTextNode((node.not ? "− " : "") + node.label));
    bindBuilderDrag(btn, { kind: "node", id: node.id, label: node.label });
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (builderDrag.ignoreClick) { builderDrag.ignoreClick = false; return; }
      state.focusId = node.id; renderBuilder();
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        state.focusId = node.id;
        removeFocused();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        state.focusId = node.id;
        toggleNegate();
      }
    });
    btn.addEventListener("dblclick", (e) => { e.stopPropagation(); state.focusId = node.id; toggleNegate(); });
    return btn;
  }
  function renderGroup(node) {
    const box = document.createElement("div");
    box.className =
      "box" +
      (node.op === "or" ? " or-box" : "") +
      (node.not ? " not-box" : "") +
      (!node.children.length ? " empty-group" : "") +
      (!node.op && node.children.length > 1 ? " pending-join" : "") +
      (state.focusId === node.id ? " focused" : "");
    box.dataset.drop = node.id;
    box.dataset.nodeId = node.id;
    if (!node.children.length) {
      box.setAttribute("aria-label", (node.not ? "Not " : "") + "empty expression group");
    } else {
      node.children.forEach((ch, i) => {
        if (i) box.appendChild(joinEl(node.op));
        box.appendChild(ch.kind === "leaf" ? renderLeaf(ch) : renderGroup(ch));
      });
    }
    bindBuilderDrag(box, { kind: "node", id: node.id, label: (node.not ? "NOT " : "") + "Group" });
    box.addEventListener("click", (e) => {
      e.stopPropagation();
      if (builderDrag.ignoreClick) { builderDrag.ignoreClick = false; return; }
      state.focusId = node.id; renderBuilder();
    });
    box.tabIndex = 0;
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", (node.not ? "Not " : "") + "expression group");
    box.addEventListener("keydown", (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        state.focusId = node.id;
        removeFocused();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        state.focusId = node.id;
        toggleNegate();
      }
    });
    return box;
  }
  space.dataset.drop = "root";
  space.classList.toggle("has-content", state.tree.children.length > 0);
  const trash = $("builderTrash");
  if (trash) trash.hidden = !state.tree.children.length;
  space.classList.toggle("focused", state.focusId === "root");
  space.onclick = (e) => {
    if (e.target !== space) return;
    if (builderDrag.ignoreClick) { builderDrag.ignoreClick = false; return; }
    state.focusId = "root"; renderBuilder();
  };
  if (!state.tree.children.length) {
    const empty = document.createElement("div");
    empty.className = "expr-empty";
    empty.textContent = "No blocks in your script yet. Click Add above to place one here.";
    space.appendChild(empty);
  } else {
    state.tree.children.forEach((ch, i) => {
      if (i) space.appendChild(joinEl(state.tree.op));
      space.appendChild(ch.kind === "leaf" ? renderLeaf(ch) : renderGroup(ch));
    });
  }
  if (read) {
    read.innerHTML = "";
    const plain = expressionIsSetup() ? englishNode(state.tree) : partsEnglish();
    if (!plain) {
      const s = document.createElement("span"); s.className = "mute";
      s.textContent = state.builderOpen
        ? "Add filters to the script, then choose AND, OR, Group, or NOT."
        : "All / Any joins your picks. Open this to build a custom script.";
      read.appendChild(s);
    } else if (!expressionIsSetup()) {
      plain.split(/(\bor\b|\band\b|\bnot\b|·|\(|\))/).forEach((bit) => {
        const span = document.createElement("span");
        if (bit === "or") span.className = "or";
        else if (bit === "not") span.className = "not";
        else if (bit === "and" || bit === "·" || bit === "(" || bit === ")") span.className = "mute";
        span.textContent = bit; read.appendChild(span);
      });
    } else {
      plain.split(/(\bor\b|\band\b|\bnot\b|·|\(|\))/).forEach((bit) => {
        const span = document.createElement("span");
        if (bit === "or") span.className = "or";
        else if (bit === "not") span.className = "not";
        else if (bit === "and" || bit === "·" || bit === "(" || bit === ")") span.className = "mute";
        span.textContent = bit; read.appendChild(span);
      });
    }
  }
  const box = focusedContainer();
  const andBtn = $("addAndBtn"); const orBtn = $("addOrBtn"); const notBtn = $("addNotBtn");
  if (andBtn) andBtn.classList.toggle("on", box.op === "and");
  if (orBtn) orBtn.classList.toggle("on", box.op === "or");
  const focus = findNode(state.focusId);
  if (notBtn) notBtn.classList.toggle("on", !!(focus && focus.not));
  if (hint) {
    hint.textContent = builderDrag.carry
      ? "Carrying " + (builderDrag.carry.label || "item") + " — tap the canvas or a group to place it."
      : "Click Add to place blocks. Dragging is optional; on a phone, hold a block to move it.";
  }
}

function paintKwMode() {
  const btn = $("kwMode");
  btn.dataset.mode = state.kwMode;
  btn.classList.toggle("is-any", state.kwMode === "or");
  btn.querySelectorAll("[data-kw-mode]").forEach((option) => {
    option.setAttribute("aria-checked", option.dataset.kwMode === state.kwMode ? "true" : "false");
  });
}
function paintIdMode() {
  const btn = $("idMode");
  if (!btn) return;
  btn.dataset.mode = state.idMode;
  btn.querySelectorAll("[data-pick]").forEach((option) => {
    option.setAttribute("aria-checked", option.dataset.pick === state.idMode ? "true" : "false");
  });
}
function syncSheetLock() {
  const on = !!$("kwSheet")?.classList.contains("open");
  document.documentElement.classList.toggle("sheet-open", on);
  document.body.classList.toggle("sheet-open", on);
}
function closeKeywordSheet() {
  const sheet = $("kwSheet");
  const card = sheet?.querySelector(".kw-sheet-card");
  if (card) {
    card.classList.remove("dragging");
    card.style.transform = "";
  }
  if (!state.kwOpen) {
    if (sheet) {
      sheet.classList.remove("open");
      sheet.hidden = true;
    }
    syncSheetLock();
    return;
  }
  state.kwOpen = null;
  renderKeywords();
  syncSheetLock();
  if (state.kwTriggerGroup) {
    document.querySelector(`[data-group="${CSS.escape(state.kwTriggerGroup)}"]`)?.focus();
    state.kwTriggerGroup = null;
  }
}
$("kwSheetClose").addEventListener("pointerdown", (e) => e.stopPropagation());
$("kwSheetClose").addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeKeywordSheet();
});
$("kwSheetBack").addEventListener("click", closeKeywordSheet);
document.addEventListener("touchmove", (e) => {
  if (!document.body.classList.contains("sheet-open")) return;
  if (!e.target.closest(".kw-sheet-card")) e.preventDefault();
}, { passive: false });
document.addEventListener("keydown", (e) => {
  const sheetOpen = document.body.classList.contains("sheet-open");
  if (sheetOpen) {
    const dialog = $("kwSheet")?.querySelector(".kw-sheet-card");
    if (e.key === "Escape") {
      e.preventDefault();
      closeKeywordSheet();
      return;
    }
    if (e.key === "Tab" && dialog) {
      const focusable = [...dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )].filter((el) => !el.disabled && !el.hidden);
      if (focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!dialog.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
      return;
    }
  }
  if (e.key === "Escape") {
    if (builderDrag.carry || builderDrag.on) {
      dragCleanup();
      renderBuilder();
      return;
    }
    if (state.focusId !== "root") {
      const parent = parentOf(state.focusId);
      state.focusId = parent ? parent.id : "root";
      renderBuilder();
      return;
    }
    closeKeywordSheet();
  }
  if (
    e.key === "Backspace" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) &&
    e.target.closest("#workspace, [data-node-id]")
  ) {
    e.preventDefault();
    removeFocused();
  }
});

(function bindSheetSwipe() {
  const sheet = $("kwSheet");
  const card = sheet.querySelector(".kw-sheet-card");
  const grab = (t) => !t.closest(".kw-sheet-close") && t.closest(".kw-sheet-head");
  const drag = { on: false, y: 0, last: 0, v: 0 };
  const resetCard = () => {
    card.classList.remove("dragging");
    card.style.transform = "";
  };
  card.addEventListener("pointerdown", (e) => {
    if (!grab(e.target)) return;
    drag.on = true;
    drag.y = e.clientY;
    drag.last = e.clientY;
    drag.v = 0;
    card.classList.add("dragging");
    card.setPointerCapture(e.pointerId);
  });
  card.addEventListener("pointermove", (e) => {
    if (!drag.on) return;
    const dy = e.clientY - drag.y;
    drag.v = e.clientY - drag.last;
    drag.last = e.clientY;
    card.style.transform = "translateY(" + Math.max(0, dy) + "px)";
  });
  const end = (e) => {
    if (!drag.on) return;
    drag.on = false;
    const dy = Math.max(0, e.clientY - drag.y);
    const shouldClose = dy > 90 || drag.v > 12;
    resetCard();
    if (shouldClose) closeKeywordSheet();
  };
  card.addEventListener("pointerup", end);
  card.addEventListener("pointercancel", end);
})();

$("idMode").addEventListener("click", (e) => {
  const bit = e.target.closest("[data-pick]");
  if (!bit) return;
  state.idMode = bit.dataset.pick;
  paintIdMode();
  updatePreview();
});
function bindModeKeyboard(id, attribute) {
  $(id).addEventListener("keydown", (e) => {
    const option = e.target.closest("[" + attribute + "]");
    if (!option || !["Enter", " "].includes(e.key)) return;
    e.preventDefault();
    option.click();
  });
}
bindModeKeyboard("idMode", "data-pick");
bindModeKeyboard("kwMode", "data-kw-mode");
function paintBuilderOpen() {
  const el = $("builder");
  const btn = $("builderToggle");
  if (!el || !btn) return;
  el.classList.toggle("is-collapsed", !state.builderOpen);
  btn.setAttribute("aria-expanded", state.builderOpen ? "true" : "false");
}
$("builderToggle").addEventListener("click", () => {
  state.builderOpen = !state.builderOpen;
  paintBuilderOpen();
});
function paintToTop() {
  const btn = $("toTop");
  if (!btn) return;
  const show = window.scrollY > 360;
  btn.classList.toggle("show", show);
  btn.hidden = !show;
}
$("toTop").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
window.addEventListener("scroll", paintToTop, { passive: true });
paintToTop();
function paintResultCols() {
  const cols = String(state.resultCols || 2);
  if (resultsEl) resultsEl.dataset.cols = cols;
  document.querySelectorAll("#rowToggle [data-cols]").forEach((btn) => {
    const on = btn.dataset.cols === cols;
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}
$("rowToggle").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cols]");
  if (!btn) return;
  state.resultCols = Number(btn.dataset.cols);
  paintResultCols();
});
paintResultCols();
$("kwMode").addEventListener("click", (e) => {
  const bit = e.target.closest("[data-kw-mode]");
  if (!bit) return;
  state.kwMode = bit.dataset.kwMode;
  state.tree.op = state.kwMode;
  paintKwMode();
  updatePreview();
});
$("addAndBtn").addEventListener("click", () => {
  if (builderDrag.ignoreClick) { builderDrag.ignoreClick = false; return; }
  setJoin("and");
});
$("addOrBtn").addEventListener("click", () => {
  if (builderDrag.ignoreClick) { builderDrag.ignoreClick = false; return; }
  setJoin("or");
});
$("addGroupBtn").addEventListener("click", () => {
  if (builderDrag.ignoreClick) { builderDrag.ignoreClick = false; return; }
  wrapParens();
});
$("addNotBtn").addEventListener("click", () => {
  if (builderDrag.ignoreClick) { builderDrag.ignoreClick = false; return; }
  toggleNegate();
});
$("builderTrash").addEventListener("click", () => {
  if (!builderDrag.carry) return;
  const payload = builderDrag.carry;
  dragCleanup();
  dropPayload(payload, "trash", 0);
});
bindBuilderDrag($("addAndBtn"), { kind: "expr", expr: "and", label: "AND" });
bindBuilderDrag($("addOrBtn"), { kind: "expr", expr: "or", label: "OR" });
bindBuilderDrag($("addGroupBtn"), { kind: "expr", expr: "group", label: "Group" });
bindBuilderDrag($("addNotBtn"), { kind: "expr", expr: "not", label: "NOT" });

["sort", "unique", "setQuery", "yearFrom", "yearTo"].forEach((id) => {
  $(id).addEventListener("change", updatePreview);
  $(id).addEventListener("input", updatePreview);
});
document.querySelectorAll("#rarityQuery [data-rarity]").forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.classList.toggle("on");
    button.setAttribute("aria-pressed", String(selected));
    updatePreview();
  });
});
$("kwSearch").addEventListener("input", () => {
  state.kwSearch = $("kwSearch").value;
  renderKeywords();
});
$("kwSearch").addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $("kwSearch").value = "";
    state.kwSearch = "";
    renderKeywords();
  }
});
$("oracleQuery").addEventListener("input", updatePreview);
$("oracleQuery").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    search(true);
  }
});
$("subtypeQuery").addEventListener("input", updatePreview);
$("subtypeQuery").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    search(true);
  }
});

const cmcDrag = { active: false, axis: null, x: 0, y: 0, min: 0, max: 15 };

function applyCmcWindow(min, max) {
  min = Math.max(0, Math.min(CMC_MAX, Math.round(min)));
  max = Math.max(0, Math.min(CMC_MAX, Math.round(max)));
  if (min > max) {
    const t = min;
    min = max;
    max = t;
  }
  state.cmcMin = min;
  state.cmcMax = max;
  renderCmc();
  updatePreview();
}

function bindCmcPad() {
  const pad = $("cmcPad");
  const stepX = () => {
    const rail = pad.querySelector(".cmc-rail");
    return Math.max(12, (rail.clientWidth || pad.clientWidth - 28) / CMC_MAX);
  };
  const stepY = 26;

  pad.addEventListener("pointerdown", (e) => {
    pad.setPointerCapture(e.pointerId);
    pad.classList.add("held");
    cmcDrag.active = true;
    cmcDrag.axis = null;
    cmcDrag.x = e.clientX;
    cmcDrag.y = e.clientY;
    cmcDrag.min = state.cmcMin;
    cmcDrag.max = state.cmcMax;
  });
  pad.addEventListener("pointermove", (e) => {
    if (!cmcDrag.active) return;
    const dx = e.clientX - cmcDrag.x;
    const dy = e.clientY - cmcDrag.y;
    if (!cmcDrag.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      cmcDrag.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    const startWidth = cmcDrag.max - cmcDrag.min + 1;
    const startMid = (cmcDrag.min + cmcDrag.max) / 2;
    let width = startWidth;
    let mid = startMid;
    if (cmcDrag.axis === "y") {
      width = Math.max(1, Math.min(CMC_MAX + 1, startWidth + Math.round(-dy / stepY)));
    } else {
      mid = startMid + Math.round(dx / stepX());
    }
    let start = Math.round(mid - (width - 1) / 2);
    start = Math.max(0, Math.min(CMC_MAX + 1 - width, start));
    applyCmcWindow(start, start + width - 1);
  });
  const endDrag = (e) => {
    if (!cmcDrag.active) return;
    cmcDrag.active = false;
    cmcDrag.axis = null;
    pad.classList.remove("held");
    if (e && pad.hasPointerCapture?.(e.pointerId)) pad.releasePointerCapture(e.pointerId);
  };
  pad.addEventListener("pointerup", endDrag);
  pad.addEventListener("pointercancel", endDrag);
}
bindCmcPad();
$("cmcPad").addEventListener("keydown", (e) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
  e.preventDefault();
  if (e.key === "Home") {
    applyCmcWindow(0, state.cmcMax);
    return;
  }
  if (e.key === "End") {
    applyCmcWindow(state.cmcMin, CMC_MAX);
    return;
  }
  const delta = e.key === "ArrowLeft" ? -1 : 1;
  applyCmcWindow(state.cmcMin + delta, state.cmcMax + delta);
});
$("cmcAny").addEventListener("click", () => applyCmcWindow(0, CMC_MAX));
window.addEventListener("resize", renderCmc);

$("searchBtn").addEventListener("click", () => {
  if (state.kwOpen) {
    state.kwOpen = null;
    renderKeywords();
  }
  search(true);
});
$("moreBtn").addEventListener("click", () => search(false));
$("clearBtn").addEventListener("click", () => {
  if (state.searchController) state.searchController.abort();
  state.searchRequest++;
  state.searchController = null;
  state.colors.clear();
  document.querySelectorAll("#colors .mana").forEach((b) => {
    b.classList.remove("on");
    b.setAttribute("aria-pressed", "false");
  });
  themeFromColors();
  document.querySelectorAll("#types .chip, #isFlags .chip, #layouts .chip").forEach((b) => {
    b.classList.remove("on", "exclude");
    if (b.dataset.label) b.textContent = b.dataset.label;
  });
  $("oracleQuery").value = "";
  $("subtypeQuery").value = "";
  $("setQuery").value = "";
  document.querySelectorAll("#rarityQuery [data-rarity]").forEach((button) => {
    button.classList.remove("on");
    button.setAttribute("aria-pressed", "false");
  });
  $("yearFrom").value = "";
  $("yearTo").value = "";
  $("kwSearch").value = "";
  state.kwSearch = "";
  state.tree = { id: "root", kind: "group", op: null, not: false, children: [] };
  state.parts = [];
  state.focusId = "root";
  state.lineageSlug = null;
  state.lineageOpen = {};
  state.kwOpen = null;
  state.kwMode = "and";
  state.idMode = "identity";
  paintKwMode();
  paintIdMode();
  renderKeywords();
  state.cmcMin = 0;
  state.cmcMax = CMC_MAX;
  renderCmc();
  resultsEl.innerHTML = "";
  moreBtn.hidden = true;
  statusEl.classList.remove("error");
  statusEl.textContent = "Set filters, then search.";
  updatePreview();
});

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

const priceCache = new Map();

function lowestPrice(card) {
  const id = card.oracle_id || card.id;
  if (id && priceCache.has(id) && priceCache.get(id) != null) return priceCache.get(id);
  return priceFromObj(card.prices);
}

function paintCardPrice(el, n) {
  const priceEl = el.querySelector(".price");
  if (!priceEl) return;
  priceEl.textContent = n == null ? "—" : formatPrice(n);
  priceEl.classList.toggle("none", n == null);
}

async function fetchPrintsMin(oracleIds, signal) {
  const found = {};
  for (let i = 0; i < oracleIds.length; i += 12) {
    const chunk = oracleIds.slice(i, i + 12);
    let url = "https://api.scryfall.com/cards/search?" + new URLSearchParams({
      q: chunk.map((id) => "oracleid:" + id).join(" or "),
      unique: "prints",
      order: "usd",
      dir: "asc",
    });
    while (url) {
      const data = await scryfall.searchPage(url, { signal });
      (data.data || []).forEach((c) => {
        const id = c.oracle_id;
        const n = priceFromObj(c.prices);
        if (!id || n == null) return;
        found[id] = found[id] == null ? n : Math.min(found[id], n);
      });
      url = data.has_more ? data.next_page : null;
    }
  }
  return found;
}

async function hydrateCardPrices(cards, signal) {
  cards.forEach((card) => {
    const id = card.oracle_id || card.id;
    const n = priceFromObj(card.prices);
    if (id && n != null && !priceCache.has(id)) priceCache.set(id, n);
  });
  const missing = [];
  cards.forEach((card) => {
    const id = card.oracle_id;
    if (!id) return;
    if (!priceCache.has(id)) missing.push(id);
  });
  const uniq = Array.from(new Set(missing));
  if (uniq.length) {
    const found = await fetchPrintsMin(uniq, signal);
    uniq.forEach((id) => priceCache.set(id, found[id] != null ? found[id] : null));
  }
  resultsEl.querySelectorAll(".card[data-oracle]").forEach((el) => {
    const n = priceCache.get(el.dataset.oracle);
    paintCardPrice(el, n == null ? null : n);
  });
}

function renderCards(cards, append) {
  if (!append) resultsEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const card of cards) {
    const el = document.createElement("article");
    el.className = "card";
    if (card.oracle_id) el.dataset.oracle = card.oracle_id;
    const faces = facesFor(card);
    const cardUrl = String(card.scryfall_uri || "");
    const scry = /^https:\/\//i.test(cardUrl) ? cardUrl : "#";
    const price = lowestPrice(card);
    const art = document.createElement("a");
    art.className = "card-art";
    art.href = scry;
    art.target = "_blank";
    art.rel = "noopener";
    const imgEl = faces[0].img ? document.createElement("img") : null;
    if (imgEl) {
      imgEl.loading = "lazy";
      imgEl.src = faces[0].img;
      art.appendChild(imgEl);
    }
    const meta = document.createElement("div");
    meta.className = "meta";
    const metaRow = document.createElement("div");
    metaRow.className = "meta-row";
    const nameEl = document.createElement("div");
    nameEl.className = "name";
    const priceEl = document.createElement("div");
    priceEl.className = "price";
    const typeEl = document.createElement("div");
    typeEl.className = "type";
    metaRow.append(nameEl, priceEl);
    meta.append(metaRow, typeEl);
    const printings = document.createElement("button");
    printings.type = "button";
    printings.className = "printings-btn";
    printings.textContent = "View printings";
    printings.addEventListener("click", () => showPrintings(card));
    meta.appendChild(printings);
    el.append(art, meta);
    nameEl.textContent = faces[0].name;
    typeEl.textContent = faces[0].type;
    if (imgEl) imgEl.alt = faces[0].name || "Card art";
    priceEl.textContent = formatPrice(price);
    priceEl.classList.toggle("none", price == null);
    if (faces.length > 1 && imgEl) {
      let face = 0;
      const flip = document.createElement("button");
      flip.type = "button";
      flip.className = "flip-btn";
      flip.setAttribute("aria-label", "Flip card");
      flip.textContent = "↺";
      flip.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        face = (face + 1) % faces.length;
        imgEl.src = faces[face].img;
        imgEl.alt = faces[face].name || "Card art";
        nameEl.textContent = faces[face].name;
        typeEl.textContent = faces[face].type;
      });
      art.appendChild(flip);
    }
    frag.appendChild(el);
  }
  resultsEl.appendChild(frag);
}

function showEmptyResults(kind, detail) {
  const wrap = document.createElement("div");
  wrap.className = "empty";
  const title = document.createElement("div");
  title.className = "empty-title";
  const hint = document.createElement("div");
  hint.className = "empty-hint";
  if (kind === "none") {
    title.textContent = "Nothing in that slice";
    const tips = [];
    if (!expressionIsSetup() && state.kwMode === "and" && state.parts.length > 1) {
      tips.push("All means a card must have every picked type and role. Flip to Any.");
    } else if (state.tree.op === "and" && state.tree.children.length > 1) {
      tips.push("The expression is AND — every clause must match. Use OR or group alternatives.");
    }
    if (state.idMode === "exact") {
      tips.push("Exact is only that color pair. Try Within or Identity.");
    } else if (state.idMode === "inside") {
      tips.push("Within is only those colors, no colorless. Try Identity to include artifacts.");
    } else if (state.idMode === "identity") {
      tips.push("Identity is the Commander deck. Try Having if you want extra colors.");
    }
    if (!cmcIsAny()) tips.push("Widen the mana range.");
    if (!tips.length) tips.push("Drop a type or role, or widen colors, then search again.");
    hint.textContent = tips[0];
  } else {
    title.textContent = "Couldn’t search";
    hint.textContent = "Check the query preview and try again.";
  }
  wrap.appendChild(title);
  wrap.appendChild(hint);
  resultsEl.innerHTML = "";
  resultsEl.appendChild(wrap);
}

async function search(reset) {
  if (reset && state.searchController) state.searchController.abort();
  const controller = new AbortController();
  const requestId = ++state.searchRequest;
  state.searchController = controller;
  const q = buildQuery();
  const unique = $("unique").value;
  const sort = $("sort").value;
  let url;
  if (reset) {
    state.shown = 0;
    state.total = 0;
    state.next = null;
    moreBtn.hidden = reset || !state.next;
  } else {
    url = state.next;
    if (!url) return;
  }

  $("searchBtn").disabled = true;
  moreBtn.disabled = true;
  setStatus(reset ? "Searching Scryfall…" : "Loading more…");

  try {
    const data = reset
      ? await scryfall.searchCards({
          query: q,
          unique,
          order: sort,
          dir: sort === "edhrec" || sort === "usd" || sort === "cmc" ? "asc" : "auto",
          signal: controller.signal
        })
      : await scryfall.searchPage(url, { signal: controller.signal });
    if (requestId !== state.searchRequest) return;
    const cards = data.data || [];
    if (!cards.length) {
      showEmptyResults("none");
      setStatus("0 cards");
      moreBtn.hidden = true;
      return;
    }
    state.total = data.total_cards || cards.length;
    state.shown += cards.length;
    state.next = data.has_more ? data.next_page : null;
    renderCards(cards, !reset);
    hydrateCardPrices(cards, controller.signal).catch((error) => {
      if (error?.name === "AbortError" || requestId !== state.searchRequest) return;
      console.warn("Unable to hydrate card prices.", error);
    });
    moreBtn.hidden = !state.next;
    const colorNote = identityClause() || "any colors";
    setStatus(state.shown + " of " + state.total.toLocaleString() + " cards · " + colorNote);
  } catch (err) {
    if (err?.name === "AbortError" || requestId !== state.searchRequest) return;
    if (reset) showEmptyResults(err.code === "not_found" ? "none" : "error", err.message);
    setStatus(err.code === "not_found" ? "0 cards" : (err.message || "Search failed"), err.code !== "not_found");
    moreBtn.hidden = true;
  } finally {
    if (requestId === state.searchRequest) {
      state.searchController = null;
      $("searchBtn").disabled = false;
      moreBtn.disabled = false;
    }
  }
}

function usedKeywordNames() {
  const used = new Set();
  KEYWORD_GROUPS.forEach((group) => {
    group.items.forEach(([, q]) => {
      const m = String(q).match(/kw:"?([^" )]+)"?/i);
      if (m) used.add(m[1].toLowerCase());
    });
  });
  return used;
}

function addUniqueItem(group, name, query) {
  const key = name.toLowerCase();
  if (group.items.some(([n]) => n.toLowerCase() === key)) return;
  group.items.push([name, query]);
}

async function hydrateCatalogs() {
  try {
    const [keywords, abilityWords] = await Promise.all([
      scryfall.catalog("keyword-abilities"),
      scryfall.catalog("ability-words")
    ]);
    const skipKeywords = new Set(["affinitycycling"]);
    const used = usedKeywordNames();
    const byLabel = Object.fromEntries(KEYWORD_GROUPS.map((g) => [g.label, g]));
    keywords.forEach((name) => {
      const key = String(name).toLowerCase();
      if (skipKeywords.has(key) || used.has(key)) return;
      const label = categorizeKeyword(name);
      const group = byLabel[label] || byLabel["Ability words"];
      addUniqueItem(group, name, kwQuery(name));
      used.add(String(name).toLowerCase());
    });
    const awGroup = byLabel["Ability words"];
    if (awGroup && abilityWords.length) {
      abilityWords.forEach((name) => {
        if (used.has(String(name).toLowerCase())) return;
        addUniqueItem(awGroup, titleWords(name), kwQuery(name));
        used.add(String(name).toLowerCase());
      });
    }
    KEYWORD_GROUPS.forEach((group) => {
      group.items.sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: "base" }));
    });
    renderKeywords();
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.warn("Unable to hydrate Scryfall keyword catalogs; using curated entries.", error);
    }
  }
}

renderKeywords();
renderCmc();
paintKwMode();
paintIdMode();
paintBuilderOpen();
themeFromColors();
updatePreview();
hydrateCatalogs();
