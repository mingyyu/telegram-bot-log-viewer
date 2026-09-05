import { SearchIcon, XIcon } from './Icons';

export default function SearchBar({ value, onChange, placeholder = 'Search…' }) {
    return (
        <div className="search-container">
            <div className="search-bar">
                <SearchIcon />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    aria-label={placeholder}
                />
                {value && (
                    <button className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
                        <XIcon />
                    </button>
                )}
            </div>
        </div>
    );
}
