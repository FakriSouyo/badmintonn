import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Courts } from './pages/Courts';
import { Bookings } from './pages/Bookings';
import { Payments } from './pages/Payments';
import { AdminSchedule } from './pages/AdminSchedule';
import { RefundPanel } from './pages/RefundPanel';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, SidebarBody, SidebarLink, SidebarHeader, SidebarProvider } from '@/components/ui/sidebar';
import { FiHome, FiCalendar, FiBookOpen, FiDollarSign, FiLogOut, FiRefreshCcw } from 'react-icons/fi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { label: 'Dashboard', icon: <FiHome />, href: '/admin/dashboard' },
    { label: 'Courts', icon: <FiCalendar />, href: '/admin/courts' },
    { label: 'Bookings', icon: <FiBookOpen />, href: '/admin/bookings' },
    { label: 'Payments', icon: <FiDollarSign />, href: '/admin/payments' },
    { label: 'Schedule', icon: <FiCalendar />, href: '/admin/schedule' },
    { label: 'Refunds', icon: <FiRefreshCcw />, href: '/admin/refunds' },
  ];

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setIsLogoutDialogOpen(false);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar>
          <SidebarBody>
            <SidebarHeader title="Admin Panel" />
            {navItems.map((item) => (
              <SidebarLink key={item.href} link={item} />
            ))}
            <SidebarLink
              link={{
                label: 'Logout',
                icon: <FiLogOut />,
                href: '#'
              }}
              onClick={handleLogout}
              className="mt-auto"
            />
          </SidebarBody>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm z-10">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                {navItems.find(item => item.href === location.pathname)?.label || 'Admin Dashboard'}
              </h1>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courts" element={<Courts />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/schedule" element={<AdminSchedule />} />
                <Route path="/refunds" element={<RefundPanel />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </div>
          </main>
        </div>

        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Logout</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Apakah Anda yakin ingin keluar dari sistem?
            </DialogDescription>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
                Tidak
              </Button>
              <Button variant="destructive" onClick={confirmLogout}>
                Ya, Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;