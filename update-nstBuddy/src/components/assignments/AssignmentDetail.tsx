import React from 'react';
import { Assignment } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';
import { ChevronLeft } from 'lucide-react';

interface AssignmentDetailProps {
  assignment: Assignment;
  onBack: () => void;
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({ assignment, onBack }) => {
  return (
    <div className="space-y-6">
      <button 
        onClick={onBack} 
        className="flex items-center text-purple-600 hover:text-purple-800 font-medium"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Questions
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {assignment.Subject || "Unknown"}
          </span>
          <span className="text-sm text-gray-500">
            {formatTimeAgo(assignment.date)}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.QuestionName}</h1>
        <p className="text-gray-600 mb-6">{assignment.Topic || "No topic provided"}</p>

        <div className="mt-8">
          <a
            href={assignment.Link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
          >
            Open Question
          </a>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;