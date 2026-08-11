import React from 'react';

interface SubjectFilterProps {
  subjects: string[];
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
}

const SubjectFilter: React.FC<SubjectFilterProps> = ({ 
  subjects, 
  selectedSubject, 
  onSubjectChange 
}) => {
  return (
    <select
      value={selectedSubject}
      onChange={(e) => onSubjectChange(e.target.value)}
      className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      {subjects.map(subject => (
        <option key={subject} value={subject}>{subject}</option>
      ))}
    </select>
  );
};

export default SubjectFilter;