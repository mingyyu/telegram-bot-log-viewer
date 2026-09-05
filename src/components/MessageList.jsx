import { useMemo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import { formatDate, formatSpan, formatCount } from '../utils/format';
import { categorize } from '../utils/stats';

// Chats run to a few thousand messages. Rather than mount every node, render a
// trailing window and extend it as the user scrolls back — which matches how a
// chat is read anyway.
const WINDOW = 250;

// Gaps at or above this get their own divider, marking session boundaries.
const GAP_MS = 5 * 60 * 1000;

export default function MessageList({ messages, query, filters, selectedUserId }) {
    const containerRef = useRef(null);
    const heightBeforeGrow = useRef(0);
    const [limit, setLimit] = useState(WINDOW);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return messages.filter(m => {
            if (!filters[categorize(m)]) return false;
            if (q && !m.text?.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [messages, query, filters]);

    // Restart the window whenever the visible set changes for a new reason.
    useEffect(() => { setLimit(WINDOW); }, [selectedUserId, query, filters]);

    const visible = filtered.slice(Math.max(0, filtered.length - limit));
    const hiddenAbove = filtered.length - visible.length;

    // Interleave date separators, long-gap dividers and messages, and attach the
    // elapsed time from the previous *unfiltered-out* message.
    const items = useMemo(() => {
        const out = [];
        let prevTs = null;

        for (const msg of visible) {
            if (!prevTs || !sameDay(msg.ts, prevTs)) {
                out.push({ type: 'date', key: `d-${msg.ts.getTime()}`, date: msg.ts });
            } else {
                const gap = msg.ts - prevTs;
                if (gap >= GAP_MS) {
                    out.push({ type: 'gap', key: `g-${msg.ts.getTime()}`, gap });
                }
            }

            out.push({
                type: 'msg',
                key: `${msg.ts.getTime()}-${out.length}`,
                data: msg,
                elapsedMs: prevTs && sameDay(msg.ts, prevTs) ? msg.ts - prevTs : null,
            });
            prevTs = msg.ts;
        }
        return out;
    }, [visible]);

    // Land at the newest message when switching players or loading a file.
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [selectedUserId, messages]);

    // Growing the window prepends content; keep the reader where they were.
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el || !heightBeforeGrow.current) return;
        el.scrollTop += el.scrollHeight - heightBeforeGrow.current;
        heightBeforeGrow.current = 0;
    }, [limit]);

    const handleScroll = (e) => {
        const el = e.currentTarget;
        if (el.scrollTop < 240 && limit < filtered.length) {
            heightBeforeGrow.current = el.scrollHeight;
            setLimit(l => l + WINDOW);
        }
    };

    if (filtered.length === 0) {
        return (
            <div className="messages" ref={containerRef}>
                <div className="no-results">
                    <p>{query
                        ? `No messages matching "${query}"`
                        : 'No messages match the active filters.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="messages" ref={containerRef} onScroll={handleScroll}>
            {hiddenAbove > 0 && (
                <div className="window-notice">
                    Scroll up to load {formatCount(hiddenAbove)} earlier message
                    {hiddenAbove === 1 ? '' : 's'}
                </div>
            )}

            {items.map(item => {
                if (item.type === 'date') {
                    return (
                        <div key={item.key} className="date-sep">
                            <span>{formatDate(item.date)}</span>
                        </div>
                    );
                }
                if (item.type === 'gap') {
                    return (
                        <div key={item.key} className="gap-sep">
                            <span>{formatSpan(item.gap)} later</span>
                        </div>
                    );
                }
                return (
                    <MessageBubble
                        key={item.key}
                        message={item.data}
                        elapsedMs={item.elapsedMs}
                        query={query.trim()}
                    />
                );
            })}
        </div>
    );
}

function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}
