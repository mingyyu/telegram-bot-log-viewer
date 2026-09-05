import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { parseLogs } from './parser';
import { buildIdentities, resolvePlayer } from './utils/identity';
import { computeStats, categorize, CATEGORIES } from './utils/stats';
import { formatCount } from './utils/format';
import { getInitialTheme, saveTheme, applyTheme } from './utils/theme';
import { SunIcon, MoonIcon, UploadIcon, MessageIcon, PanelIcon } from './components/Icons';
import SearchBar from './components/SearchBar';
import PlayerList from './components/PlayerList';
import Avatar from './components/Avatar';
import MessageList from './components/MessageList';
import FilterBar from './components/FilterBar';
import DetailPanel from './components/DetailPanel';

const ALL_ON = Object.fromEntries(CATEGORIES.map(c => [c.id, true]));

export default function App() {
  const [messages, setMessages] = useState([]);
  const [fileName, setFileName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);
  const [playerSearch, setPlayerSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [alliance, setAlliance] = useState('all');
  const [filters, setFilters] = useState(ALL_ON);
  const [detailOpen, setDetailOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMessages(parseLogs(reader.result));
      setFileName(file.name);
      setPlayerSearch('');
      setMessageSearch('');
      setAlliance('all');
      setFilters(ALL_ON);
    };
    reader.readAsText(file);
  }, []);

  // ---- Drag and drop ----
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length > 0) setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (--dragCounter.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file && /\.(txt|log)$/i.test(file.name)) handleFile(file);
  };

  // ---- Derived: one pass for identities, then a chat per player ----
  const chats = useMemo(() => {
    const identities = buildIdentities(messages);
    const grouped = new Map();

    for (const m of messages) {
      const key = m.userId ?? 'unknown';
      let entry = grouped.get(key);
      if (!entry) {
        entry = { userId: key, username: null, messages: [] };
        grouped.set(key, entry);
      }
      if (!entry.username) entry.username = m.username || m.name || null;
      entry.messages.push(m);
    }

    return Array.from(grouped.values()).map(entry => ({
      userId: entry.userId,
      player: resolvePlayer(entry.userId, identities.get(entry.userId), entry.username),
      messages: entry.messages,
      stats: computeStats(entry.messages),
    }));
  }, [messages]);

  const alliances = useMemo(
    () => Array.from(new Set(chats.map(c => c.player.alliance).filter(Boolean))).sort(),
    [chats]
  );

  const visibleChats = useMemo(() => {
    let out = chats;

    if (alliance === 'none') out = out.filter(c => !c.player.alliance);
    else if (alliance !== 'all') out = out.filter(c => c.player.alliance === alliance);

    const q = playerSearch.trim().toLowerCase();
    if (q) {
      out = out.filter(c =>
        c.player.label.toLowerCase().includes(q) ||
        (c.player.username ?? '').toLowerCase().includes(q) ||
        (c.player.alliance ?? '').toLowerCase().includes(q) ||
        String(c.userId).includes(q) ||
        c.messages.some(m => m.text?.toLowerCase().includes(q))
      );
    }

    const sorted = [...out];
    if (sort === 'name') sorted.sort((a, b) => a.player.label.localeCompare(b.player.label));
    else if (sort === 'messages') sorted.sort((a, b) => b.stats.total - a.stats.total);
    else sorted.sort((a, b) => b.stats.lastSeen - a.stats.lastSeen);
    return sorted;
  }, [chats, alliance, playerSearch, sort]);

  // Keep a valid selection: default to the most recently active player.
  useEffect(() => {
    if (chats.length === 0) {
      setSelectedUserId(null);
      return;
    }
    if (chats.some(c => c.userId === selectedUserId)) return;
    const newest = chats.reduce((a, b) => (b.stats.lastSeen > a.stats.lastSeen ? b : a));
    setSelectedUserId(newest.userId);
  }, [chats, selectedUserId]);

  const currentChat = chats.find(c => c.userId === selectedUserId) ?? null;

  const counts = useMemo(() => {
    const tally = Object.fromEntries(CATEGORIES.map(c => [c.id, 0]));
    for (const m of currentChat?.messages ?? []) tally[categorize(m)]++;
    return tally;
  }, [currentChat]);

  const selectPlayer = useCallback((userId) => {
    setSelectedUserId(userId);
    setMessageSearch('');
  }, []);

  // Arrow keys step through the player list without leaving the message pane.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      if (e.target.closest('input, select, textarea')) return;
      if (visibleChats.length === 0) return;

      e.preventDefault();
      const i = visibleChats.findIndex(c => c.userId === selectedUserId);
      const next = e.key === 'ArrowDown'
        ? Math.min(visibleChats.length - 1, i + 1)
        : Math.max(0, i - 1);
      selectPlayer(visibleChats[next].userId);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visibleChats, selectedUserId, selectPlayer]);

  const toggleFilter = (id) => setFilters(f => ({ ...f, [id]: !f[id] }));

  return (
    <div
      className={`app${detailOpen && currentChat ? ' with-detail' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-mark">◧</span>
            <div>
              <h1>Log Viewer</h1>
              {fileName && (
                <div className="brand-sub" title={fileName}>
                  {fileName} · {formatCount(messages.length)} events
                </div>
              )}
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>

        <div className="upload-row">
          <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon />
            {messages.length ? 'Load another log' : 'Upload log file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.log"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden-input"
          />
        </div>

        {messages.length > 0 && (
          <PlayerList
            chats={visibleChats}
            alliances={alliances}
            selectedUserId={selectedUserId}
            onSelect={selectPlayer}
            search={playerSearch}
            onSearchChange={setPlayerSearch}
            sort={sort}
            onSortChange={setSort}
            alliance={alliance}
            onAllianceChange={setAlliance}
            totalCount={chats.length}
          />
        )}
      </aside>

      <main className="chat-view">
        {!currentChat && (
          <div className="empty-state">
            <MessageIcon />
            <h2>Telegram Bot Log Viewer</h2>
            <p>Drop a <code>.log</code> or <code>.txt</code> file anywhere, or use the upload button.</p>
            <p className="empty-hint">
              Players are labelled by their in-game name and emoji when the log contains
              their profile reply, and by Telegram username otherwise.
            </p>
          </div>
        )}

        {currentChat && (
          <>
            <header className="chat-header">
              <Avatar player={currentChat.player} size="small" />
              <div className="chat-title">
                <div className="chat-name">
                  {currentChat.player.label}
                  {currentChat.player.alliance && (
                    <span className="alliance-chip">{currentChat.player.alliance}</span>
                  )}
                </div>
                <div className="chat-meta">
                  {currentChat.player.title && <>{currentChat.player.title} · </>}
                  {currentChat.player.username && <>@{currentChat.player.username} · </>}
                  <span className="mono">{currentChat.userId}</span> ·{' '}
                  {formatCount(currentChat.stats.total)} messages
                </div>
              </div>

              <div className="chat-search">
                <SearchBar
                  value={messageSearch}
                  onChange={setMessageSearch}
                  placeholder="Search in chat…"
                />
              </div>

              <button
                className={`icon-btn${detailOpen ? ' active' : ''}`}
                onClick={() => setDetailOpen(v => !v)}
                aria-label={`${detailOpen ? 'Hide' : 'Show'} player details`}
                title={`${detailOpen ? 'Hide' : 'Show'} player details`}
              >
                <PanelIcon />
              </button>
            </header>

            <FilterBar
              filters={filters}
              counts={counts}
              onToggle={toggleFilter}
              onReset={() => setFilters(ALL_ON)}
            />

            <MessageList
              messages={currentChat.messages}
              query={messageSearch}
              filters={filters}
              selectedUserId={selectedUserId}
            />
          </>
        )}

        <div className={`drop-zone${isDragging ? ' active' : ''}`}>
          <UploadIcon />
          <p>Drop log file here</p>
        </div>
      </main>

      {currentChat && detailOpen && (
        <DetailPanel chat={currentChat} onCommandClick={setMessageSearch} />
      )}
    </div>
  );
}
