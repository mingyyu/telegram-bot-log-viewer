// Formatting utilities

/**
 * Format date to precise timestamp (to the second)
 * Output: "13/01/2026, 12:22:19"
 */
export const formatTimestamp = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';

    return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

/**
 * Format time only (for message bubbles)
 * Output: "12:22:19"
 */
export const formatTime = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';

    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

/**
 * Format date for separators
 * Output: "January 13, 2026"
 */
export const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Check if two dates are on the same day
 */
export const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

/**
 * Generate avatar color based on user ID
 */
export const getAvatarColor = (userId) => {
    const colors = [
        '#ff5c5c', '#ffb74d', '#4caf50', '#2196f3',
        '#9c27b0', '#00bcd4', '#e91e63', '#607d8b'
    ];
    const hash = String(userId).split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length];
};

/**
 * Get initials from name or username
 */
export const getInitials = (name) => {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '…';
};

/**
 * Short elapsed gap between two consecutive events.
 * Log timestamps are whole seconds, so there is no sub-second precision to show.
 * Output: "+3s", "+2m 05s", "+1h 12m"
 */
export const formatElapsed = (ms) => {
    const s = Math.round(ms / 1000);
    if (s < 60) return `+${s}s`;
    if (s < 3600) return `+${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
    return `+${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;
};

/**
 * Coarse duration for spans covering days.
 * Output: "4d 7h", "7h 12m", "12m"
 */
export const formatSpan = (ms) => {
    const s = Math.max(0, Math.round(ms / 1000));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d) return `${d}d ${h}h`;
    if (h) return `${h}h ${String(m).padStart(2, '0')}m`;
    return `${m}m`;
};

/**
 * Compact date + time for the detail panel.
 * Output: "02/09, 23:51:23"
 */
export const formatShortDateTime = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
};

/** Thousands separators for counts. */
export const formatCount = (n) => Number(n ?? 0).toLocaleString('en-US');
