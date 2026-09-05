// In-game identity extraction.
//
// The bot prints a profile block when a player sends "Me". Its first line is:
//
//   You are 🤶 Marquis [HIM]RickN (♟2956 ⏱2842), ranked 🏅18 in the world…
//           ^emoji  ^title ^tag ^name  ^stats
//
// The same block also contains lines that describe *other* entities:
//
//   You are a vassal of 🤶 Duchess [HIM]Serah (♟10532 ⏱24633). /view_1378
//   You are Member of 🏆 alliance [HIM] Her Infernal Majesty (♟37653 🏅15).
//
// Requiring an emoji *immediately* after "You are " rejects both, since they
// continue with the words "a" and "Member". We also only look at outgoing
// messages, so the chat owner is always the player being described.

// One emoji, allowing a skin-tone modifier, a variation selector, and ZWJ sequences.
const PROFILE_RE =
  /^You are (\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?)*)\s*([A-Za-z]+)\s+(?:\[([^\]]+)\])?\s*(.+?)\s*\(/mu;

/**
 * Scan messages once and build userId -> in-game identity.
 * Later profiles win, so a player who ranks up shows their current title.
 */
export function buildIdentities(messages) {
  const map = new Map();

  for (const m of messages) {
    // Cheap pre-filter: skip the ~99% of messages that can't be a profile.
    if (m.direction !== 'out' || !m.text || !m.text.includes('You are ')) continue;

    const match = m.text.match(PROFILE_RE);
    if (!match) continue;

    const prev = map.get(m.userId);
    if (prev && prev.ts >= m.ts) continue;

    const [, emoji, title, alliance, name] = match;
    map.set(m.userId, {
      emoji,
      title,
      alliance: alliance || null,
      name: name.trim(),
      ts: m.ts,
      profileText: m.text,
    });
  }

  return map;
}

/**
 * Merge a parsed identity with the Telegram fallback into one display object.
 * Falls back to username + first initial exactly as the viewer did before.
 */
export function resolvePlayer(userId, identity, username) {
  const fallbackName = username || String(userId);

  if (!identity) {
    return {
      userId,
      label: fallbackName,
      emoji: null,
      initial: initialOf(fallbackName),
      alliance: null,
      title: null,
      username,
      resolved: false,
      profileText: null,
    };
  }

  return {
    userId,
    label: identity.name,
    emoji: identity.emoji,
    initial: initialOf(identity.name),
    alliance: identity.alliance,
    title: identity.title,
    username,
    resolved: true,
    profileText: identity.profileText,
  };
}

function initialOf(name) {
  if (!name) return '?';
  return String(name).trim().charAt(0).toUpperCase() || '?';
}
