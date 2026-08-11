// src/pages/AssignmentsSem4.tsx
import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import AssignmentCard from '../components/assignments/AssignmentCard';
import AssignmentDetail from '../components/assignments/AssignmentDetail';
import SearchBar from '../components/assignments/SearchBar';
import SubjectFilter from '../components/assignments/SubjectFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import { questionsApi } from '../services/api';
import { Question } from '../types';
import { fuzzyMatch } from '../utils/searchUtils';

const AssignmentsSem4: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
    const [subjects, setSubjects] = useState<string[]>(['All']);
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRenderMessage, setShowRenderMessage] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);

        // Show Render message after 3 seconds of loading
        const renderMessageTimer = setTimeout(() => {
            setShowRenderMessage(true);
        }, 3000);

        try {
            const data = await questionsApi.getAll({ semester: 4 });
            setQuestions(data);
            setFilteredQuestions(data);

            // Extract unique subjects
            const uniqueSubjects: string[] = ['All', ...Array.from(new Set(data.map((q: Question) => q.subject)))];
            setSubjects(uniqueSubjects);
        } catch (error) {
            // Error fetching questions silently
        } finally {
            clearTimeout(renderMessageTimer);
            setLoading(false);
            setShowRenderMessage(false);
        }
    };

    useEffect(() => {
        let result = questions;

        // Filter by subject
        if (selectedSubject !== 'All') {
            result = result.filter(q => q.subject === selectedSubject);
        }

        // Enhanced fuzzy search filter
        if (searchTerm) {
            result = result.filter(q =>
                fuzzyMatch(q.questionName || '', searchTerm) ||
                fuzzyMatch(q.topic || '', searchTerm) ||
                fuzzyMatch(q.subject || '', searchTerm)
            );
        }

        setFilteredQuestions(result);
    }, [selectedSubject, searchTerm, questions]);

    // Convert Question to Assignment format for existing components
    const convertToAssignment = (question: Question) => ({
        id: parseInt(question.id.substring(0, 8), 16), // Convert cuid to number for compatibility
        date: new Date(question.createdAt).toISOString().split('T')[0],
        QuestionName: question.questionName,
        Subject: question.subject,
        Topic: question.topic,
        Link: question.link,
        sheetSource: `Semester ${question.semester}`
    });

    return (
        <Layout>
            {selectedQuestion ? (
                <AssignmentDetail
                    assignment={selectedQuestion}
                    onBack={() => setSelectedQuestion(null)}
                />
            ) : (
                <>
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Semester 4 Questions</h1>
                        <p className="text-gray-600">Browse through our collection of Semester 4 questions.</p>
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
                        </div>
                    </div>

                    {loading ? (
                        <LoadingSpinner
                            message="Loading Semester 4 questions..."
                            showRenderMessage={showRenderMessage}
                        />
                    ) : filteredQuestions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No questions found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredQuestions.map((question) => (
                                <AssignmentCard
                                    key={question.id}
                                    assignment={convertToAssignment(question)}
                                    onClick={(q) => setSelectedQuestion(q)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </Layout>
    );
};

export default AssignmentsSem4;
