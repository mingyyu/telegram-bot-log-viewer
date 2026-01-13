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
