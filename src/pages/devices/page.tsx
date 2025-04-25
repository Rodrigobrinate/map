// src/components/DeviceManagement.tsx
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import axios, { AxiosError } from 'axios';

// --- Interfaces ---
interface Device {
    id: number;
    name: string;
    ip: string;
    createdAt?: string;
    updatedAt?: string;
}

type DeviceFormData = Omit<Device, 'id' | 'createdAt' | 'updatedAt'>;

// --- API Configuration ---
// Use environment variable or configure Axios instance in real app
const API_BASE_URL = 'http://localhost:3333/'; // Adjust if your API has a different base path (e.g., '/api')
const DEVICES_API_URL = `${API_BASE_URL}devices`;

// --- Helper: Format Date ---
const formatTimestamp = (isoString?: string): string => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) { return 'Invalid Date'; }
};

// --- Device Form Sub-Component ---
interface DeviceFormProps {
    onSubmit: (formData: DeviceFormData) => Promise<void>; // Make async for loading state
    onCancel: () => void;
    initialData?: Device | null;
    isSubmitting: boolean; // To disable button during submission
}

const DeviceForm: React.FC<DeviceFormProps> = ({ onSubmit, onCancel, initialData, isSubmitting }) => {
    const [name, setName] = useState<string>('');
    const [ip, setIp] = useState<string>('');
    const isEditing = !!initialData;

    useEffect(() => {
        // Pre-fill form if editing
        if (initialData) {
            setName(initialData.name || '');
            setIp(initialData.ip || '');
        } else {
            // Clear form if switching from edit to add
            setName('');
            setIp('');
        }
    }, [initialData]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name || !ip) {
            alert('Name and IP address are required.'); // Simple validation
            return;
        }
        // Basic IP format check (can be improved)
        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
             alert('Please enter a valid IP address format (e.g., 192.168.1.1).');
             return;
        }
        await onSubmit({ name, ip });
    };

    const formStyle: React.CSSProperties = {
        border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px', backgroundColor: '#f9f9f9'
    };
    const inputGroupStyle: React.CSSProperties = { marginBottom: '10px' };
    const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '3px', fontWeight: 'bold' };
    const inputStyle: React.CSSProperties = { width: '95%', padding: '8px', border: '1px solid #ccc', borderRadius: '3px' };
    const buttonGroupStyle: React.CSSProperties = { marginTop: '15px' };
    const buttonStyle: React.CSSProperties = { padding: '8px 15px', marginRight: '10px', borderRadius: '3px', border: 'none', cursor: 'pointer' };
    const submitButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: '#007bff', color: 'white' };
    const cancelButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: '#6c757d', color: 'white' };


    return (
        <form onSubmit={handleSubmit} style={formStyle}>
            <h3>{isEditing ? 'Edit Device' : 'Add New Device'}</h3>
            <div style={inputGroupStyle}>
                <label htmlFor="deviceName" style={labelStyle}>Name:</label>
                <input
                    type="text"
                    id="deviceName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                    required
                    disabled={isSubmitting}
                />
            </div>
            <div style={inputGroupStyle}>
                <label htmlFor="deviceIp" style={labelStyle}>IP Address:</label>
                <input
                    type="text"
                    id="deviceIp"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    style={inputStyle}
                    required
                    disabled={isSubmitting}
                    placeholder="e.g., 192.168.1.1"
                />
            </div>
            <div style={buttonGroupStyle}>
                <button type="submit" style={submitButtonStyle} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (isEditing ? 'Update Device' : 'Add Device')}
                </button>
                <button type="button" onClick={onCancel} style={cancelButtonStyle} disabled={isSubmitting}>
                    Cancel
                </button>
            </div>
        </form>
    );
};


// --- Main Device Management Component ---
const DeviceManagement: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null) as any // Device being edited
    const [showAddForm, setShowAddForm] = useState<boolean>(false); // Toggle for add form
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Loading state for form submissions

    // Fetch devices function using useCallback
    const fetchDevices = useCallback(async () => {
        setLoading(true);
        setError(null); // Clear previous errors
        try {
            const response = await axios.get<Device[]>(DEVICES_API_URL);
            setDevices(response.data);
        } catch (err) {
            console.error("Fetch error:", err);
            setError(axios.isAxiosError(err) ? (err.response?.data?.error || err.message) : 'Failed to fetch devices');
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array - fetchDevices function itself doesn't change

    // Initial fetch on mount
    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]); // fetchDevices is stable due to useCallback

    // --- Handlers ---
    const handleAddDevice = async (formData: DeviceFormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await axios.post(DEVICES_API_URL, formData);
            setShowAddForm(false); // Hide form on success
            await fetchDevices(); // Refresh list
        } catch (err) {
             console.error("Add error:", err);
             setError(axios.isAxiosError(err) ? (err.response?.data?.error || err.message) : 'Failed to add device');
             // Keep form open on error
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateDevice = async (formData: DeviceFormData) => {
        if (!editingDevice) return; // Should not happen if form is shown for editing
        setIsSubmitting(true);
        setError(null);
        try {
            await axios.put(`${DEVICES_API_URL}/${editingDevice.id}`, formData);
            setEditingDevice(null); // Hide form on success
            await fetchDevices(); // Refresh list
        } catch (err) {
             console.error("Update error:", err);
             setError(axios.isAxiosError(err) ? (err.response?.data?.error || err.message) : 'Failed to update device');
             // Keep form open on error
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDevice = async (id: number, name: string) => {
        // Confirmation dialog
        if (!window.confirm(`Are you sure you want to delete device "${name}" (ID: ${id})? This might fail if it's referenced by other records (BGP, VSI).`)) {
            return;
        }
        setError(null); // Clear previous errors specific to delete
        // Note: Consider adding a specific loading state for the deleted row
        try {
            await axios.delete(`${DEVICES_API_URL}/${id}`);
            await fetchDevices(); // Refresh list
        } catch (err) {
             console.error("Delete error:", err);
             setError(axios.isAxiosError(err) ? (err.response?.data?.error || err.message) : 'Failed to delete device');
        }
        // No finally setIsSubmitting needed here unless you add row-specific loading
    };

    const handleEditClick = (device: Device) => {
        setShowAddForm(false); // Hide add form if open
        setEditingDevice(device); // Set device to edit, which shows the edit form
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top to see the form
    };

    const handleCancelForm = () => {
        setShowAddForm(false);
        setEditingDevice(null);
        setError(null); // Clear errors when cancelling
    };

    // --- Styles ---
    const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '0.9rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
    const thStyle: React.CSSProperties = { border: '1px solid #dee2e6', padding: '8px 10px', textAlign: 'left', backgroundColor: '#f8f9fa', fontWeight: '600' };
    const tdStyle: React.CSSProperties = {backgroundColor: '#f8d7da', border: '1px solid #dee2e6', padding: '6px 10px', textAlign: 'left', verticalAlign: 'middle' };
    const actionsCellStyle: React.CSSProperties = { ...tdStyle, width: '120px', textAlign: 'center' }; // Fixed width for actions
    const actionButtonStyle: React.CSSProperties = { padding: '4px 8px', margin: '0 3px', borderRadius: '3px', border: '1px solid transparent', cursor: 'pointer', fontSize: '0.85em' };
    const editButtonStyle: React.CSSProperties = { ...actionButtonStyle, backgroundColor: '#ffc107', borderColor: '#ffc107', color: '#212529'};
    const deleteButtonStyle: React.CSSProperties = { ...actionButtonStyle, backgroundColor: '#dc3545', borderColor: '#dc3545', color: 'white'};
    const addButtonStyle: React.CSSProperties = { padding: '8px 15px', marginBottom: '15px', borderRadius: '3px', border: 'none', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', fontWeight: 'bold'};
    const errorStyle: React.CSSProperties = { color: 'red', padding: '10px', border: '1px solid red', backgroundColor: '#f8d7da', borderRadius: '5px', marginBottom: '15px' };

    // --- Render Logic ---
    return (
        <div style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', padding: '20px' }}>
            <h1 style={{ fontSize: '1.5em', marginBottom: '15px' }}>Device Management</h1>

            {/* Display Errors */}
            {error && <div style={errorStyle}>Error: {error}</div>}

            {/* Toggle Add Form Button */}
            {!showAddForm && !editingDevice && (
                <button onClick={() => { setShowAddForm(true); setError(null); }} style={addButtonStyle}>
                    + Add New Device
                </button>
            )}

             {/* Add/Edit Form Area */}
             {(showAddForm || editingDevice) && (
                <DeviceForm
                    onSubmit={editingDevice ? handleUpdateDevice : handleAddDevice}
                    onCancel={handleCancelForm}
                    initialData={editingDevice}
                    isEditing={!!editingDevice}
                    isSubmitting={isSubmitting}
                />
             )}


            {/* Loading Indicator */}
            {loading && <div>Loading devices...</div>}

            {/* Device List Table */}
            {!loading && devices.length === 0 && !error && <div>No devices found.</div>}
            {!loading && devices.length > 0 && (
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>IP Address</th>
                            <th style={thStyle}>Updated At</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map((device) => (
                            <tr key={device.id}>
                                <td style={tdStyle}>{device.id}</td>
                                <td style={tdStyle}><a href={"http://localhost:5173/devices/"+device.id+"/vsi"}>{device.name}</a></td>
                                <td style={tdStyle}>{device.ip}</td>
                                <td style={tdStyle}>{formatTimestamp(device.updatedAt)}</td>
                                <td style={actionsCellStyle}>
                                    <button
                                        onClick={() => handleEditClick(device)}
                                        style={editButtonStyle}
                                        disabled={isSubmitting} // Disable if another form is submitting
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDevice(device.id, device.name)}
                                        style={deleteButtonStyle}
                                        disabled={isSubmitting} // Disable if a form is submitting
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default DeviceManagement;