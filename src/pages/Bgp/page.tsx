// src/components/BgpStatusDisplay.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Import the interface (adjust path if needed)
import { BgpSession } from '../../interfaces/network'; // Adjust path as necessary

// --- Helper Function for BGP Status Badge Styling (No changes) ---
const getBgpStatusBadgeStyle = (status?: string): React.CSSProperties => {
  if (!status) { status = 'unknown'; }
  const lowerStatus = status.toLowerCase();
  let backgroundColor = '#ffffff', color = '#ffffff', borderColor = '#5a6268'; // Default Grey

  switch (lowerStatus) {
    case 'established': backgroundColor = '#d4edda'; color = '#155724'; borderColor = '#c3e6cb'; break; // Green
    case 'idle': case 'connect': case 'opensent': case 'openconfirm': backgroundColor = '#f8d7da'; color = '#721c24'; borderColor = '#f5c6cb'; break; // Red
    case 'active': backgroundColor = '#fff3cd'; color = '#856404'; borderColor = '#ffeeba'; break; // Yellow
    default: backgroundColor = '#e2e3e5'; color = '#383d41'; borderColor = '#d6d8db'; break; // Other/Unknown Grey
  }
  return { display: 'inline-block', padding: '3px 8px', fontSize: '0.85em', fontWeight: 'bold', lineHeight: '1', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'baseline', borderRadius: '.25rem', backgroundColor: backgroundColor, color: color, border: `1px solid ${borderColor}` };
};

// --- Date Formatting Helper (No changes) ---
const formatTimestamp = (isoString: string): string => {
    try {
        return new Date(isoString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
    } catch (e) { return 'Invalid Date'; }
};

// --- React Component ---
const BgpStatusDisplay: React.FC = () => {
  const [bgpSessions, setBgpSessions] = useState<BgpSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = 'http://localhost:3333/bgp'; // Adjust if needed

  useEffect(() => {
    const fetchBgpData = async () => {
      setLoading(true); setError(null);
      try {
        const response = await axios.get<BgpSession[]>(apiUrl);
        setBgpSessions(response.data);
      } catch (err) {
        console.error("Axios fetch error:", err);
        if (axios.isAxiosError(err)) { setError(err.response?.data?.error || err.message || 'Failed to fetch BGP data'); }
        else { setError('An unexpected error occurred'); }
      } finally { setLoading(false); }
    };
    fetchBgpData();
  }, [apiUrl]);

  // --- Basic Table Styling (No changes needed here) ---
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '0.9rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
  const thStyle: React.CSSProperties = { border: '1px solid #dee2e6', padding: '8px 10px', textAlign: 'left', backgroundColor: '#f8f9fa', fontWeight: '600' };
  const tdStyle: React.CSSProperties = {background:"white", border: '1px solid #dee2e6', padding: '6px 10px', textAlign: 'left', verticalAlign: 'middle' };

  // --- Render Logic ---
  if (loading) return <div style={{ padding: '20px' }}>Loading BGP Sessions...</div>;
  if (error) return <div style={{ color: 'red', padding: '20px', border: '1px solid red' }}>Error: {error}</div>;
  if (!bgpSessions || bgpSessions.length === 0) return <div style={{ padding: '20px' }}>No BGP Sessions found.</div>;

  return (
    <div style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', padding: '20px' }}>
      <h1 style={{ fontSize: '1.5em', marginBottom: '15px' }}>BGP Session Status</h1>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Local Device</th>
            <th style={thStyle}>Local ASN</th>
            <th style={thStyle}>Peer IP</th>
            <th style={thStyle}>Peer ASN</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {/* *** CHANGE: Removed conditional style for alternating rows *** */}
          {bgpSessions.map((session) => (
            <tr key={session.id}>
              {/* Display Device Name and IP */}
              <td style={tdStyle}>
                  {session.device?.name ?? 'N/A'}
                  <br />
                  <span style={{ color: '#555', fontSize: '0.9em' }}>({session.device?.ip ?? 'N/A'})</span>
              </td>
              {/* Local ASN */}
              <td style={tdStyle}>{session.localAsn}</td>
              {/* Peer IP */}
              <td style={tdStyle}>{session.peerIp}</td>
              {/* Peer ASN and Name */}
              <td style={tdStyle}>
                  {session.peerAsn}
                  <br/>
                  <span style={{ color: '#555', fontSize: '0.9em' }}>({session.asn?.name ?? 'N/A'})</span>
              </td>
              {/* Status Badge */}
              <td style={tdStyle}>
                <span style={getBgpStatusBadgeStyle(session.status)}>
                  {session.status}
                </span>
              </td>
              {/* Last Updated Timestamp */}
              <td style={tdStyle}>{formatTimestamp(session.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BgpStatusDisplay;