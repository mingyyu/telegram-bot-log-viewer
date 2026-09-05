import assert from 'node:assert';
import { buildIdentities, resolvePlayer } from '../src/utils/identity.js';
import { decodeCallback } from '../src/utils/callback.js';
import { baseCommand, categorize, computeStats } from '../src/utils/stats.js';

console.log('Testing viewer utilities...');

// ---------------------------------------------------------------- identity --
// A real profile block: the first line describes the player, later lines
// describe a different noble and an alliance and must not be picked up.
const PROFILE = [
  'You are 🤶 Marquis [HIM]RickN (♟2956 ⏱2842), ranked 🏅18 in the world and 🏅9 within your title. /journal_1745',
  'You need ♟1905 more to reach the title of Duke.',
  'You have 110/110 vassals.',
  'You are a vassal of 🤶 Duchess [HIM]Serah (♟10532 ⏱24633). /view_1378',
  'You are Member of 🏆 alliance [HIM] Her Infernal Majesty (♟37653 🏅15). /alliance_him',
].join('\n');

const identityMessages = [
  { direction: 'out', userId: 945253890, text: PROFILE, ts: new Date(2000) },
  { direction: 'out', userId: 945253890, text: 'You are 👑 Duke [HIM]RickN (♟5000 ⏱2842), ranked 🏅4', ts: new Date(3000) },
  { direction: 'out', userId: 111, text: 'You are 🤶 Count [AOW]ChenWu (♟900 ⏱100), ranked 🏅80', ts: new Date(1000) },
  { direction: 'out', userId: 333, text: 'You are 🤶 Baron Solomon (♟12 ⏱3), ranked 🏅900', ts: new Date(1000) },
  { direction: 'out', userId: 222, text: 'You are already the highest bidder.', ts: new Date(1000) },
  { direction: 'in', userId: 444, text: 'You are 🤶 Duke Faker (♟1 ⏱1), ranked 🏅1', ts: new Date(1000) },
];

const identities = buildIdentities(identityMessages);

const rick = identities.get(945253890);
assert.strictEqual(rick.name, 'RickN');
assert.strictEqual(rick.alliance, 'HIM');
assert.strictEqual(rick.title, 'Duke', 'Most recent profile should win as the player ranks up');
assert.strictEqual(rick.emoji, '👑');

assert.strictEqual(identities.get(111).name, 'ChenWu');
assert.strictEqual(identities.get(111).alliance, 'AOW');

assert.strictEqual(identities.get(333).name, 'Solomon', 'Players without an alliance tag still resolve');
assert.strictEqual(identities.get(333).alliance, null);

assert.strictEqual(identities.get(222), undefined, '"You are already…" is not a profile');
assert.strictEqual(identities.get(444), undefined, 'Incoming messages are never profiles');
assert.strictEqual(identities.size, 3, 'Only the vassal-of/alliance-free profiles are captured');

const resolved = resolvePlayer(945253890, identities.get(945253890), 'Rick');
assert.strictEqual(resolved.label, 'RickN');
assert.strictEqual(resolved.emoji, '👑');
assert.strictEqual(resolved.resolved, true);

const fallback = resolvePlayer(222, identities.get(222), 'Icyman');
assert.strictEqual(fallback.label, 'Icyman', 'Falls back to the Telegram username');
assert.strictEqual(fallback.emoji, null);
assert.strictEqual(fallback.initial, 'I');
assert.strictEqual(fallback.resolved, false);

const anonymous = resolvePlayer(777, undefined, null);
assert.strictEqual(anonymous.label, '777', 'Falls back to the user id when there is no username');

console.log('✓ In-game identity extraction');

// ---------------------------------------------------------------- callback --
assert.deepStrictEqual(decodeCallback('raid_seize_42261_90016_2'), {
  raw: 'raid_seize_42261_90016_2',
  action: 'raid seize',
  args: ['42261', '90016', '2'],
});
assert.deepStrictEqual(decodeCallback('view_1745_100').args, ['1745', '100']);
assert.strictEqual(decodeCallback('heal_army_seize_42261_90016').action, 'heal army seize');
assert.deepStrictEqual(decodeCallback('build_cancel_cancel').args, [], 'Word-only data has no args');
assert.strictEqual(decodeCallback('build_cancel_cancel').action, 'build cancel cancel');
assert.strictEqual(decodeCallback('seize_42261_90016_2_!').args.at(-1), '!');
assert.strictEqual(decodeCallback('42261_2').action, '42261_2', 'Leading-numeric data is left verbatim');
assert.strictEqual(decodeCallback('').action, '');
assert.strictEqual(decodeCallback(null).raw, '');

console.log('✓ Callback query decoding');

// ------------------------------------------------------------------- stats --
assert.strictEqual(baseCommand('/seize_42261_90016'), '/seize');
assert.strictEqual(baseCommand('/heal_army'), '/heal_army', 'Non-numeric tails are kept');
assert.strictEqual(baseCommand('/view_1745'), '/view');
assert.strictEqual(baseCommand('Me'), null);
assert.strictEqual(baseCommand(''), null);

const statMessages = [
  { direction: 'in', kind: 'message', text: '/seize_1_2', ts: new Date(1000) },
  { direction: 'out', kind: 'message', text: 'You are about to seize…', ts: new Date(2000) },
  { direction: 'in', kind: 'callback_query', text: 'raid_seize_1_2', ts: new Date(3000) },
  { direction: 'out', kind: 'edit', text: 'Raided!', ts: new Date(4000) },
  { direction: 'in', kind: 'message', text: 'hello there', ts: new Date(5000) },
  { direction: 'in', kind: 'message', text: '/seize_9_9', ts: new Date(6000) },
];

assert.deepStrictEqual(
  statMessages.map(categorize),
  ['commands', 'replies', 'callbacks', 'edits', 'player', 'commands'],
  'Every message lands in exactly one filter category'
);

const stats = computeStats(statMessages);
assert.strictEqual(stats.total, 6);
assert.strictEqual(stats.incoming, 4);
assert.strictEqual(stats.outgoing, 2);
assert.strictEqual(stats.commands, 2);
assert.strictEqual(stats.callbacks, 1);
assert.strictEqual(stats.edits, 1);
assert.deepStrictEqual(stats.topCommands, [{ command: '/seize', count: 2 }]);
assert.strictEqual(stats.firstSeen.getTime(), 1000);
assert.strictEqual(stats.lastSeen.getTime(), 6000);

const empty = computeStats([]);
assert.strictEqual(empty.total, 0);
assert.strictEqual(empty.firstSeen, null);

console.log('✓ Category and stat computation');
console.log('All viewer utility tests passed.');
