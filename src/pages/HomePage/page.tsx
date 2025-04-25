// src/components/VsiForDevice.tsx
import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useParams } from 'react-router-dom'; // Import useParams hook

// Import the interface (adjust path if needed)
import { Vsi } from '../../interfaces/network'; // Adjust path as necessary

// --- Helper Function for Status Styling (Badge Style - same as before) ---
const getStatusBadgeStyle = (status?: string): React.CSSProperties => {
  if (!status) { status = 'unknown'; }
  const lowerStatus = status.toLowerCase().replace('*','');
  let backgroundColor = '#6c757d', color = '#ffffff', borderColor = '#5a6268';
  switch (lowerStatus) {
    case 'up': case 'established': backgroundColor = '#d4edda'; color = '#155724'; borderColor = '#c3e6cb'; break;
    case 'down': backgroundColor = '#f8d7da'; color = '#721c24'; borderColor = '#f5c6cb'; break;
    case 'active': backgroundColor = '#fff3cd'; color = '#856404'; borderColor = '#ffeeba'; break;
    default: backgroundColor = '#e2e3e5'; color = '#383d41'; borderColor = '#d6d8db'; break;
  }
  return { display: 'inline-block', padding: '2px 6px', fontSize: '0.8em', fontWeight: 'bold', lineHeight: '1', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'baseline', borderRadius: '.25rem', backgroundColor, color, border: `1px solid ${borderColor}` };
};

// --- React Component ---
const VsiForDevice: React.FC = () => {
  // Get deviceId from URL parameter
  const { deviceId } = useParams<{ deviceId: string }>(); // Get the param as string initially

  const [vsiList, setVsiList] = useState<Vsi[]>([]);
  const [deviceName, setDeviceName] = useState<string | null>(null); // Optional: Store device name
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // API endpoint URL construction
  // Assumes backend route is /devices/:deviceId/vsi
  const apiUrl = deviceId ? `http://localhost:3333/devices/${deviceId}/vsi` : null; // Set to null if no deviceId

  // Fetch data using Axios based on deviceId
  const fetchVsiDataForDevice = useCallback(async () => {
    // Don't fetch if deviceId is missing or invalid
    if (!apiUrl) {
      setError("Device ID is missing in the URL.");
      setLoading(false);
      setVsiList([]); // Clear any previous list
      return;
    }
     // Optional: Validate if deviceId is a number before proceeding
     if (isNaN(Number(deviceId))) {
         setError("Invalid Device ID in URL.");
         setLoading(false);
         setVsiList([]);
         return;
     }

    setLoading(true);
    setError(null);
    try {
      // Fetch VSIs for the specific device
      const response = await axios.get<Vsi[]>(apiUrl);
      setVsiList(response.data);
      // Optional: Set device name from the first VSI's device info (if available)
      if (response.data.length > 0 && response.data[0].device?.name) {
          setDeviceName(response.data[0].device.name);
      } else {
          // Optionally fetch device name separately if needed and not included
          setDeviceName(null); // Reset if no data or device info missing
      }

    } catch (err) {
      console.error(`Axios fetch error for device ${deviceId}:`, err);
      if (axios.isAxiosError(err)) {
         // Handle 404 specifically if the device itself wasn't found
         if (err.response?.status === 404) {
             setError(`Device with ID ${deviceId} not found or has no VSIs.`);
         } else {
            setError(err.response?.data?.error || err.message || 'Failed to fetch VSI data');
         }
      } else {
         setError('An unexpected error occurred');
      }
       setVsiList([]); // Clear list on error
    } finally {
      setLoading(false);
    }
  }, [apiUrl, deviceId]); // Depend on apiUrl and deviceId

  // Fetch data when component mounts or deviceId changes
  useEffect(() => {
    fetchVsiDataForDevice();
  }, [fetchVsiDataForDevice]); // useEffect depends on the memoized fetch function

  // --- Styles (copied from VsiDisplayCompact, can be shared) ---
  const vsiCardStyle: React.CSSProperties = { border: '1px solid #ddd', borderRadius: '5px', marginBottom: '12px', padding: '10px 12px', backgroundColor: '#fff', fontSize: '0.9rem', lineHeight: '1.4' };
  const vsiHeaderStyle: React.CSSProperties = { margin: '0 0 8px 0', paddingBottom: '5px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1em' };
  const vsiDetailsStyle: React.CSSProperties = { margin: '3px 0', color: '#555', fontSize: '0.9em' };
  const peerTableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.9em' };
  const thTdStyle: React.CSSProperties = { border: '1px solid #eee', padding: '4px 6px', textAlign: 'left', verticalAlign: 'top' };
  const thStyle: React.CSSProperties = { ...thTdStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa' };
  const noDeviceStyle: React.CSSProperties = { fontStyle: 'italic', color: '#888', marginLeft: '4px', fontSize: '0.9em' };
  const deviceNameStyle: React.CSSProperties = { fontStyle: 'italic', color: '#0056b3', marginLeft: '4px', fontWeight: '500' };
  const errorStyle: React.CSSProperties = { color: 'red', padding: '10px', border: '1px solid red', backgroundColor: '#f8d7da', borderRadius: '5px', marginBottom: '15px' };


  // --- Render Logic ---
  return (
    <div style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', padding: '20px' }}>
       {/* Updated Title */}
      <h1 style={{ fontSize: '1.5em', marginBottom: '15px' }}>
         VSI Status for Device {deviceName ? `${deviceName} (ID: ${deviceId})` : `ID: ${deviceId}`}
      </h1>

      {/* Display Loading / Error */}
      {loading && <div>Loading VSI data for Device {deviceId}...</div>}
      {error && <div style={errorStyle}>Error: {error}</div>}

      {/* Display VSI List */}
      {!loading && !error && vsiList.length === 0 && <div>No VSIs found for this device.</div>}
      {!loading && !error && vsiList.length > 0 && (
        <div>
          {vsiList.map((vsi) => (
            <div key={vsi.id} style={vsiCardStyle}>
              {/* VSI Header */}
              <h2 style={vsiHeaderStyle}>
                <span>{vsi.name} <span style={{fontSize: '0.8em', color: '#666'}}>(ID: {vsi.id})</span></span>
                <span style={getStatusBadgeStyle(vsi.state)}>
                    {vsi.state?.toUpperCase().replace('*','')}
                 </span>
              </h2>

              {/* VSI Details (compact) */}
              <p style={vsiDetailsStyle}>
                {/* Device info is redundant here as we are on device page, maybe omit? */}
                <strong>MTU:</strong> {vsi.mtu ?? 'N/A'} |{' '}
                <strong>Type:</strong> {vsi.type ?? 'N/A'} |{' '}
                <strong>MAC:</strong> {vsi.macLearning ?? 'N/A'} |{' '}
                <strong>Encap:</strong> {vsi.encapsulation ?? 'N/A'}
                 {vsi.vlanId && ` | VlanID: ${vsi.vlanId}`}
              </p>

              {/* VSI Peers Table */}
              {(!vsi.peers || vsi.peers.length === 0) ? (
                <p style={{ ...vsiDetailsStyle, fontStyle: 'italic', marginTop: '8px' }}>No peers configured.</p>
              ) : (
                <table style={peerTableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Peer</th>
                      <th style={thStyle}>PW ID</th>
                      <th style={thStyle}>State</th>
                      <th style={thStyle}>In Label</th>
                      <th style={thStyle}>Out Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vsi.peers.map((peer) => (
                      <tr key={peer.id}>
                        <td style={thTdStyle}>
                          {peer.peerAddress}
                          {peer.peerDeviceName ? (
                            <span style={deviceNameStyle}>({peer.peerDeviceName})</span>
                          ) : (
                            <span style={noDeviceStyle}>(No device)</span>
                          )}
                        </td>
                        <td style={thTdStyle}>{peer.pwId}</td>
                        <td style={thTdStyle}>
                          <span style={getStatusBadgeStyle(peer.pwState)}>
                              {peer.pwState?.toUpperCase()}
                          </span>
                        </td>
                        <td style={thTdStyle}>{peer.pwInLabel}</td>
                        <td style={thTdStyle}>{peer.pwOutLabel ?? <span style={{color: '#999'}}>N/A</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VsiForDevice;