import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiDownload, FiTrash2, FiEdit2, FiPlus } from 'react-icons/fi';
import {
  getIpRequests,
  approveIpRequest,
  listExhibitions,
  getLiveExhibitions,
  exportAllExhibitions,
  exportExhibitionCards,
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from '../services/api';
import countries from '../countries.json';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('exhibitions'); // 'exhibitions', 'users'
  const [exhibitions, setExhibitions] = useState([]);
  const [users, setUsers] = useState([]);
  const [live, setLive] = useState([]);

  // User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadExhibitions = async () => {
    try {
      const res = await listExhibitions();
      setExhibitions(res?.data || []);
      try {
        const l = await getLiveExhibitions();
        setLive(l?.data || []);
      } catch (e) {
        // silent
      }
    } catch (e) {
      setError(e.message || 'Failed to load exhibitions');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res?.data || []);
    } catch (e) {
      setError(e.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadExhibitions();
      await loadUsers();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (activeTab === 'exhibitions') {
      loadExhibitions();
      const interval = setInterval(() => {
        loadExhibitions();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return null;
    const country = countries.find(c => c.code === countryCode);
    return country ? country.flag : null;
  };

  // Sort exhibitions: live first, then by start time
  const sortedExhibitions = [...exhibitions].sort((a, b) => {
    const aIsLive = live.find((l) => l._id === a._id) != null;
    const bIsLive = live.find((l) => l._id === b._id) != null;
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    return new Date(a.startTime) - new Date(b.startTime);
  });

  const handleExportAll = async () => {
    try {
      const blob = await exportAllExhibitions();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exhibitions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setMessage({ type: 'success', text: 'Exhibitions exported successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to export exhibitions' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleExportCards = async (ex) => {
    try {
      const blob = await exportExhibitionCards(ex._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Filename is also handled by backend Content-Disposition but just in case
      a.download = `cards-${ex.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setMessage({ type: 'success', text: 'Cards exported successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to export cards' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id);
      setMessage({ type: 'success', text: 'User deleted successfully' });
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to delete user' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <div>
          <h1 className="admin-title">Admin Panel</h1>
          <p className="muted">Manage exhibitions and users</p>
        </div>
        <button className="btn danger" onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-tabs">
        <button
          className={`btn admin-tab ${activeTab === 'exhibitions' ? 'active' : ''}`}
          onClick={() => setActiveTab('exhibitions')}
        >
          Exhibitions
        </button>
        <button
          className={`btn admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      {message.text && <div className={`msg ${message.type}`}>{message.text}</div>}
      {error && <div className="msg error">{error}</div>}

      {activeTab === 'exhibitions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>All Exhibitions</h2>
            <button className="btn" onClick={handleExportAll}>
              <FiDownload style={{ marginRight: '8px' }} />
              Export All Exhibitions
            </button>
          </div>
          {sortedExhibitions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              <p>No exhibitions found</p>
            </div>
          ) : (
            <div className="exhibitions-panel table table-scroll admin-table-wrapper">
              <table className="exhibitions-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Start Time</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>End Time</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Timezone</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Country</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Created By</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExhibitions.map((ex) => {
                    const isLive = live.find((l) => l._id === ex._id) != null;
                    const now = new Date();
                    const startTime = new Date(ex.startTime);
                    const endTime = new Date(ex.endTime);
                    endTime.setHours(endTime.getHours() + 12);
                    const isUpcoming = startTime > now && !isLive;
                    const isCompleted = endTime < now && !isLive;
                    const country = countries.find(c => c.code === ex.country);

                    return (
                      <tr key={ex._id}>
                        <td style={{ padding: '16px', fontWeight: '600' }}>{ex.name}</td>
                        <td style={{ padding: '16px' }}>{new Date(ex.startTime).toLocaleString()}</td>
                        <td style={{ padding: '16px' }}>{new Date(ex.endTime).toLocaleString()}</td>
                        <td style={{ padding: '16px' }}>{ex.timezone}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {country && <span style={{ fontSize: '20px' }}>{country.flag}</span>}
                            <span>{country ? country.name : ex.country}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`pill ${isLive ? 'pill-live' : isUpcoming ? 'pill-upcoming' : 'pill-completed'}`}>
                            {isLive ? 'Live' : isUpcoming ? 'Upcoming' : 'Completed'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>{ex.createdBy || '—'}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button
                            className="btn"
                            onClick={() => handleExportCards(ex)}
                            style={{
                              padding: '6px 12px',
                              height: 'auto',
                              fontSize: '13px'
                            }}
                          >
                            <FiDownload style={{ marginRight: '6px' }} />
                            Export Cards
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Manage Users</h2>
            <button
              className="btn"
              onClick={() => {
                setEditingUser(null);
                setUserForm({ name: '', email: '', password: '' });
                setShowUserModal(true);
              }}
            >
              <FiPlus style={{ marginRight: '8px' }} />
              Add User
            </button>
          </div>

          <div className="exhibitions-panel table table-scroll admin-table-wrapper">
            <table className="exhibitions-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Verified</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Joined Date</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{user.name}</td>
                    <td style={{ padding: '16px' }}>{user.email}</td>
                    <td style={{ padding: '16px' }}>
                      <span className={`pill ${user.isEmailVerified ? 'pill-live' : 'pill-muted'}`}>
                        {user.isEmailVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--muted)' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn"
                          onClick={() => {
                            setEditingUser(user);
                            setUserForm({ name: user.name, email: user.email, password: '' });
                            setShowUserModal(true);
                          }}
                          style={{ padding: '6px' }}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this user?')) {
                              handleDeleteUser(user._id);
                            }
                          }}
                          style={{ padding: '6px' }}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Modal */}
          {showUserModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ marginTop: 0 }}>{editingUser ? 'Edit User' : 'Add User'}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Name</label>
                    <input
                      className="input"
                      value={userForm.name}
                      onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email</label>
                    <input
                      className="input"
                      value={userForm.email}
                      onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="name@example.com"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      {editingUser ? 'New Password (optional)' : 'Password'}
                    </label>
                    <input
                      className="input"
                      type="password"
                      value={userForm.password}
                      onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder={editingUser ? 'Leave blank to keep current' : 'Secure password'}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                      className="btn primary"
                      style={{ flex: 1 }}
                      onClick={async () => {
                        try {
                          if (editingUser) {
                            await updateUser(editingUser._id, userForm);
                            setMessage({ type: 'success', text: 'User updated successfully' });
                          } else {
                            await createUser(userForm);
                            setMessage({ type: 'success', text: 'User created successfully' });
                          }
                          setShowUserModal(false);
                          loadUsers();
                          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                        } catch (e) {
                          alert(e.message);
                        }
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="btn"
                      style={{ flex: 1 }}
                      onClick={() => setShowUserModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

