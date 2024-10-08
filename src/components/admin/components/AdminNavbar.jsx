import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const AdminNavbar = ({ onLogout }) => {
  const handleSignOut = async () => {
    try {
      await onLogout();
      // Redirect akan ditangani oleh AuthProvider
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/admin" className="text-xl font-bold">Admin Dashboard</Link>
        <div className="space-x-4">
          <Link to="/admin/courts" className="text-gray-600 hover:text-gray-900">Lapangan</Link>
          <Link to="/admin/bookings" className="text-gray-600 hover:text-gray-900">Pemesanan</Link>
          <Link to="/admin/payments" className="text-gray-600 shover:text-gray-900">Pembayaran</Link>
          <Link to="/admin/schedule" className="text-gray-600 hover:text-gray-900">Jadwal</Link>
          <Button onClick={handleSignOut} variant="outline">Keluar</Button>
        </div>
      </div>
    </nav>
  );
};