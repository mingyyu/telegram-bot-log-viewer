// Callback-query decoding.
//
// Raw callback data is snake_case with numeric arguments appended:
//
//   raid_seize_42261_90016_2  ->  "raid seize"   args 42261 · 90016 · 2
//   heal_army_seize_42261     ->  "heal army seize"  args 42261
//   view_1745_100             ->  "view"         args 1745 · 100
//   build_cancel_cancel       ->  "build cancel cancel"
//
// Rule: the leading run of non-numeric segments is the action; everything from
// the first numeric segment onward is an argument. The raw string is always
// kept so it stays greppable and copyable.

const NUMERIC = /^\d+$/;

export function decodeCallback(data) {
  const raw = data == null ? '' : String(data);
  if (!raw) return { raw: '', action: '', args: [] };

  const parts = raw.split('_');
  const words = [];
  const args = [];

  for (const part of parts) {
    if (args.length === 0 && part !== '' && !NUMERIC.test(part)) words.push(part);
    else if (part !== '') args.push(part);
  }

  // Data with no leading word at all (e.g. "42261_2") stays as-is rather than
  // rendering an empty action.
  if (words.length === 0) return { raw, action: raw, args: [] };

  return { raw, action: words.join(' '), args };
}
