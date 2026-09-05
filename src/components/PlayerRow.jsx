import Avatar from './Avatar';
import { formatTime, truncate } from '../utils/format';

export default function PlayerRow({ chat, active, onClick }) {
    const { player, stats } = chat;
    const last = chat.messages[chat.messages.length - 1];

    return (
        <div
            className={`player-row${active ? ' active' : ''}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}
        >
            <Avatar player={player} />

            <div className="player-main">
                <div className="player-line">
                    <span className="player-name" title={player.label}>{player.label}</span>
                    {player.alliance && <span className="alliance-chip">{player.alliance}</span>}
                    <span className="player-time">{last ? formatTime(last.ts) : ''}</span>
                </div>
                <div className="player-line player-sub">
                    <span className="player-preview">
                        {last?.kind === 'callback_query' && <span className="preview-icon">◉</span>}
                        {truncate(last?.text || '(no text)', 38)}
                    </span>
                    <span className="player-count">{stats.total}</span>
                </div>
            </div>
        </div>
    );
}
