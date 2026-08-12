// src/components/assignments/AssignmentCard.tsx
import React from 'react';
import { Assignment } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';

interface AssignmentCardProps {
  assignment: Assignment;
  onClick: (assignment: Assignment) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow cursor-pointer p-6 space-y-4"
      onClick={() => onClick(assignment)}
    >
      <div className="flex justify-between items-start">
        <div className="flex space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {assignment.Subject || 'Unknown'}
          </span>
          
          {assignment.sheetSource && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
              {formatSheetName(assignment.sheetSource)}
            </span>
          )}
        </div>
        
        <span className="text-sm text-gray-500">
          {formatTimeAgo(assignment.date)}
        </span>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{assignment.QuestionName}</h3>
        <p className="mt-1 text-sm text-gray-500">{assignment.Topic || 'No topic provided'}</p>
      </div>
      
      <div>
        <a
          href={assignment.Link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
          onClick={(e) => e.stopPropagation()}
        >
          Open Solution
        </a>
      </div>
    </div>
  );
};

// Helper function to format sheet names
const formatSheetName = (sheetName: string): string => {
  switch (sheetName) {
    case '100-Days-of-code':
      return '100 Days';
    case 'DSA':
    case 'WAP':
      return sheetName; // Already formatted
    case 'DSA-Lab':
      return 'DSA Lab';
    case 'Maths':
      return 'Math';
    case 'Maths-Lab':
      return 'Math Lab';
    case 'WAP-Lab':
      return 'WAP Lab';
    default:
      return sheetName;
  }
};

export default AssignmentCard;