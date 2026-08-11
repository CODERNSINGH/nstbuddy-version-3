// src/components/assignments/SheetSourceFilter.tsx
import React from 'react';

interface SheetSourceFilterProps {
  sheetSources: string[];
  selectedSheetSource: string;
  onSheetSourceChange: (sheetSource: string) => void;
}

const SheetSourceFilter: React.FC<SheetSourceFilterProps> = ({ 
  sheetSources, 
  selectedSheetSource, 
  onSheetSourceChange 
}) => {
  return (
    <select
      value={selectedSheetSource}
      onChange={(e) => onSheetSourceChange(e.target.value)}
      className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      {sheetSources.map(sheetSource => (
        <option key={sheetSource} value={sheetSource}>
          {sheetSource === 'All' ? 'All Sources' : formatSheetName(sheetSource)}
        </option>
      ))}
    </select>
  );
};

// Helper function to format sheet names for display
const formatSheetName = (sheetName: string): string => {
  switch (sheetName) {
    case '100-Days-of-code':
      return '100 Days of Code';
    case 'DSA':
    case 'WAP':
      return sheetName; // Already formatted
    case 'DSA-Lab':
      return 'DSA Lab';
    case 'Maths':
      return 'Mathematics';
    case 'Maths-Lab':
      return 'Mathematics Lab';
    case 'WAP-Lab':
      return 'WAP Lab';
    default:
      return sheetName;
  }
};

export default SheetSourceFilter;