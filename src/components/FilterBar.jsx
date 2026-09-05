import { CATEGORIES } from '../utils/stats';
import { formatCount } from '../utils/format';

export default function FilterBar({ filters, counts, onToggle, onReset }) {
    const allOn = CATEGORIES.every(c => filters[c.id]);

    return (
        <div className="filter-bar">
            <span className="filter-label">Show</span>

            {CATEGORIES.map(c => {
                const count = counts[c.id] ?? 0;
                return (
                    <button
                        key={c.id}
                        className={`chip chip-${c.id}${filters[c.id] ? ' on' : ''}`}
                        onClick={() => onToggle(c.id)}
                        aria-pressed={filters[c.id]}
                        disabled={count === 0}
                        title={count === 0 ? `No ${c.label.toLowerCase()} in this chat` : undefined}
                    >
                        {c.label}
                        <span className="chip-count">{formatCount(count)}</span>
                    </button>
                );
            })}

            {!allOn && (
                <button className="filter-reset" onClick={onReset}>Reset</button>
            )}
        </div>
    );
}
