import { useState } from 'react';
import Avatar from './Avatar';
import { formatShortDateTime, formatSpan, formatCount } from '../utils/format';

export default function DetailPanel({ chat, onCommandClick }) {
    const { player, stats } = chat;
    const [showProfile, setShowProfile] = useState(false);

    const span = stats.firstSeen && stats.lastSeen ? stats.lastSeen - stats.firstSeen : 0;

    return (
        <aside className="detail">
            <div className="detail-identity">
                <Avatar player={player} size="large" />
                <div className="detail-name">{player.label}</div>
                {player.title && <div className="detail-title">{player.title}</div>}
                {player.alliance && <span className="alliance-chip">{player.alliance}</span>}
                {!player.resolved && (
                    <div className="detail-unresolved" title="No 'Me' profile reply found for this player in the log">
                        Telegram name — no in-game profile in log
                    </div>
                )}
            </div>

            <Section title="Identity">
                <Field label="User ID" value={String(player.userId)} mono />
                {player.username && <Field label="Telegram" value={player.username} />}
            </Section>

            <Section title="Volume">
                <Field label="Messages" value={formatCount(stats.total)} />
                <Field label="From player" value={formatCount(stats.incoming)} />
                <Field label="From bot" value={formatCount(stats.outgoing)} />
                <Field label="Commands" value={formatCount(stats.commands)} />
                <Field label="Callbacks" value={formatCount(stats.callbacks)} />
                <Field label="Edits" value={formatCount(stats.edits)} />
            </Section>

            <Section title="Activity">
                <Field label="First seen" value={formatShortDateTime(stats.firstSeen)} mono />
                <Field label="Last seen" value={formatShortDateTime(stats.lastSeen)} mono />
                <Field label="Span" value={span ? formatSpan(span) : '—'} />
            </Section>

            {stats.topCommands.length > 0 && (
                <Section title="Top commands">
                    <div className="cmd-list">
                        {stats.topCommands.slice(0, 10).map(({ command, count }) => (
                            <button
                                key={command}
                                className="cmd-row"
                                onClick={() => onCommandClick(command)}
                                title={`Search this chat for ${command}`}
                            >
                                <span className="cmd-name">{command}</span>
                                <span className="cmd-bar">
                                    <span
                                        className="cmd-fill"
                                        style={{ width: `${(count / stats.topCommands[0].count) * 100}%` }}
                                    />
                                </span>
                                <span className="cmd-count">{formatCount(count)}</span>
                            </button>
                        ))}
                    </div>
                </Section>
            )}

            {player.profileText && (
                <Section title="Latest profile">
                    <button className="clamp-toggle" onClick={() => setShowProfile(v => !v)}>
                        {showProfile ? 'Hide' : 'Show'} raw profile
                    </button>
                    {showProfile && <pre className="profile-dump">{player.profileText}</pre>}
                </Section>
            )}
        </aside>
    );
}

function Section({ title, children }) {
    return (
        <section className="detail-section">
            <h3>{title}</h3>
            {children}
        </section>
    );
}

function Field({ label, value, mono }) {
    return (
        <div className="field">
            <span className="field-label">{label}</span>
            <span className={`field-value${mono ? ' mono' : ''}`}>{value}</span>
        </div>
    );
}
