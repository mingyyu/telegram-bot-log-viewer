// src/parser.js
// Robust parser: groups multiline log entries and extracts incoming/outgoing messages
// Supports both legacy telegram-bot-api/v5 logs ("Endpoint: ..., response: ...")
// and new go-telegram/bot logs ("[TGBOT] [DEBUG] response from '<url>' with payload '...'").

const TIMESTAMP_RE = /^\d{4}[/-]\d{2}[/-]\d{2}[T ]\d{2}:\d{2}:\d{2}/;

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
    }
  }
  if (current) entries.push(current);

  // 2) Process entries
  const messages = [];
  for (const entry of entries) {
    const joined = entry.rawLines.join("\n").trim();

    // Extract the leading timestamp and the rest (first space after timestamp)
    const m = joined.match(/^(\d{4}[/-]\d{2}[/-]\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+(.*)$/s);
    if (!m) continue;
    const [, tsText, rawRest] = m;
    const entryTs = new Date(tsText.replace(/\//g, "-"));

    // Handle optional secondary timestamp (e.g. docker logs prepending an ISO timestamp before Go's standard logger)
    let rest = rawRest;
    const secondTs = rest.match(/^(\d{4}[/-]\d{2}[/-]\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+(.*)$/s);
    if (secondTs) {
      rest = secondTs[2];
    }

    let endpoint = null;
    let jsonText = null;

    if (rest.includes("Endpoint: ")) {
      // Legacy telegram-bot-api/v5 format:
      // "Endpoint: <endpoint>, response: <json>"
      const match = rest.match(/Endpoint:\s*([a-zA-Z0-9_]+),\s*response:\s*([\s\S]*)$/);
      if (match) {
        endpoint = match[1];
        jsonText = match[2].trim();
      }
    } else if (rest.includes("with payload '")) {
      // New go-telegram/bot format:
      // "... response from '<url>' with payload '<json>'"
      const fromMarker = "response from '";
      const payloadMarker = "' with payload '";
      const fromIdx = rest.indexOf(fromMarker);
      const payloadIdx = rest.indexOf(payloadMarker);

      if (fromIdx !== -1 && payloadIdx > fromIdx) {
        const url = rest.slice(fromIdx + fromMarker.length, payloadIdx);
        // Extract method name from URL path (e.g. "https://api.telegram.org/bot***/sendMessage" -> "sendMessage")
        endpoint = url.split("/").pop();

        let rawPayload = rest.slice(payloadIdx + payloadMarker.length).trimEnd();
        if (rawPayload.endsWith("'")) {
          rawPayload = rawPayload.slice(0, -1);
        }
        jsonText = rawPayload.trim();
      }
    }

    if (!endpoint || !jsonText) continue;

    let data;
    try {
      data = JSON.parse(jsonText);
    } catch {
      continue;
    }

    if (!data || !data.ok) continue;

    // Handle incoming updates (messages, edited messages, callback queries)
    if (endpoint === "getUpdates") {
      for (const upd of data.result ?? []) {
        // Normal incoming message
        if (upd.message) {
          const msg = upd.message;
          messages.push({
            direction: "in",
            kind: "message",
            userId: msg.chat?.id ?? msg.from?.id,
            username: msg.from?.username ?? msg.chat?.title,
            name: msg.from?.first_name ?? msg.chat?.title,
            text: msg.text ?? msg.caption ?? "",
            ts: new Date((msg.date ?? Math.floor(entryTs.getTime() / 1000)) * 1000),
            raw: joined,
            entities: msg.entities ?? null,
          });
        }

        // Incoming edited message
        if (upd.edited_message) {
          const msg = upd.edited_message;
          messages.push({
            direction: "in",
            kind: "edit",
            userId: msg.chat?.id ?? msg.from?.id,
            username: msg.from?.username ?? msg.chat?.title,
            name: msg.from?.first_name ?? msg.chat?.title,
            text: msg.text ?? msg.caption ?? "",
            ts: new Date((msg.edit_date ?? msg.date ?? Math.floor(entryTs.getTime() / 1000)) * 1000),
            raw: joined,
            entities: msg.entities ?? null,
          });
        }

        // Callback query (inline button clicks)
        if (upd.callback_query) {
          const cb = upd.callback_query;
          messages.push({
            direction: "in",
            kind: "callback_query",
            userId: cb.from?.id ?? cb.message?.chat?.id,
            username: cb.from?.username,
            name: cb.from?.first_name,
            text: cb.data ?? (cb.message?.text ?? ""),
            ts: new Date((cb.message?.date ?? Math.floor(entryTs.getTime() / 1000)) * 1000),
            raw: joined,
            callback_message: cb.message ? {
              id: cb.message.message_id,
              text: cb.message.text,
            } : null,
          });
        }
      }
      continue;
    }

    // Outgoing bot messages: sendMessage, sendRichMessage, sendPhoto, etc.
    const isSendMethod = endpoint === "sendMessage" || endpoint === "sendRichMessage" || (endpoint && endpoint.startsWith("send"));
    const isEditMethod = endpoint === "editMessageText" || (endpoint && endpoint.startsWith("editMessage"));

    if (isSendMethod) {
      const msg = data.result;
      if (msg && typeof msg === "object" && msg.chat) {
        messages.push({
          direction: "out",
          kind: "message",
          userId: msg.chat.id,
          username: msg.chat.username,
          name: msg.chat.first_name ?? msg.chat.title,
          text: msg.text ?? msg.caption ?? "",
          ts: new Date((msg.date ?? Math.floor(entryTs.getTime() / 1000)) * 1000),
          raw: joined,
          entities: msg.entities ?? null,
        });
      }
    } else if (isEditMethod) {
      const msg = data.result;
      if (msg && typeof msg === "object" && msg.chat) {
        messages.push({
          direction: "out",
          kind: "edit",
          userId: msg.chat.id,
          username: msg.chat.username,
          name: msg.chat.first_name ?? msg.chat.title,
          text: msg.text ?? msg.caption ?? "",
          ts: new Date((msg.edit_date ?? msg.date ?? Math.floor(entryTs.getTime() / 1000)) * 1000),
          raw: joined,
          entities: msg.entities ?? null,
        });
      }
    }
  }

  // Final sort by timestamp
  messages.sort((a, b) => a.ts - b.ts);
  return messages;
}
