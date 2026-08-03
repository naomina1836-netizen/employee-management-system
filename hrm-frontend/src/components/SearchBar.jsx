import { useState } from "react";

function SearchBar({ onSearch, placeholder = "Search..." }) {
    const [keyword, setKeyword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(keyword);
    };

    const handleClear = () => {
        setKeyword("");
        onSearch("");
    };

    return (
        <form onSubmit={handleSubmit} className="search-bar">
            <div className="search-input-wrapper">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="search-input"
                />
                {keyword && (
                    <button type="button" onClick={handleClear} className="search-clear">
                        ×
                    </button>
                )}
            </div>
            <button type="submit" className="search-btn">Search</button>
        </form>
    );
}

export default SearchBar;