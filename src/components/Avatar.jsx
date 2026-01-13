import { getAvatarColor, getInitials } from '../utils/format';

export default function Avatar({ name, userId, size = 'normal' }) {
    const initials = getInitials(name);
    const color = getAvatarColor(userId);

    const sizeClass = size === 'small' ? 'avatar avatar-small' : 'avatar';

    return (
        <div
            className={sizeClass}
            style={{ background: color }}
            title={name}
        >
            {initials}
        </div>
    );
}
