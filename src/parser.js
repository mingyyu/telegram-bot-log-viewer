const LINE_RE = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) (.*)$/;

export function parseLogs(text) {
  const messages = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(LINE_RE);
    if (!match) continue;

    const [, ts, content] = match;
    const fallbackTs = new Date(ts.replace(/\//g, "-"));

    if (content.startsWith("Endpoint: getUpdates, response:")) {
      parseIncoming(content, messages);
    }

    if (content.startsWith("Endpoint: sendMessage, response:")) {
      parseOutgoing(content, messages);
    }
  }

  return messages.sort((a, b) => a.ts - b.ts);
}

function parseIncoming(content, messages) {
  const jsonText = content.replace(
    "Endpoint: getUpdates, response:",
    ""
  ).trim();

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return;
  }

  for (const upd of data.result ?? []) {
    if (!upd.message?.text) continue;

    messages.push({
      direction: "in",
      userId: upd.message.chat.id,
      username: upd.message.from.username,
      name: upd.message.from.first_name,
      text: upd.message.text,
      ts: new Date(upd.message.date * 1000),
    });
  }
}

function parseOutgoing(content, messages) {
  const jsonText = content.replace(
    "Endpoint: sendMessage, response:",
    ""
  ).trim();

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return;
  }

  const msg = data.result;
  if (!msg?.text) return;

  messages.push({
    direction: "out",
    userId: msg.chat.id,
    username: msg.chat.username,
    name: msg.chat.first_name,
    text: msg.text,
    ts: new Date(msg.date * 1000),
  });
}
