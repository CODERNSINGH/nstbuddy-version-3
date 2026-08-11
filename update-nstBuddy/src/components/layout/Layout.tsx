import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, fullWidth = false }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className={`${fullWidth ? 'w-full' : 'w-4/5 mx-auto px-4 sm:px-6 lg:px-8 py-8'} flex-grow`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;