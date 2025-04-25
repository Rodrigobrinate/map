// src/components/VsiVisualization.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios, { AxiosError } from 'axios';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    addEdge,
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    Connection,
    MarkerType,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { Vsi, VsiPeerInfo } from '../../interfaces/network'; // Adjust path

// --- Helper: Status Badge Styling (Reuse) ---
const getStatusBadgeStyle = (status?: string): React.CSSProperties => { /* ... (same as before) ... */ };

// --- Custom Node Components (Wrapped with React.memo) ---
const VsiNode = React.memo(({ data }: { data: Vsi }) => (
     // --- VSI Node JSX (same as before) ---
     <div style={{ padding: '8px 12px', border: '1px solid #3498db', borderRadius: '5px', background: '#eaf5ff', fontSize: '11px', textAlign: 'center', minWidth: '150px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '3px', color: '#2980b9' }}>VSI: {data.name}</div>
        <div style={{ marginBottom: '3px' }}> <span style={getStatusBadgeStyle(data.state)}>{data.state?.toUpperCase().replace('*','')}</span> MTU: {data.mtu} </div>
        <div style={{ color: '#555' }}>Type: {data.type}</div>
    </div>
));

const PeerNode = React.memo(({ data }: { data: { ip: string; name: string | null } }) => (
    // --- Peer Node JSX (same as before) ---
    <div style={{ padding: '8px 12px', border: '1px solid #95a5a6', borderRadius: '5px', background: '#ecf0f1', fontSize: '11px', textAlign: 'center', minWidth: '150px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>{data.name ? `${data.name}` : `Peer Device`}</div>
        <div style={{ color: '#34495e' }}>{data.ip}</div>
    </div>
));

// --- API Configuration ---
const API_BASE_URL = 'http://localhost:3333/';
const VSI_API_URL = `${API_BASE_URL}vsi`;

// --- Main Visualization Component ---
const VsiVisualization: React.FC = () => {
    // React Flow state
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Data fetching and filtering state
    const [allVsis, setAllVsis] = useState<Vsi[]>([]); // Store all fetched VSIs
    const [filterName, setFilterName] = useState<string>('');
    const [filterState, setFilterState] = useState<string>(''); // e.g., 'up', 'down', '' for all
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Memoize node types
    const nodeTypes = useMemo(() => ({ vsiNode: VsiNode, peerNode: PeerNode }), []);

    // Fetch ALL data initially
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); setError(null);
            try {
                console.log("Fetching all VSI data...");
                const response = await axios.get<Vsi[]>(VSI_API_URL);
                setAllVsis(response.data || []); // Store all data
                console.log(`Workspaceed ${response.data?.length || 0} VSIs.`);
            } catch (err) {
                console.error("Axios fetch error:", err); setError(axios.isAxiosError(err) ? (err.response?.data?.error || err.message) : 'Failed to fetch VSI data');
            } finally { setLoading(false); }
        };
        fetchData();
    }, []); // Fetch only once on mount

    // Process data whenever filters or allVsis change
    useEffect(() => {
        console.log(`Processing data based on filters: Name='${filterName}', State='${filterState}'`);
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const peerNodeMap = new Map<string, Node>();

        let vsiYPos = 100; const peerYPos = 400; let peerXPos = 100;

        // Apply filters
        const filteredVsis = allVsis.filter(vsi => {
            const nameMatch = filterName ? vsi.name.toLowerCase().includes(filterName.toLowerCase()) : true;
            const stateMatch = filterState ? vsi.state.toLowerCase().replace('*','') === filterState.toLowerCase() : true;
            return nameMatch && stateMatch;
        });
         console.log(`Filtered down to ${filteredVsis.length} VSIs.`);

        // Limit rendering if too many results after filtering (optional safety net)
        const vsisToRender = filteredVsis; //.slice(0, 100); // Example limit
        // if (filteredVsis.length > 100) {
        //     console.warn(`Rendering only the first 100 VSIs out of ${filteredVsis.length} filtered results.`);
        // }


        // Generate Nodes and Edges from FILTERED data
        vsisToRender.forEach((vsi, vsiIndex) => {
            const vsiNodeId = `vsi-${vsi.id}`;
            newNodes.push({ id: vsiNodeId, type: 'vsiNode', position: { x: 150 + vsiIndex * 250, y: vsiYPos }, data: vsi });

            if (vsi.peers?.length) {
                vsi.peers.forEach((peer) => {
                    const peerIp = peer.peerAddress; const peerNodeId = `peer-${peerIp}`;
                    let peerNode = peerNodeMap.get(peerIp);
                    if (!peerNode) {
                        peerNode = { id: peerNodeId, type: 'peerNode', position: { x: peerXPos, y: peerYPos }, data: { ip: peerIp, name: peer.peerDeviceName } };
                        newNodes.push(peerNode); peerNodeMap.set(peerIp, peerNode); peerXPos += 200;
                    }
                    const edgeId = `edge-${vsi.id}-${peer.id}`; const isPeerUp = peer.pwState?.toLowerCase() === 'up';
                    newEdges.push({ id: edgeId, source: vsiNodeId, target: peerNodeId, style: { stroke: isPeerUp ? '#2ecc71' : '#e74c3c', strokeWidth: 2 }, animated: isPeerUp, markerEnd: { type: MarkerType.ArrowClosed, color: isPeerUp ? '#2ecc71' : '#e74c3c' }, data: { pwState: peer.pwState, pwId: peer.pwId } });
                });
            }
        });

        setNodes(newNodes);
        setEdges(newEdges);
        console.log(`Generated ${newNodes.length} nodes and ${newEdges.length} edges for ReactFlow.`);

    }, [allVsis, filterName, filterState, setNodes, setEdges]); // Re-run processing when data or filters change


    const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    // --- Filter Styles ---
     const filterContainerStyle: React.CSSProperties = { padding: '10px 15px', backgroundColor: '#f1f1f1', marginBottom: '15px', borderRadius: '5px', display: 'flex', gap: '15px', alignItems: 'center' };
     const filterInputStyle: React.CSSProperties = { padding: '5px 8px', border: '1px solid #ccc', borderRadius: '3px' };


    // --- Render Logic ---
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '95vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', padding: '10px' }}> {/* Flex column layout */}
             <h1 style={{ textAlign: 'center', fontSize: '1.5em', margin: '0 0 10px 0' }}>VSI Peer Visualization</h1>

             {/* Filter Controls */}
             <div style={filterContainerStyle}>
                 <label htmlFor="vsiNameFilter">Filter by Name:</label>
                 <input
                     type="text"
                     id="vsiNameFilter"
                     placeholder="Enter VSI name..."
                     value={filterName}
                     onChange={(e) => setFilterName(e.target.value)}
                     style={filterInputStyle}
                 />
                 <label htmlFor="vsiStateFilter">Filter by State:</label>
                 <select
                     id="vsiStateFilter"
                     value={filterState}
                     onChange={(e) => setFilterState(e.target.value)}
                      style={filterInputStyle}
                 >
                     <option value="">All States</option>
                     <option value="up">Up</option>
                     <option value="down">Down</option>
                     {/* Add other states if they exist */}
                 </select>
                 <span>(Displaying {nodes.length} nodes, {edges.length} edges)</span>
             </div>

            {/* Loading/Error Messages */}
            {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading all VSI data...</div>}
            {error && <div style={{ color: 'red', padding: '10px', border: '1px solid red', margin: '0 15px' }}>Error: {error}</div>}

            {/* React Flow Container */}
            <div style={{ flexGrow: 1, border: '1px solid #ccc' }}> {/* Flex grow to take remaining height */}
                 {!loading && !error && (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        attributionPosition="bottom-right"
                    >
                        <Background color="#aaa" gap={16} />
                        <Controls />
                        <MiniMap nodeStrokeWidth={3} zoomable pannable />
                    </ReactFlow>
                 )}
            </div>
        </div>
    );
};

export default VsiVisualization;