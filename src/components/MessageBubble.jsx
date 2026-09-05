import { useState } from 'react';
import { formatTime, formatElapsed } from '../utils/format';
import { decodeCallback } from '../utils/callback';

// Long bot dumps (the profile block runs ~25 lines) are clamped so a single
// message can't own the whole viewport while scrolling.
const CLAMP_LINES = 14;

export default function MessageBubble({ message, elapsedMs, query }) {
    const { direction, kind, text, ts } = message;
    const [expanded, setExpanded] = useState(false);

    const lines = text ? text.split('\n') : [];
    const clamped = lines.length > CLAMP_LINES && !expanded;
    const shown = clamped ? lines.slice(0, CLAMP_LINES).join('\n') : text;

    return (
        <div className={`msg ${direction}${kind ? ` kind-${kind}` : ''}`}>
            <div className="msg-gutter">
                <span className="msg-clock">{formatTime(ts)}</span>
                {elapsedMs != null && elapsedMs > 0 && (
                    <span className="msg-delta">{formatElapsed(elapsedMs)}</span>
                )}
            </div>

            <div className="msg-body">
                {kind === 'callback_query'
                    ? <CallbackPill data={text} />
                    : (
                        <div className="bubble">
                            {text
                                ? <span className="bubble-text"><Highlight text={shown} query={query} /></span>
                                : <span className="bubble-text muted">(no text)</span>}

                            {clamped && (
                                <button className="clamp-toggle" onClick={() => setExpanded(true)}>
                                    Show {lines.length - CLAMP_LINES} more lines
                                </button>
                            )}
                            {expanded && lines.length > CLAMP_LINES && (
                                <button className="clamp-toggle" onClick={() => setExpanded(false)}>
                                    Collapse
                                </button>
                            )}

                            {kind === 'edit' && <span className="edit-tag">edited</span>}
                        </div>
                    )}
            </div>
        </div>
    );
}

/**
 * Renders raid_seize_42261_90016_2 as a readable action plus argument chips.
 * The raw string stays in the tooltip and is copied on click, so it remains
 * greppable against the original log.
 */
function CallbackPill({ data }) {
    const { raw, action, args } = decodeCallback(data);
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard?.writeText(raw).then(
            () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
            },
            () => {}
        );
    };

    return (
        <button className="callback-pill" onClick={copy} title={`${raw}\n(click to copy)`}>
            <span className="callback-icon">◉</span>
            <span className="callback-action">{action}</span>
            {args.map((arg, i) => (
                <span key={i} className="callback-arg">{arg}</span>
            ))}
            {copied && <span className="callback-copied">copied</span>}
        </button>
    );
}

function Highlight({ text, query }) {
    if (!query || !text) return text ?? null;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
            ? <mark key={i}>{part}</mark>
            : part
    );
}
