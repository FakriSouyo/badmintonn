import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Schedule from './components/Schedule';
import Contact from './components/Contact';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import BookingModal from './components/BookingModal';
import BookingHistory from './components/BookingHistory';
import ProfileModal from './components/ProfileModal';
import AdminDashboard from './components/admin/AdminDashboard';
import Notifikasi from './components/Notifikasi';
import { useAuth } from './contexts/AuthContext';
import { useModal } from './hooks/useModal';
import NotFound from './components/NotFound';
import { supabase } from './services/supabaseClient';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const authModal = useModal();
  const bookingModal = useModal();
  const bookingHistoryModal = useModal();
  const profileModal = useModal();
  const notifikasiModal = useModal();
  const [initialBookingData, setInitialBookingData] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (user && user.is_admin) {
        if (!location.pathname.startsWith('/admin')) {
          navigate('/admin/dashboard');
        }
      } else if (location.pathname.startsWith('/admin')) {
        navigate('/');
      }
    }
  }, [user, loading, navigate, location]);

  useEffect(() => {
    const fetchUnreadNotificationCount = async () => {
      if (user) {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_read', false);
        if (error) {
          console.error('Error fetching unread notification count:', error);
        } else {
          setUnreadNotificationCount(count);
        }
      }
    };
    fetchUnreadNotificationCount();
    
    // Set up real-time listener for new notifications
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.new.user_id === user.id && !payload.new.is_read) {
          setUnreadNotificationCount((prevCount) => prevCount + 1);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleBookingInitiated = (bookingData) => {
    setInitialBookingData(bookingData);
    bookingModal.openModal();
  };

  const handleNotificationOpen = () => {
    notifikasiModal.openModal();
    setUnreadNotificationCount(0); // Reset count when opening notifications
  };

  if (loading || isLoggingOut) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Routes>
        <Route 
          path="/admin/*" 
          element={
            user && user.is_admin ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="/not-found" element={<NotFound />} />
        <Route
          path="/*"
          element={
            <>
              <Navbar 
                openAuthModal={authModal.openModal}
                openBookingModal={bookingModal.openModal}
                openBookingHistory={bookingHistoryModal.openModal}
                openProfileModal={profileModal.openModal}
                openNotifikasiModal={handleNotificationOpen}
                onLogout={handleLogout}
                user={user}
                unreadNotificationCount={unreadNotificationCount}
                isLoggingOut={isLoggingOut}
              />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={
                    <>
                      <Home />
                      <About />
                      <Schedule 
                        onBookingInitiated={handleBookingInitiated} 
                        openAuthModal={authModal.openModal}
                        user={user}
                      />
                      <Contact />
                      <FAQ />
                    </>
                  } />
                  {/* Add more non-admin routes as needed */}
                  <Route path="*" element={<Navigate to="/not-found" replace />} />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
      
      <AuthModal isOpen={authModal.isOpen} onClose={authModal.closeModal} />        
      <BookingModal 
        isOpen={bookingModal.isOpen} 
        onClose={() => {
          bookingModal.closeModal();
          setInitialBookingData(null);
        }} 
        user={user}
        initialBookingData={initialBookingData}
      />
      <BookingHistory isOpen={bookingHistoryModal.isOpen} onClose={bookingHistoryModal.closeModal} user={user} />
      <ProfileModal isOpen={profileModal.isOpen} onClose={profileModal.closeModal} user={user} />
      <Notifikasi 
        isOpen={notifikasiModal.isOpen} 
        onClose={() => {
          notifikasiModal.closeModal();
          setUnreadNotificationCount(0); // Reset count when closing notifications
        }} 
        user={user} 
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
      <Toaster position="top-center" />
    </Router>
  );
}

export default App;