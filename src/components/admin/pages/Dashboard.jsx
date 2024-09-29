import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/services/supabaseClient';
import { FiUsers, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeBookings: 0,
  });
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [popularCourts, setPopularCourts] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchDailyRevenue();
    fetchPopularCourts();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('total_price, status, payment_status');

      if (bookingsError) throw bookingsError;

      const totalRevenue = bookings
        .filter(booking => booking.payment_status === 'paid')
        .reduce((sum, booking) => sum + booking.total_price, 0);
      const totalBookings = bookings.length;
      const activeBookings = bookings.filter(booking => 
        booking.status === 'confirmed' && booking.payment_status === 'paid'
      ).length;

      setStats({ totalRevenue, totalBookings, activeBookings });
    } catch (error) {
      console.error('Kesalahan saat mengambil statistik dashboard:', error);
    }
  };

  const fetchDailyRevenue = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('created_at, total_price, payment_status')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const dailyData = data.reduce((acc, booking) => {
        const date = new Date(booking.created_at).toLocaleDateString('id-ID');
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += booking.total_price;
        return acc;
      }, {});

      setDailyRevenue(Object.entries(dailyData).map(([name, total]) => ({ name, total })));
    } catch (error) {
      console.error('Kesalahan saat mengambil pendapatan harian:', error);
    }
  };

  const fetchPopularCourts = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('court_id, courts(name)')
        .eq('payment_status', 'paid')
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Pendapatan Harian',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Tanggal',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Pendapatan (Rp)',
        },
        ticks: {
          callback: (value) => `Rp${value.toLocaleString()}`,
        },
      },
    },
  };

  const chartData = {
    labels: dailyRevenue.map(item => item.name),
    datasets: [
      {
        data: dailyRevenue.map(item => item.total),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
          return gradient;
        },
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.5,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <FiDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemesanan</CardTitle>
            <FiCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">+180.1% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pemesanan Aktif</CardTitle>
            <FiUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground">+19% dari bulan lalu</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendapatan Harian</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '350px' }}>
            <Bar options={chartOptions} data={chartData} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lapangan Terpopuler</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {popularCourts.map((court, index) => (
              <li key={index} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                <span className="font-medium">{court.name}</span>
                <span className="text-sm text-muted-foreground">{court.count} pemesanan</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};