import { useState } from "react";
import { parseLogs } from "./parser";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseLogs(reader.result);
      setMessages(parsed);
      setSelected(parsed[0]?.userId ?? null);
    };
    reader.readAsText(file);
  }

  const chats = [...new Map(messages.map(m => [m.userId, m])).values()];
  const current = messages.filter(m => m.userId === selected);

  return (
    <div className="app">
      <aside>
        <h2>Chats</h2>
        <input type="file" accept=".txt,.log" onChange={handleFile} />
        {chats.map(c => (
          <div
            key={c.userId}
            className={c.userId === selected ? "chat active" : "chat"}
            onClick={() => setSelected(c.userId)}
          >
            {c.username || c.name || c.userId}
          </div>
        ))}
      </aside>

      <main>
        {current.map((m, i) => (
          <div key={i} className={`msg ${m.direction}`}>
            <div className="time">{m.ts.toLocaleString()}</div>
            <div className="bubble">{m.text}</div>
          </div>
        ))}
      </main>
    </div>
  );
}
