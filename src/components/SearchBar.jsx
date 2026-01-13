import { SearchIcon, XIcon } from './Icons';

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
    return (
        <div className="search-container">
            <div className="search-bar">
                <SearchIcon />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    aria-label="Search"
                />
                {value && (
                    <button
                        className="theme-toggle"
                        onClick={() => onChange('')}
                        style={{ width: 28, height: 28, fontSize: 14 }}
                        aria-label="Clear search"
                    >
                        <XIcon />
                    </button>
                )}
            </div>
        </div>
    );
}
