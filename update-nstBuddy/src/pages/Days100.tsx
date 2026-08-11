import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import AssignmentCard from '../components/assignments/AssignmentCard';
import AssignmentDetail from '../components/assignments/AssignmentDetail';
import SearchBar from '../components/assignments/SearchBar';
import SubjectFilter from '../components/assignments/SubjectFilter';
import { fetchAssignments } from '../services/sheetsApi';
import { Assignment } from '../types';
import { searchAssignments } from '../utils/searchUtils';

const Days100: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<string[]>(['All']);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    const getAssignments = async () => {
      const data = await fetchAssignments('100-Days-of-code!A1:D'); // Specific range for 100 days
      setAssignments(data);
      setFilteredAssignments(data);
    };
    getAssignments();
  }, []);

  useEffect(() => {
    const uniqueSubjects = ['All', ...new Set(assignments.map(a => a.Subject || 'Unknown'))];
    setSubjects(uniqueSubjects);
  }, [assignments]);

  useEffect(() => {
    let result = assignments;
    if (selectedSubject !== 'All') {
      result = result.filter(a => a.Subject === selectedSubject);
    }
    // Enhanced fuzzy search filter
    if (searchTerm) {
      result = searchAssignments(result, searchTerm);
    }
    setFilteredAssignments(result);
  }, [selectedSubject, searchTerm, assignments]);

  return (
    <Layout>
      {selectedAssignment ? (
        <AssignmentDetail
          assignment={selectedAssignment}
          onBack={() => setSelectedAssignment(null)}
        />
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">100 Days of Code</h1>
            <p className="text-gray-600">Track your progress through the 100 Days of Code challenge.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            <SubjectFilter
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSubjectChange={setSelectedSubject}
            />
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No questions found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onClick={setSelectedAssignment}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default Days100;
