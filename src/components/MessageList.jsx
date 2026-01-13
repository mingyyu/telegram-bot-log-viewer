import { useMemo, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { formatDate, isSameDay } from '../utils/format';

export default function MessageList({ messages, searchQuery }) {
    const containerRef = useRef(null);

    // Group messages by date
    const groupedMessages = useMemo(() => {
        const groups = [];
        let currentDate = null;

        for (const msg of messages) {
            if (!currentDate || !isSameDay(msg.ts, currentDate)) {
                currentDate = msg.ts;
                groups.push({
                    type: 'date',
                    date: msg.ts
                });
            }
            groups.push({
                type: 'message',
                data: msg
            });
        }

        return groups;
    }, [messages]);

    // Filter messages if search query exists
    const filteredItems = useMemo(() => {
        if (!searchQuery) return groupedMessages;

        const query = searchQuery.toLowerCase();
        const filtered = [];
        let lastDateAdded = null;

        for (const item of groupedMessages) {
            if (item.type === 'date') {
                lastDateAdded = item;
            } else if (item.data.text?.toLowerCase().includes(query)) {
                // Add date separator if needed
                if (lastDateAdded && !filtered.includes(lastDateAdded)) {
                    filtered.push(lastDateAdded);
                }
                filtered.push(item);
            }
        }

        return filtered;
    }, [groupedMessages, searchQuery]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages]);

    if (filteredItems.length === 0 && searchQuery) {
        return (
            <div className="messages-container" ref={containerRef}>
                <div className="no-results">
                    <p>No messages matching "{searchQuery}"</p>
                </div>
            </div>
        );
    }

    return (
        <div className="messages-container" ref={containerRef}>
            {filteredItems.map((item, index) => {
                if (item.type === 'date') {
                    return (
                        <div key={`date-${index}`} className="date-separator">
                            <span>{formatDate(item.date)}</span>
                        </div>
                    );
                }
                return <MessageBubble key={index} message={item.data} />;
            })}
        </div>
    );
}
