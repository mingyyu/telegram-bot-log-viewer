import PlayerRow from './PlayerRow';
import SearchBar from './SearchBar';

const SORTS = [
    { id: 'recent', label: 'Recent' },
    { id: 'name', label: 'Name' },
    { id: 'messages', label: 'Messages' },
];

export default function PlayerList({
    chats,
    alliances,
    selectedUserId,
    onSelect,
    search,
    onSearchChange,
    sort,
    onSortChange,
    alliance,
    onAllianceChange,
    totalCount,
}) {
    return (
        <>
            <SearchBar
                value={search}
                onChange={onSearchChange}
                placeholder="Search players or messages…"
            />

            <div className="list-controls">
                <div className="segmented" role="group" aria-label="Sort players by">
                    {SORTS.map(s => (
                        <button
                            key={s.id}
                            className={`segment${sort === s.id ? ' active' : ''}`}
                            onClick={() => onSortChange(s.id)}
                            aria-pressed={sort === s.id}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {alliances.length > 0 && (
                    <select
                        className="alliance-select"
                        value={alliance}
                        onChange={(e) => onAllianceChange(e.target.value)}
                        aria-label="Filter by alliance"
                    >
                        <option value="all">All alliances</option>
                        {alliances.map(a => (
                            <option key={a} value={a}>[{a}]</option>
                        ))}
                        <option value="none">No alliance</option>
                    </select>
                )}
            </div>

            <div className="list-meta">
                {chats.length === totalCount
                    ? `${totalCount} player${totalCount === 1 ? '' : 's'}`
                    : `${chats.length} of ${totalCount} players`}
            </div>

            <div className="player-list">
                {chats.length === 0 && (
                    <div className="no-results">
                        <p>No players match the current filters.</p>
                    </div>
                )}

                {chats.map(chat => (
                    <PlayerRow
                        key={chat.userId}
                        chat={chat}
                        active={chat.userId === selectedUserId}
                        onClick={() => onSelect(chat.userId)}
                    />
                ))}
            </div>
        </>
    );
}
