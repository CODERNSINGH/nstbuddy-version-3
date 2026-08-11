import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import NoticeBoard from '../components/NoticeBoard';

const Home: React.FC = () => {
  return (
    <Layout>

      
      

      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome to NST Buddy</h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Your companion for coding challenges, assignments, and the 100 Days of Code journey.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Link
            to="/assignments"
            className="bg-purple-600 hover:bg-purple-700 text-white py-6 px-6 rounded-lg shadow-md transition-colors"
          >
            <h2 className="text-2xl font-bold mb-2">Complete All Sem-2 Assignments</h2>
            <p>Just Search and Open</p>
          </Link>

          <Link
            to="/assignmentsSem3"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-6 px-6 rounded-lg shadow-md transition-colors"
          >
            <h2 className="text-2xl font-bold mb-2">Complete All Sem-3 Assignments</h2>
            <p>Just Search and Open</p>
          </Link>

          <Link
            to="/assignmentsSem4"
            className="bg-emerald-600 hover:bg-emerald-700 text-white py-6 px-6 rounded-lg shadow-md transition-colors"
          >
            <h2 className="text-2xl font-bold mb-2">Complete All Sem-4 Assignments</h2>
            <p>Just Search and Open</p>
          </Link>
        </div>
      </div>


      <NoticeBoard />
      
    </Layout>
  );
};

export default Home;