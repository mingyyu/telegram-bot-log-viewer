// Per-player counts shown in the detail panel and used for list sorting.

/**
 * Normalise a command to its base form so the "top commands" list groups
 * parameterised variants together:
 *   /seize_42261_90016 -> /seize      /view_1745 -> /view
 *   /heal_army         -> /heal_army  (no numeric tail to strip)
 */
export function baseCommand(text) {
  if (!text || text[0] !== '/') return null;
  const token = text.split(/\s+/, 1)[0];
  const parts = token.split('_');
  while (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) parts.pop();
  return parts.join('_');
}

/**
 * Every message falls into exactly one category, which drives the filter chips.
 * Edits are checked first because the bot's own messages can be edits too.
 */
export function categorize(message) {
  if (message.kind === 'edit') return 'edits';
  if (message.kind === 'callback_query') return 'callbacks';
  if (message.direction === 'out') return 'replies';
  return baseCommand(message.text) ? 'commands' : 'player';
}

export function isCommand(message) {
  return categorize(message) === 'commands';
}

export const CATEGORIES = [
  { id: 'commands', label: 'Commands' },
  { id: 'player', label: 'Player text' },
  { id: 'replies', label: 'Bot replies' },
  { id: 'callbacks', label: 'Callbacks' },
  { id: 'edits', label: 'Edits' },
];

export function computeStats(messages) {
  const commandCounts = new Map();
  let incoming = 0;
  let outgoing = 0;
  let commands = 0;
  let callbacks = 0;
  let edits = 0;

  for (const m of messages) {
    if (m.direction === 'in') incoming++;
    else outgoing++;

    if (m.kind === 'callback_query') callbacks++;
    else if (m.kind === 'edit') edits++;

    if (isCommand(m)) {
      commands++;
      const base = baseCommand(m.text);
      commandCounts.set(base, (commandCounts.get(base) ?? 0) + 1);
    }
  }

  const topCommands = Array.from(commandCounts, ([command, count]) => ({ command, count }))
    .sort((a, b) => b.count - a.count || a.command.localeCompare(b.command));

  return {
    total: messages.length,
    incoming,
    outgoing,
    commands,
    callbacks,
    edits,
    topCommands,
    firstSeen: messages.length ? messages[0].ts : null,
    lastSeen: messages.length ? messages[messages.length - 1].ts : null,
  };
}
