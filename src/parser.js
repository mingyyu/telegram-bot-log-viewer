// src/parser.js
// Robust parser: groups multiline log entries and extracts incoming/outgoing messages
const TIMESTAMP_RE = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}/;

export function parseLogs(text) {
  // 1) Split into entries: every line that starts with a timestamp begins a new entry.
  const lines = text.split(/\r?\n/);
  const entries = [];
  let current = null;

  for (const raw of lines) {
    if (TIMESTAMP_RE.test(raw)) {
      // New entry
      if (current) entries.push(current);
      current = { rawLines: [raw] };
    } else {
      // Continuation of previous entry (multiline JSON or other output)
      if (current) current.rawLines.push(raw);
      else {
        // stray line before any timestamp — skip or attach to last entry
      }
    }
  }
  if (current) entries.push(current);

  // 2) Process entries
  const messages = [];
  for (const entry of entries) {
    const joined = entry.rawLines.join("\n").trim();

    // Extract the leading timestamp and the rest (first space after timestamp)
    const m = joined.match(/^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})\s+(.*)$/s);
    if (!m) continue;
    const [, tsText, rest] = m;
    const entryTs = new Date(tsText.replace(/\//g, "-"));

    // handle getUpdates response (incoming user updates and callback_query)
    if (rest.startsWith("Endpoint: getUpdates, response:")) {
      const jsonText = rest.replace("Endpoint: getUpdates, response:", "").trim();
      try {
        const data = JSON.parse(jsonText);
        for (const upd of data.result ?? []) {
          // normal message
          if (upd.message) {
            const msg = upd.message;
            messages.push({
              direction: "in",
              kind: "message",
              userId: msg.chat?.id ?? msg.from?.id,
              username: msg.from?.username,
              name: msg.from?.first_name,
              text: msg.text ?? "",
              ts: new Date((msg.date ?? Math.floor(entryTs.getTime()/1000)) * 1000),
              raw: joined,
              entities: msg.entities ?? null,
            });
          }

          // callback_query (button presses) — treat as incoming from user
          if (upd.callback_query) {
            const cb = upd.callback_query;
            messages.push({
              direction: "in",
              kind: "callback_query",
              userId: cb.from?.id,
              username: cb.from?.username,
              name: cb.from?.first_name,
              text: cb.data ?? (cb.message?.text ?? ""),
              ts: new Date((cb.message?.date ?? Math.floor(entryTs.getTime()/1000)) * 1000),
              raw: joined,
              callback_message: cb.message ? {
                id: cb.message.message_id,
                text: cb.message.text,
              } : null,
            });
          }

          // other update types can be added here if needed (edited_message, etc.)
        }
      } catch (e) {
        // if JSON parse fails, skip — but we attempted robust multiline assembling so this should rarely happen
        // You could log e and joined to debug.
      }
    }

    // handle sendMessage response (confirmed outgoing bot message)
    if (rest.startsWith("Endpoint: sendMessage, response:")) {
      const jsonText = rest.replace("Endpoint: sendMessage, response:", "").trim();
      try {
        const data = JSON.parse(jsonText);
        const msg = data.result;
        if (msg) {
          messages.push({
            direction: "out",
            kind: "message",
            userId: msg.chat?.id,
            username: msg.chat?.username,
            name: msg.chat?.first_name,
            text: msg.text ?? "",
            ts: new Date((msg.date ?? Math.floor(entryTs.getTime()/1000)) * 1000),
            raw: joined,
            entities: msg.entities ?? null,
          });
        }
      } catch (e) {
        // ignore parse failure
      }
    }

    // optional: handle other endpoints like editMessageText response, answerCallbackQuery, etc.
    if (rest.startsWith("Endpoint: editMessageText, response:")) {
      const jsonText = rest.replace("Endpoint: editMessageText, response:", "").trim();
      try {
        const data = JSON.parse(jsonText);
        const msg = data.result;
        if (msg) {
          messages.push({
            direction: "out",
            kind: "edit",
            userId: msg.chat?.id,
            username: msg.chat?.username,
            name: msg.chat?.first_name,
            text: msg.text ?? "",
            ts: new Date((msg.edit_date ?? msg.date ?? Math.floor(entryTs.getTime()/1000)) * 1000),
            raw: joined,
            entities: msg.entities ?? null,
          });
        }
      } catch (e) {}
    }
  }

  // final sort by timestamp
  messages.sort((a, b) => a.ts - b.ts);
  return messages;
}
