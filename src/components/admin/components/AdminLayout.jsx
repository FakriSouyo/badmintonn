import React from 'react';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="fixed h-full">
        <AdminSidebar />
      </div>
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 ml-64">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};