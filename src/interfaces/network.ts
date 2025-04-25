// src/interfaces/network.ts (or types.ts)

export interface DeviceInfo {
    id: number;
    name: string;
    ip: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AsnInfo {
    asn: number;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface BgpSession {
    id: number;
    localAsn: number;
    peerAsn: number;
    peerIp: string;
    status: string;
    deviceId: number;
    asnId: number;
    createdAt: string; // Assuming ISO string format
    updatedAt: string; // Assuming ISO string format
    device: DeviceInfo; // Nested device info from include
    asn: AsnInfo;       // Nested ASN info from include
}

export interface Device {
    id: number;
    name: string;
    ip: string;
    createdAt?: string; // Optional: from API response
    updatedAt?: string; // Optional: from API response
}

export interface VsiPeerInfo {
    id: number;
    peerAddress: string;
    pwId: number;
    pwState: string;
    pwMacLearning: string;
    pwMacLimit?: number | null;
    pwInLabel: number;
    pwOutLabel?: number | null; // Made nullable in previous step
    tunnelPolicy?: string | null;
    peerDeviceName?: string | null; // Added by backend enrichment
    // ... other fields if needed
}

export interface Vsi {
    id: number;
    name: string;
    state: string;
    type: string;
    mtu: number;
    vlanId?: number | null;
    macLearning: string;
    encapsulation: string;
    description?: string | null;
    deviceId: number; // Included from Prisma relation
    createdAt?: string;
    updatedAt?: string;
    device?: DeviceInfo; // Included via Prisma include
    peers?: VsiPeerInfo[]; // Included via Prisma include & enriched
}

// Type for the data submitted by the form
export type DeviceFormData = Omit<Device, 'id' | 'createdAt' | 'updatedAt'>;
// src/interfaces/network.ts (or types.ts)

export interface DeviceInfo { /* ... as defined before ... */ }
export interface VsiPeerInfo { /* ... as defined before, including peerDeviceName? ... */ }
export interface Vsi { /* ... as defined before, including device? and peers? ... */ }

// Add React Flow specific types if needed for custom nodes/edges
// Example (can be defined directly in the component too)
export interface VsiNodeData {
    label: string;
    name: string;
    state: string;
    mtu: number;
    type: string;
    // Add other VSI details you want accessible in the node
}

export interface PeerNodeData {
    ip: string;
    name: string | null; // Device name (can be null)
}

export interface VsiEdgeData {
    pwState: string;
    pwId: number;
    // Add other peer details if needed on the edge
}
// You can add interfaces for VSI, VsiPeer etc. here as well