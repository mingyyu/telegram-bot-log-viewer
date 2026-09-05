import { getAvatarColor } from '../utils/format';

/**
 * Shows the player's in-game emoji when their profile was found in the log.
 * Otherwise falls back to the previous behaviour: first initial of the Telegram
 * username on a colour hashed from the user id.
 */
export default function Avatar({ player, size = 'normal' }) {
    const className = `avatar avatar-${size}${player.emoji ? ' avatar-emoji' : ''}`;

    if (player.emoji) {
        return (
            <div className={className} title={player.label} aria-hidden="true">
                {player.emoji}
            </div>
        );
    }

    return (
        <div
            className={className}
            style={{ background: getAvatarColor(player.userId) }}
            title={player.label}
            aria-hidden="true"
        >
            {player.initial}
        </div>
    );
}
