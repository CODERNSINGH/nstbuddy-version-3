import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange }) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Debounce search input for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trim whitespace and pass to parent
      const trimmedTerm = localSearchTerm.trim();
      onSearchChange(trimmedTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchTerm, onSearchChange]);

  // Sync with parent if searchTerm changes externally
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleClear = () => {
    setLocalSearchTerm('');
    onSearchChange('');
  };

  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search questions... (e.g., 'tower', 'case', 'trip', 'sorting')"
        value={localSearchTerm}
        onChange={(e) => setLocalSearchTerm(e.target.value)}
        className="pl-10 pr-10 w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      {localSearchTerm && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;