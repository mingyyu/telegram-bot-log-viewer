import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { parseLogs } from './parser';
import { getInitialTheme, saveTheme, applyTheme } from './utils/theme';
import { SunIcon, MoonIcon, UploadIcon, MessageIcon } from './components/Icons';
import SearchBar from './components/SearchBar';
import ChatItem from './components/ChatItem';
import Avatar from './components/Avatar';
import MessageList from './components/MessageList';

export default function App() {
  // State
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // Apply theme on mount and change
  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Handle file input
  const handleFile = useCallback((file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseLogs(reader.result);
      setMessages(parsed);
      setSearchQuery('');
      setMessageSearch('');
    };
    reader.readAsText(file);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
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
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.log'))) {
      handleFile(file);
    }
  };

  // Build chat list from messages
  useEffect(() => {
    const map = new Map();

    for (const m of messages) {
      const key = m.userId ?? 'unknown';

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

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;

    const query = searchQuery.toLowerCase();
    return chats.filter(chat =>
      chat.username.toLowerCase().includes(query) ||
      String(chat.userId).includes(query) ||
      chat.messages.some(m => m.text?.toLowerCase().includes(query))
    );
  }, [chats, searchQuery]);

  // Current selected chat
  const currentChat = chats.find(c => c.userId === selectedUserId);

  return (
    <div
      className="app"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>📋 Log Viewer</h1>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search users or messages..."
        />

        {/* Upload button */}
        <div style={{ padding: '0 12px 12px' }}>
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <UploadIcon />
            Upload Log File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.log"
            onChange={handleFileChange}
            className="hidden-input"
          />
        </div>

        {/* Chat list */}
        <div className="chat-list">
          {filteredChats.length === 0 && searchQuery && (
            <div className="no-results">
              <p>No users matching "{searchQuery}"</p>
            </div>
          )}

          {filteredChats.map(chat => (
            <ChatItem
              key={chat.userId}
              chat={chat}
              active={chat.userId === selectedUserId}
              onClick={() => {
                setSelectedUserId(chat.userId);
                setMessageSearch('');
              }}
            />
          ))}
        </div>
      </aside>

      {/* Main Chat View */}
      <main className="chat-view">
        {!currentChat && (
          <div className="empty-state">
            <MessageIcon />
            <h2>Telegram Bot Log Viewer</h2>
            <p>
              Upload a log file to view conversations.
              Drag and drop or click the upload button.
            </p>
          </div>
        )}

        {currentChat && (
          <>
            {/* Chat header */}
            <div className="chat-header">
              <Avatar
                name={currentChat.username}
                userId={currentChat.userId}
                size="small"
              />
              <div className="chat-header-info">
                <div className="chat-header-name">{currentChat.username}</div>
                <div className="chat-header-status">
                  ID: {currentChat.userId} • {currentChat.messages.length} messages
                </div>
              </div>

              {/* Message search within chat */}
              <div style={{ width: 250 }}>
                <SearchBar
                  value={messageSearch}
                  onChange={setMessageSearch}
                  placeholder="Search in chat..."
                />
              </div>
            </div>

            {/* Messages */}
            <MessageList
              messages={currentChat.messages}
              searchQuery={messageSearch}
            />
          </>
        )}

        {/* Drop zone overlay */}
        <div className={`drop-zone ${isDragging ? 'active' : ''}`}>
          <UploadIcon />
          <p>Drop log file here</p>
        </div>
      </main>
    </div>
  );
}
