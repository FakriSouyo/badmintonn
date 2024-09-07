// src/admin/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/services/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeBookings: 0,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [popularCourts, setPopularCourts] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchMonthlyRevenue();
    fetchPopularCourts();
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
      console.error('Kesalahan saat mengambil statistik dashboard:', error);
    }
  };

  const fetchMonthlyRevenue = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('created_at, total_price')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const monthlyData = data.reduce((acc, booking) => {
        const month = new Date(booking.created_at).toLocaleString('id-ID', { month: 'long' });
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += booking.total_price;
        return acc;
      }, {});

      setMonthlyRevenue(Object.entries(monthlyData).map(([month, revenue]) => ({ month, revenue })));
    } catch (error) {
      console.error('Kesalahan saat mengambil pendapatan bulanan:', error);
    }
  };

  const fetchPopularCourts = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('court_id, courts(name)')
        .order('court_id', { ascending: true });

      if (error) throw error;

      const courtCounts = data.reduce((acc, booking) => {
        if (!acc[booking.court_id]) {
          acc[booking.court_id] = { name: booking.courts.name, count: 0 };
        }
        acc[booking.court_id].count++;
        return acc;
      }, {});

      setPopularCourts(Object.values(courtCounts).sort((a, b) => b.count - a.count).slice(0, 5));
    } catch (error) {
      console.error('Kesalahan saat mengambil lapangan populer:', error);
    }
  };

  return (
    <div className="space-y-6">
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

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Pendapatan Bulanan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Pendapatan" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Lapangan Terpopuler</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {popularCourts.map((court, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{court.name}</span>
                <span className="font-bold">{court.count} pemesanan</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};