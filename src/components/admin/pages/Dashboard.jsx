// src/admin/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/services/supabaseClient';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeBookings: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('total_price, status');

      if (bookingsError) throw bookingsError;

      const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_price, 0);
      const totalBookings = bookings.length;
      const activeBookings = bookings.filter(booking => booking.status === 'confirmed').length;

      setStats({ totalRevenue, totalBookings, activeBookings });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Total Pendapatan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl sm:text-2xl font-bold">Rp {stats.totalRevenue.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Total Pemesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl sm:text-2xl font-bold">{stats.totalBookings}</p>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Pemesanan Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl sm:text-2xl font-bold">{stats.activeBookings}</p>
        </CardContent>
      </Card>
    </div>
  );
};