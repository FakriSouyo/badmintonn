import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { FiHome, FiCalendar, FiBookOpen, FiDollarSign, FiLogOut } from 'react-icons/fi';

export const AdminSidebar = ({ onLogout }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: <FiHome className="w-5 h-5" />, href: '/admin/dashboard' },
    { label: 'Lapangan', icon: <FiCalendar className="w-5 h-5" />, href: '/admin/courts' },
    { label: 'Pemesanan', icon: <FiBookOpen className="w-5 h-5" />, href: '/admin/bookings' },
    { label: 'Pembayaran', icon: <FiDollarSign className="w-5 h-5" />, href: '/admin/payments' },
    { label: 'Jadwal', icon: <FiCalendar className="w-5 h-5" />, href: '/admin/schedule' },
  ];

  return (
    <Sidebar className="bg-black text-white">
      <SidebarBody>
        <div className="mb-8 px-4">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </div>
        {navItems.map((item) => (
          <SidebarLink 
            key={item.href} 
            link={item}
            className="mb-2 transition-all duration-200 ease-in-out hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white"
          />
        ))}
        <SidebarLink
          link={{
            label: 'Keluar',
            icon: <FiLogOut className="w-5 h-5" />,
            href: '#'
          }}
          onClick={(e) => {
            e.preventDefault();
            onLogout();
          }}
          className="mt-auto hover:bg-red-900 hover:text-red-300 transition-all duration-200 ease-in-out rounded-lg text-gray-300"
        />
      </SidebarBody>
    </Sidebar>
  );
};