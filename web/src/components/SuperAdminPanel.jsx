
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiLogOut } from 'react-icons/fi';
import {
    getIpRequests,
    approveIpRequest
} from '../services/api';
import countries from '../countries.json';

export default function SuperAdminPanel() {
    const navigate = useNavigate();
    const [ipRequests, setIpRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    const loadIpRequests = async () => {
        try {
            const res = await getIpRequests();
            setIpRequests(res?.data || []);
            setError('');
        } catch (e) {
            setError(e.message || 'Failed to load IP requests');
        }
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            await loadIpRequests();
            setLoading(false);
        })();
    }, []);

    // Auto-refresh IP requests every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            loadIpRequests();
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, []);

    const handleApprove = async (requestId, approved) => {
        try {
            await approveIpRequest(requestId, approved);
            setMessage({ type: 'success', text: `IP request ${approved ? 'approved' : 'rejected'}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            await loadIpRequests();
        } catch (e) {
            setMessage({ type: 'error', text: e.message || 'Failed to update request' });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    const getCountryFlag = (countryCode) => {
        if (!countryCode) return null;
        const country = countries.find(c => c.code === countryCode);
        return country ? country.flag : null;
    };

    const getCountryName = (countryCode) => {
        if (!countryCode) return 'Unknown';
        const country = countries.find(c => c.code === countryCode);
        return country ? country.name : countryCode;
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('superAdmin'); // Clear the super admin flag
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
                <div className="loader" />
            </div>
        );
    }

    const pendingCount = ipRequests.filter(r => !r.approved).length;

    return (
        <div className="admin-page">
            <div className="admin-hero">
                <div>
                    <h1 className="admin-title">Super Admin Panel</h1>
                    <p className="muted" style={{ color: 'rgba(255,255,255,0.8)' }}>Manage IP Approvals and Security</p>
                </div>
                <button className="btn danger" onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid red' }}>
                    <FiLogOut style={{ marginRight: '8px' }} />
                    Logout
                </button>
            </div>

            <div className="admin-tabs">
                <button className="btn admin-tab active">
                    IP Requests
                    {pendingCount > 0 && (
                        <span className="admin-badge">{pendingCount}</span>
                    )}
                </button>
            </div>

            {message.text && <div className={`msg ${message.type}`}>{message.text}</div>}
            {error && <div className="msg error">{error}</div>}

            <div>
                <div className="admin-section-head">
                    <h2>IP Approval Requests</h2>
                    <div className="admin-stats">
                        <div className="admin-stat danger">
                            <span>Pending</span>
                            <strong>{pendingCount}</strong>
                        </div>
                        <div className="admin-stat success">
                            <span>Approved</span>
                            <strong>{ipRequests.filter(r => r.approved).length}</strong>
                        </div>
                    </div>
                </div>
                {ipRequests.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 40px',
                        color: 'var(--muted)',
                        background: 'linear-gradient(180deg, rgba(96,165,250,0.05), rgba(244,114,182,0.05))',
                        borderRadius: '16px',
                        border: '1px dashed rgba(96,165,250,0.3)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                        <p style={{ fontSize: '18px', margin: 0 }}>No IP requests found</p>
                    </div>
                ) : (
                    <div className="exhibitions-panel table table-scroll admin-table-wrapper">
                        <table className="exhibitions-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Email</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>IP Address</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Country</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date</th>
                                    <th style={{ textAlign: 'right', padding: '12px 16px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ipRequests
                                    .sort((a, b) => {
                                        // Pending requests first
                                        if (a.approved !== b.approved) {
                                            return a.approved ? 1 : -1;
                                        }
                                        // Then by date (newest first)
                                        return new Date(b.createdAt) - new Date(a.createdAt);
                                    })
                                    .map((request) => {
                                        const isApproved = request.approved === true;
                                        return (
                                            <tr
                                                key={request._id}
                                                style={{
                                                    background: !isApproved ? 'rgba(239,68,68,0.05)' : 'transparent',
                                                    borderLeft: !isApproved ? '4px solid #ef4444' : '4px solid transparent'
                                                }}
                                            >
                                                <td style={{ padding: '16px', fontWeight: '600' }}>{request.userName || '—'}</td>
                                                <td style={{ padding: '16px' }}>{request.userEmail || '—'}</td>
                                                <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '14px' }}>{request.ipAddress || '—'}</td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {getCountryFlag(request.countryCode) && (
                                                            <span style={{ fontSize: '24px' }}>{getCountryFlag(request.countryCode)}</span>
                                                        )}
                                                        <span>{getCountryName(request.countryCode)}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span className={`pill ${isApproved ? 'pill-live' : 'pill-muted'}`}>
                                                        {isApproved ? '✓ Approved' : '⏳ Pending'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '13px', color: 'var(--muted)' }}>
                                                    {new Date(request.createdAt).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                                    {!isApproved ? (
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                            <button
                                                                className="btn"
                                                                onClick={() => handleApprove(request._id, true)}
                                                                style={{
                                                                    background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(22,163,74,0.25))',
                                                                    borderColor: '#22c55e',
                                                                    color: '#22c55e',
                                                                    fontWeight: '600'
                                                                }}
                                                            >
                                                                <FiCheck style={{ marginRight: '6px' }} />
                                                                Approve
                                                            </button>
                                                            <button
                                                                className="btn danger"
                                                                onClick={() => handleApprove(request._id, false)}
                                                                style={{ fontWeight: '600' }}
                                                            >
                                                                <FiX style={{ marginRight: '6px' }} />
                                                                Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                                                            Approved {request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : ''}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
