import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';

const SearchAndFilter = ({ 
  data = [], 
  onFilteredResults, 
  searchFields = [], 
  filterOptions = {},
  placeholder = "Search...",
  showAdvancedFilters = true,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Memoized filtered and sorted results
  const filteredData = useMemo(() => {
    let results = [...data];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(item => 
        searchFields.some(field => {
          const value = getNestedValue(item, field);
          return value && value.toString().toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        results = results.filter(item => {
          const itemValue = getNestedValue(item, key);
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value || 
                 (typeof itemValue === 'string' && itemValue.toLowerCase() === value.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortBy) {
      results.sort((a, b) => {
        const aValue = getNestedValue(a, sortBy);
        const bValue = getNestedValue(b, sortBy);
        
        // Handle dates
        if (sortBy.includes('date') || sortBy.includes('Date')) {
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
        }
        
        // Handle numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle strings
        const aStr = (aValue || '').toString().toLowerCase();
        const bStr = (bValue || '').toString().toLowerCase();
        
        if (sortOrder === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return results;
  }, [data, searchTerm, filters, sortBy, sortOrder, searchFields]);

  // Helper function to get nested object values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Update parent component with filtered results
  useEffect(() => {
    if (onFilteredResults) {
      onFilteredResults(filteredData);
    }
  }, [filteredData, onFilteredResults]);

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
    setSortBy('');
    setSortOrder('asc');
    toast.success('Filters cleared');
  };

  const handleQuickSearch = (term) => {
    setSearchTerm(term);
  };

  return (
    <div className={`search-filter-container ${className}`}>
      {/* Main Search Bar */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-search-btn"
              type="button"
            >
              ×
            </button>
          )}
        </div>
        
        {showAdvancedFilters && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
            </svg>
            Filters
          </button>
        )}
      </div>

      {/* Quick Search Suggestions */}
      {searchFields.length > 0 && !searchTerm && (
        <div className="quick-search-tags">
          <span className="quick-search-label">Quick search:</span>
          {data.length > 0 && (
            <>
              <button 
                className="quick-search-tag"
                onClick={() => handleQuickSearch('workshop')}
                type="button"
              >
                Workshop
              </button>
              <button 
                className="quick-search-tag"
                onClick={() => handleQuickSearch('technical')}
                type="button"
              >
                Technical
              </button>
              <button 
                className="quick-search-tag"
                onClick={() => handleQuickSearch('academic')}
                type="button"
              >
                Academic
              </button>
            </>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && showAdvancedFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h4>Advanced Filters</h4>
            <button onClick={clearFilters} className="clear-filters-btn" type="button">
              Clear All
            </button>
          </div>
          
          <div className="filters-grid">
            {/* Dynamic Filter Options */}
            {Object.entries(filterOptions).map(([filterKey, options]) => (
              <div key={filterKey} className="filter-group">
                <label className="filter-label">
                  {filterKey.charAt(0).toUpperCase() + filterKey.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <select
                  value={filters[filterKey] || ''}
                  onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  {options.map((option) => (
                    <option key={option.value || option} value={option.value || option}>
                      {option.label || option}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Sort Options */}
            <div className="filter-group">
              <label className="filter-label">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="">Default</option>
                {searchFields.map((field) => (
                  <option key={field} value={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="filter-select"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="results-summary">
        <span className="results-count">
          {filteredData.length} {filteredData.length === 1 ? 'result' : 'results'}
          {searchTerm && (
            <span className="search-term"> for "{searchTerm}"</span>
          )}
        </span>
        
        {(searchTerm || Object.keys(filters).some(key => filters[key])) && (
          <button onClick={clearFilters} className="clear-all-btn" type="button">
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilter;