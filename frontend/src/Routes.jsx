import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Import common components
import ProtectedRoute from './components/common/ProtectedRoute';

// Import landing page
import LandingPage from './pages/LandingPage';

// Import page components
import DashboardPage from './pages/Dashboard';
import Members from './pages/Members';
import Attendance from './pages/Attendance';
import Bookings from './pages/Bookings';
import ComingSoon from './pages/ComingSoon';
import IndoorMemberships from './pages/Memberships/IndoorMemberships';
import OutdoorMemberships from './pages/Memberships/OutdoorMemberships';
import RenewalsDue from './pages/Memberships/RenewalsDue';
import PaymentsDue from './pages/Memberships/PaymentsDue';
import DesignShowcase from './pages/DesignShowcase';
import AdminManagement from './pages/AdminManagement';
import Unauthorized from './pages/Unauthorized';

// Import permission components
import { SuperuserRoute, AdminRoute } from './components/common/PermissionRoute';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-emerald-200 mb-6">
              We're sorry, but there was an error loading the application.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes that anyone can access */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/design-showcase" element={<DesignShowcase />} />
      <Route path="/designs" element={<DesignShowcase />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* --- Protected Routes --- */}
      {/* The ProtectedRoute component will check for authentication */}
      {/* If authenticated, it renders the child route. */}
      {/* If not, it redirects to /landing. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/members" element={<Members />} />
        <Route path="/memberships/indoor" element={<IndoorMemberships />} />
        <Route path="/memberships/outdoor" element={<OutdoorMemberships />} />
        <Route path="/memberships/renewals" element={<RenewalsDue />} />
        <Route path="/memberships/payments" element={<PaymentsDue />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/feedback" element={<ComingSoon />} />
        <Route path="/communication" element={<ComingSoon />} />
        <Route path="/inventory" element={<ComingSoon />} />
        
        {/* Admin-only routes */}
        <Route 
          path="/admin/users" 
          element={
            <SuperuserRoute>
              <AdminManagement />
            </SuperuserRoute>
          } 
        />
      </Route>

      {/* A catch-all route for any other path */}
      <Route path="*" element={<ComingSoon />} />
    </Routes>
  );
};

/**
 * Main App component
 * Wraps the entire application with necessary providers
 */
const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;