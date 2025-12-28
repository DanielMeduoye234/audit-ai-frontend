import { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import './GlobalSearch.css';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    try {
      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(response.data.results || []);
      setIsOpen(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleResultClick = (result: any) => {
    navigate(result.path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="global-search">
      <div className="search-input-wrapper">
        <SearchIcon size={18} />
        <input
          type="text"
          placeholder="Search transactions, reports, documents..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {query && (
          <button className="clear-btn" onClick={() => { setQuery(''); setResults([]); }}>
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((result, index) => (
            <div
              key={index}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              <div className="result-icon">{result.icon}</div>
              <div className="result-content">
                <div className="result-title">{result.title}</div>
                <div className="result-subtitle">{result.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
