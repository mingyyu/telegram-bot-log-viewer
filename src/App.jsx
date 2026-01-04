import { useEffect, useState } from "react";
import { parseLogs } from "./parser";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseLogs(reader.result);
      setMessages(parsed);
    };
    reader.readAsText(file);
  }

  // Build chat list whenever messages change
  useEffect(() => {
    const map = new Map();

    for (const m of messages) {
      const key = m.userId ?? "unknown";

      if (!map.has(key)) {
        map.set(key, {
          userId: key,
          username: m.username || m.name || String(key),
          messages: [],
        });
      }
      map.get(key).messages.push(m);
    }

    const chatArray = Array.from(map.values())
      .map(c => ({
        ...c,
        messages: c.messages.sort((a, b) => a.ts - b.ts),
      }))
      .sort(
        (a, b) =>
          b.messages[b.messages.length - 1].ts -
          a.messages[a.messages.length - 1].ts
      );

    setChats(chatArray);

    if (!selectedUserId && chatArray.length > 0) {
      setSelectedUserId(chatArray[0].userId);
    }
  }, [messages]);

  const currentChat = chats.find(c => c.userId === selectedUserId);

  return (
    <div className="app">
      {/* Sidebar */}
      <aside>
        <h2>Telegram Bot Logs</h2>
        <input type="file" accept=".txt,.log" onChange={handleFile} />

        <div className="chat-list">
          {chats.map(chat => (
            <div
              key={chat.userId}
              className={
                chat.userId === selectedUserId
                  ? "chat active"
                  : "chat"
              }
              onClick={() => setSelectedUserId(chat.userId)}
            >
              <div className="chat-name">
                {chat.username}
              </div>
              <div className="chat-preview">
                {chat.messages[chat.messages.length - 1]?.text?.slice(0, 40)}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat view */}
      <main>
        {!currentChat && (
          <div className="empty">Load a log file to begin</div>
        )}

        {currentChat && (
          <>
            <div className="chat-header">
              <strong>{currentChat.username}</strong>
              <span className="chat-id">ID: {currentChat.userId}</span>
            </div>

            <div className="messages">
              {currentChat.messages.map((m, i) => (
                <div
                  key={i}
                  className={`msg ${m.direction} ${m.kind || ""}`}
                >
                  <div className="time">
                    {m.ts.toLocaleString()}
                  </div>

                  <div className="bubble">
                    {/* Callback query indicator */}
                    {m.kind === "callback_query" && (
                      <div className="callback">
                        🔘 Callback
                      </div>
                    )}

                    {m.text || (
                      <span className="muted">(no text)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
