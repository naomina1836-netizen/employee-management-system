function FilterBar({ filters, onFilterChange }) {
    const handleChange = (e) => {
        onFilterChange(e.target.name, e.target.value);
    };

    return (
        <div className="filter-bar">
            {filters.map((filter) => (
                <div key={filter.name} className="filter-group">
                    <label>{filter.label}</label>
                    {filter.type === "select" ? (
                        <select
                            name={filter.name}
                            onChange={handleChange}
                            defaultValue=""
                        >
                            <option value="">All</option>
                            {filter.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={filter.type || "text"}
                            name={filter.name}
                            placeholder={filter.placeholder || ""}
                            onChange={handleChange}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

export default FilterBar;