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
import { useAuth } from './contexts/AuthContext';
import { useModal } from './hooks/useModal';
import NotFound from './components/NotFound';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const authModal = useModal();
  const bookingModal = useModal();
  const bookingHistoryModal = useModal();
  const profileModal = useModal();
  const [initialBookingData, setInitialBookingData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Mengembalikan useEffect
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

  const handleBookingInitiated = (bookingData) => {
    setInitialBookingData(bookingData);
    bookingModal.openModal();
  };

  if (loading) {
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
                onLogout={logout}
                user={user}
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