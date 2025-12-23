import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { FiCamera, FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import BusinessCard from './components/BusinessCard.jsx';
import Home from './components/Home.jsx';
import Dashboard from './components/Dashboard.jsx';
import ExhibitionForm from './components/ExhibitionForm.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import Admin from './components/Admin.jsx';
import SuperAdminPanel from './components/SuperAdminPanel.jsx';
import AccessDenied from './components/AccessDenied.jsx';
import Profile from './components/Profile.jsx';
import { checkAccess, getCurrentUser } from './services/api.js';

function Layout() {
  const location = useLocation();

  // pages where header should be hidden
  const hideHeaderRoutes = ["/login"];

  return (
    <>
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

const PrivateRoute = ({ children }) => {
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');

  useEffect(() => {
    let mounted = true;

    // If admin, grant access immediately
    if (adminToken) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    if (!token) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    const verifyAccess = async () => {
      try {
        const res = await checkAccess();
        if (!mounted) return;
        setHasAccess(res.hasAccess || false);
      } catch (error) {
        if (!mounted) return;
        setHasAccess(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    verifyAccess();

    return () => {
      mounted = false;
    };
  }, [token, adminToken]);

  useEffect(() => {
    if (!token || loading || hasAccess || adminToken) return;
    const interval = setInterval(async () => {
      try {
        const res = await checkAccess();
        if (res.hasAccess) {
          setHasAccess(true);
          setLoading(false);
          clearInterval(interval);
        }
      } catch (error) {
        // ignore until next poll
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [token, hasAccess, loading, adminToken]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loader" />
      </div>
    );
  }

  if (!token && !adminToken) {
    return <Navigate to="/login" />;
  }

  if (hasAccess === false && !adminToken) {
    return <AccessDenied />;
  }

  return children;
};

const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

const ProtectedSuperAdminRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const isSuperAdmin = localStorage.getItem('superAdmin') === 'true';

  if (!token || !isSuperAdmin) {
    return <Navigate to="/login" />;
  }

  return children;
};

function UserDropdown({ userName, handleLogout, navigate, isAdmin }) {
  const [isOpen, setIsOpen] = useState(false);
  const isSuperAdmin = localStorage.getItem('superAdmin') === 'true';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-dropdown')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="user-dropdown" style={{ position: 'relative' }}>
      <button
        className="nav-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <FiUser />
        {userName}
        <FiChevronDown style={{ fontSize: '14px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: '#fff',
          border: '#364a63',
          borderRadius: '7px',
          padding: '8px',
          minWidth: '180px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 1000
        }}>
          <button
            className="btn"
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
          >
            <FiUser style={{ marginRight: '8px' }} />
            View Profile
          </button>

          {isAdmin && !isSuperAdmin && (
            <button
              className="btn"
              onClick={() => {
                navigate('/admin');
                setIsOpen(false);
              }}
              style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
            >
              <FiUser style={{ marginRight: '8px' }} />
              View Admin Panel
            </button>
          )}

          {isSuperAdmin && (
            <button
              className="btn"
              onClick={() => {
                navigate('/super-admin');
                setIsOpen(false);
              }}
              style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
            >
              <FiUser style={{ marginRight: '8px' }} />
              Super Admin Panel
            </button>
          )}

          <button
            className="btn danger"
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <FiLogOut style={{ marginRight: '8px' }} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function HeaderNav({ token, handleLogout, activeExhibition, userName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const showDashboard = location.pathname === '/scan';
  const showScanCard = location.pathname === '/dashboard' && activeExhibition && activeExhibition.isLive;
  const adminToken = localStorage.getItem('adminToken');
  const isAdmin = !!adminToken;

  // Show standard nav if logged in (user or admin) and not on specific admin pages if we separate them?
  // Actually, we want persistent nav.

  if (isAdmin && location.pathname.startsWith('/admin') && location.pathname !== '/admin') {
    // If deep inside admin routes (if any), maybe keep "Admin" link?
    // But we only have /admin.
  }

  return (
    <nav className="nav">
      {token || adminToken ? (
        <>
          <Link to="/" className="nav-btn">Home</Link>
          {showDashboard && <Link to="/dashboard" className="nav-btn">Dashboard</Link>}
          {showScanCard && (
            <Link to="/scan" className="nav-btn">
              <FiCamera style={{ marginRight: '6px' }} />
              Scan Card
            </Link>
          )}
          {userName && (
            <UserDropdown userName={userName} handleLogout={handleLogout} navigate={navigate} isAdmin={isAdmin} />
          )}
        </>
      ) : (
        <>
          <Link to="/login" className="nav-btn">Login</Link>
          <Link to="/signup" className="nav-btn">Sign Up</Link>
        </>
      )}
    </nav>
  );
}

export default function App() {
  const location = useLocation();
  const hideHeaderRoutes = ["/login", "/signup", "/admin/login"];

  const [activeExhibition, setActiveExhibition] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userName, setUserName] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  useEffect(() => {
    const loadUserInfo = async () => {
      const currentToken = localStorage.getItem('token');
      const adminToken = localStorage.getItem('adminToken');
      const isSuperAdmin = localStorage.getItem('superAdmin') === 'true';

      if (currentToken) {
        try {
          const res = await getCurrentUser();
          setUserName(res.data?.name || null);
        } catch (error) {
          console.error('Failed to load user info:', error);
        }
      } else if (adminToken) {
        setUserName(isSuperAdmin ? 'Super Admin' : 'Admin');
      } else {
        setUserName(null);
      }
    };
    loadUserInfo();
  }, [token]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('superAdmin');
    setToken(null);
    setUserName(null);
    navigate('/login');
  };

  const handleLogin = async (newToken, role, email) => {
    if (role === 'admin') {
      handleAdminLogin(newToken, email);
      return;
    }

    localStorage.setItem('token', newToken);
    setToken(newToken);
    // Load user info
    try {
      const res = await getCurrentUser();
      setUserName(res.data?.name || null);
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
    // Check access after login
    checkAccess().then(res => {
      if (res.hasAccess) {
        navigate('/');
      } else {
        // Even if no access, go to home/dashboard to show pending status
        navigate('/');
      }
    }).catch(() => {
      navigate('/');
    });
  }

  const handleAdminLogin = (adminToken, email) => {
    localStorage.setItem('adminToken', adminToken);

    if (email === 'superadmin@bizcard.com') {
      localStorage.setItem('superAdmin', 'true');
      setUserName('Super Admin');
      navigate('/super-admin');
    } else {
      localStorage.removeItem('superAdmin');
      setUserName('Admin');
      navigate('/admin');
    }
  }
  const setTab = (tab) => {
    navigate(`/${tab}`);
  }

  return (
    <div className="page">
      {!hideHeaderRoutes.includes(location.pathname) && (
        <header className="header gradient-header">
          <div className="header-inner">
            <h1><Link to="/">BizCard</Link></h1>
            <HeaderNav
              token={token}
              handleLogout={handleLogout}
              activeExhibition={activeExhibition}
              userName={userName}
            />
          </div>
        </header>
      )}

      <main className="container">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup onSignup={handleLogin} />} />
          <Route path="/scan" element={
            <PrivateRoute>
              <BusinessCard activeExhibition={activeExhibition} />
            </PrivateRoute>
          } />
          <Route path="/" element={
            <PrivateRoute>
              <Home setActiveExhibition={setActiveExhibition} setTab={setTab} userName={userName} />
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard activeExhibition={activeExhibition} />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile userName={userName} />
            </PrivateRoute>
          } />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <Admin />
            </ProtectedAdminRoute>
          } />
          <Route path="/super-admin" element={
            <ProtectedSuperAdminRoute>
              <SuperAdminPanel />
            </ProtectedSuperAdminRoute>
          } />
          <Route path="/exhibition-form/:id?" element={
            <PrivateRoute>
              <ExhibitionForm />
            </PrivateRoute>
          } />
        </Routes>
      </main>
      <footer className="footer">© {new Date().getFullYear()} Mirisoft Solutions. All Rights Reserved.</footer>
    </div>
  );
}
