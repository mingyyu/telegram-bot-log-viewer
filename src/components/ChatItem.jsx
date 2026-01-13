import Avatar from './Avatar';
import { formatTime, truncate } from '../utils/format';

export default function ChatItem({ chat, active, onClick }) {
    const lastMessage = chat.messages[chat.messages.length - 1];
    const lastTime = lastMessage?.ts;
    const preview = lastMessage?.text || '(no text)';

    return (
        <div
            className={`chat-item ${active ? 'active' : ''}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
        >
            <Avatar name={chat.username} userId={chat.userId} />

            <div className="chat-info">
                <div className="chat-top-row">
                    <span className="chat-name">{chat.username}</span>
                    <span className="chat-time">
                        {lastTime ? formatTime(lastTime) : ''}
                    </span>
                </div>
                <div className="chat-preview">
                    {lastMessage?.kind === 'callback_query' && '🔘 '}
                    {truncate(preview, 45)}
                </div>
            </div>

            <span className="message-count">{chat.messages.length}</span>
        </div>
    );
}
