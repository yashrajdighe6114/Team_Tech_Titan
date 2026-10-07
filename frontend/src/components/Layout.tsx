import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { DemoSwitcher } from './DemoSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          <DemoSwitcher />
          {children}
        </main>
      </div>
    </div>
  );
};
