import { formatTimestamp } from '../utils/format';

export default function MessageBubble({ message }) {
    const { direction, kind, text, ts } = message;

    const bubbleClasses = `message ${direction} ${kind || ''}`.trim();

    return (
        <div className={bubbleClasses}>
            <div className="bubble">
                {/* Callback query badge */}
                {kind === 'callback_query' && (
                    <div className="callback-badge">
                        🔘 Callback Query
                    </div>
                )}

                {/* Message text */}
                {text ? (
                    <span className="message-text">{text}</span>
                ) : (
                    <span className="message-text muted">(no text)</span>
                )}

                {/* Edit badge */}
                {kind === 'edit' && (
                    <span className="edit-badge">edited</span>
                )}
            </div>

            {/* Precise timestamp to the second */}
            <div className="message-time">
                {formatTimestamp(ts)}
            </div>
        </div>
    );
}
