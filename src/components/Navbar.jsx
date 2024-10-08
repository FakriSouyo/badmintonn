import React, { useState, useRef, useEffect } from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiLogOut, FiFileText, FiSettings, FiMenu, FiX, FiBell } from 'react-icons/fi';
import { GiShuttlecock } from 'react-icons/gi';
import { supabase } from '../services/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import notificationSound from '../assets/sounds/notification.mp3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";

const Navbar = ({ 
  openAuthModal, 
  openBookingModal, 
  openBookingHistory, 
  openProfileModal, 
  openNotifikasiModal,
  onLogout,
}) => {
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const audioRef = useRef(new Audio(notificationSound));
  const [audioAllowed, setAudioAllowed] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchFullName = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          setFullName(data.full_name || user.email);
        } catch (error) {
          console.error('Error mengambil nama lengkap:', error);
          setFullName(user.email);
        }
      }
    };

    fetchFullName();
  }, [user]);

  useEffect(() => {
    const notificationSubscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, handleNewNotification)
      .subscribe();

    // Coba mainkan audio saat komponen dimount untuk memicu interaksi pengguna
    const playAudio = () => {
      audioRef.current.play()
        .then(() => {
          setAudioAllowed(true);
          console.log('Audio playback allowed');
        })
        .catch(error => console.error('Audio playback not allowed:', error));
    };

    document.addEventListener('click', playAudio, { once: true });

    // Tambahkan ini untuk mengambil jumlah notifikasi yang belum dibaca saat komponen dimount
    fetchUnreadNotificationCount();

    return () => {
      supabase.removeChannel(notificationSubscription);
      document.removeEventListener('click', playAudio);
    };
  }, [user]);

  const handleNewNotification = (payload) => {
    console.log('New notification received:', payload);
    if (audioAllowed) {
      audioRef.current.play()
        .then(() => console.log('Notification sound played successfully'))
        .catch(error => console.error('Error playing notification sound:', error));
    }
    
    // Update unread notification count jika notifikasi baru belum dibaca
    if (!payload.new.is_read) {
      setUnreadNotificationCount(prev => prev + 1);
    }
  };

  const fetchUnreadNotificationCount = async () => {
    if (user) {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (error) throw error;
        setUnreadNotificationCount(count);
      } catch (error) {
        console.error('Error fetching unread notification count:', error);
        // Tambahkan penanganan error yang lebih spesifik jika diperlukan
      }
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = async () => {
    try {
      await onLogout();
      navigate('/');
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      setShowLogoutConfirmation(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const NavLink = ({ to, children, onClick }) => {
    const isScrollLink = ['home', 'about', 'schedule', 'contact'].includes(to);
    
    if (isScrollLink && location.pathname === '/') {
      return (
        <ScrollLink 
          to={to} 
          smooth={true} 
          duration={500} 
          className="text-sm font-medium hover:text-gray-600 cursor-pointer"
          onClick={onClick}
        >
          {children}
        </ScrollLink>
      );
    } else {
      return (
        <RouterLink 
          to={`/${to}`} 
          className="text-sm font-medium hover:text-gray-600"
          onClick={onClick}
        >
          {children}
        </RouterLink>
      );
    }
  };

  return (
    <>
      <header className="px-4 lg:px-6 h-16 flex items-center fixed top-0 w-full bg-white bg-opacity-40 backdrop-blur-md z-50">
        <NavLink to="home" className="flex items-center justify-center cursor-pointer">
          <span className="text-xl font-bold font-sans text-black">Gor Nandy</span>
        </NavLink>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-4 sm:gap-6">
            <NavLink to="home">Beranda</NavLink>
            <NavLink to="about">Tentang</NavLink>
            <NavLink to="schedule">Jadwal</NavLink>
            <NavLink to="contact">Kontak</NavLink>
          </div>
          {user ? (
            <>
              <div className="relative " ref={dropdownRef}>
                <Button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <FiUser className="mr-2" />
                  <span className="hidden md:inline ">{fullName}</span>
                </Button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ">
                    <button
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        openProfileModal();
                      }}
                    >
                      <FiUser className="mr-2" />
                      Profil
                    </button>
                    {user.is_admin && (
                      <RouterLink
                        to="/admin"
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <FiSettings className="mr-2" />
                        Dashboard Admin
                      </RouterLink>
                    )}
                    <button
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        openBookingHistory();
                      }}
                    >
                      <FiFileText className="mr-2" />
                      Riwayat Pemesanan
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-2" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
              {!user.is_admin && (
                <Button
                  onClick={() => {
                    openNotifikasiModal();
                    setUnreadNotificationCount(0); // Reset count when opening notifications
                  }}
                  variant="ghost"
                  className="relative p-2"
                >
                  <FiBell size={24} />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadNotificationCount}
                    </span>
                  )}
                </Button>
              )}
            </>
          ) : (
            <Button onClick={() => openAuthModal('login')} variant="outline" className="text-sm font-medium bg-opacity-90 bg-transparent hover:bg-opacity-100 ">
              Masuk
            </Button>
          )}
          <Button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden" variant="ghost">
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </Button>
        </nav>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              ref={mobileMenuRef}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 left-0 right-0 bg-white shadow-md p-4 md:hidden"
            >
              <div className="flex flex-col space-y-2">
                <NavLink to="home" onClick={() => setIsMobileMenuOpen(false)}>Beranda</NavLink>
                <NavLink to="about" onClick={() => setIsMobileMenuOpen(false)}>Tentang</NavLink>
                <NavLink to="schedule" onClick={() => setIsMobileMenuOpen(false)}>Jadwal</NavLink>
                <NavLink to="contact" onClick={() => setIsMobileMenuOpen(false)}>Kontak</NavLink>
                {user && !user.is_admin && (
                  <>
                    <Button onClick={() => {openBookingModal(); setIsMobileMenuOpen(false);}} className="text-sm font-medium w-full mt-2">
                      Pesan Sekarang
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Dialog konfirmasi logout */}
      <Dialog open={showLogoutConfirmation} onOpenChange={setShowLogoutConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Keluar</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin keluar dari akun Anda?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutConfirmation(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmLogout}>
              keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;