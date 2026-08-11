// src/pages/Assignments.tsx
import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import AssignmentCard from '../components/assignments/AssignmentCard';
import AssignmentDetail from '../components/assignments/AssignmentDetail';
import SearchBar from '../components/assignments/SearchBar';
import SubjectFilter from '../components/assignments/SubjectFilter';
// import SheetSourceFilter from '../components/assignments/SheetSourceFilter';
// import { fetchAssignments, fetchAllAssignmentsSem2, SheetName } from '../services/sheetsApi';
import { fetchAllAssignmentsSem2 } from '../services/sheetsApi2';
import { Assignment } from '../types';
import SheetSourceFilter from '../components/assignments/SheetSourceFilter';
import { searchAssignments } from '../utils/searchUtils';

const AssigenmentSem2: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<string[]>(['All']);
  const [sheetSources, setSheetSources] = useState<string[]>(['All']);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedSheetSource, setSelectedSheetSource] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAssignments = async () => {
      setLoading(true);
      try {
        // You can fetch from a specific sheet:
        // const data = await fetchAssignments(SheetName.DSA);

        // Or fetch from all sheets:
        const data = await fetchAllAssignmentsSem2();

        setAssignments(data);
        setFilteredAssignments(data);
      } catch (error) {
        // Error fetching assignments silently
      } finally {
        setLoading(false);
      }
    };

    getAssignments();
  }, []);

  useEffect(() => {
    const uniqueSubjects = ['All', ...new Set(assignments.map(a => a.Subject || 'Unknown'))];
    setSubjects(uniqueSubjects);

    const uniqueSheetSources = ['All', ...new Set(assignments.map(a => a.sheetSource || 'Unknown'))];
    setSheetSources(uniqueSheetSources);
  }, [assignments]);

  useEffect(() => {
    let result = assignments;

    // Filter by subject
    if (selectedSubject !== 'All') {
      result = result.filter(a => a.Subject === selectedSubject);
    }

    // Filter by sheet source
    if (selectedSheetSource !== 'All') {
      result = result.filter(a => a.sheetSource === selectedSheetSource);
    }

    // Enhanced fuzzy search filter
    if (searchTerm) {
      result = searchAssignments(result, searchTerm);
    }

    setFilteredAssignments(result);
  }, [selectedSubject, selectedSheetSource, searchTerm, assignments]);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Question Browser</h1>
            <p className="text-gray-600">Browse through our collection of questions across various subjects and courses.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <SubjectFilter
                subjects={subjects}
                selectedSubject={selectedSubject}
                onSubjectChange={setSelectedSubject}
              />
              {/*               
              <SheetSourceFilter
                sheetSources={sheetSources}
                selectedSheetSource={selectedSheetSource}
                onSheetSourceChange={setSelectedSheetSource}
              /> */}
              <SheetSourceFilter
                sheetSources={sheetSources}
                selectedSheetSource={selectedSheetSource}
                onSheetSourceChange={setSelectedSheetSource}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading questions...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
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

export default AssigenmentSem2;