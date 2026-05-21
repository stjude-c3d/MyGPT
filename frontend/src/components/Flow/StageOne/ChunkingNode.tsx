import { useState, useEffect } from 'react';
import {
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const stateKey = 'upChunkingNodeState';
const ChunkingNode = ({ data }: { data: { title: string, settingsCallback: (settings: any) => void, currentSettings: any } }) => {
    const [collapsed, setCollapsed] = useState(false);

    const getInitialUploadNodeData = () => {
        try {
            const saved = localStorage.getItem(stateKey)
            if (saved) {
                return JSON.parse(saved)
            }
        } catch (error) {
            console.error('Failed to parse uploadNodeData from localStorage:', error)
        }

        return {
            chunkingMethod: 'fixed_chunk_size',  // ['fixed_chunk_size', 'structure_preserving']
            chunkSizeActive: true,
            useOverlap: 'Yes',
            chunkSize: '1000',  // ['500', '750', '1000', '1200']
        }
    }

    const initialData = getInitialUploadNodeData()

    const [chunkingMethod, setChunkingMethod] = useState(initialData.chunkingMethod)
    const [chunkSizeActive, setChunkSizeActive] = useState(initialData.chunkSizeActive)
    const [useOverlap, setUseOverlap] = useState(initialData.useOverlap)
    const [chunkSize, setChunkSize] = useState(initialData.chunkSize)

    useEffect(() => {
        // localStorage.setItem(
        //     stateKey,
        //     JSON.stringify({
        //         chunkingMethod: chunkingMethod,
        //         chunkSizeActive: chunkSizeActive,
        //         useOverlap: useOverlap,
        //         chunkSize: chunkSize,
        //     })
        // )

        data.settingsCallback({
            ...data.currentSettings,
            chunkingMethod: chunkingMethod,
            chunkSizeActive: chunkSizeActive,
            useOverlap: useOverlap,
            chunkSize: chunkSize,
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chunkingMethod, chunkSizeActive, useOverlap, chunkSize])

    const labelStyle: React.CSSProperties = {
        fontSize: 13,
        width: 140,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        color: '#2a4759',
    };

    const rowStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginBottom: 12,
    };

    const selectStyle: React.CSSProperties = {
        padding: '6px 8px',
        fontSize: 13,
        border: '1px solid #ccc',
        borderRadius: 6,
        height: 30,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        width: '155px'
    };

    return (
        <div
            style={{
                width: 325,
                border: '1px solid #ccc',
                borderRadius: 10,
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                overflow: 'hidden',
            }}
        >
            {/* HEADER */}
            <div
                style={{
                    padding: '6px 10px',
                    fontWeight: 600,
                    background: 'rgb(103, 127, 139)',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <span>{data.title}</span>

                {/* Collapse Button */}
                <button
                    onClick={() => setCollapsed((prev) => !prev)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: 14,
                        cursor: 'pointer',
                    }}
                >
                    {collapsed ? '➕' : '➖'}
                </button>
            </div>

            {!collapsed && (
                <div style={{ padding: 12 }}>
                    {/* Chunking Method */}
                    <div style={rowStyle}>
                        <div style={labelStyle}>Chunking Method</div>

                        <select name='chunking_method' style={{ ...selectStyle }} value={chunkingMethod} onChange={(e) => {
                            const option = e.target.value
                            setChunkingMethod(option)
                            if (option === 'fixed_chunk_size') {
                                setChunkSizeActive(true)
                                setChunkSize('500')
                            } else {
                                setChunkSizeActive(false)
                            }
                        }}>
                            <option value="fixed_chunk_size">Fixed Chunk size</option>
                            <option value="structure_preserving">Structure preserving</option>
                        </select>
                    </div>

                    {/* Chunk Size */}
                    <div style={rowStyle}>
                        <div style={labelStyle}>Chunk Size</div>
                        <select style={selectStyle} value={chunkSize} disabled={!chunkSizeActive} onChange={(e) => setChunkSize(e.target.value)}>
                            <option value="500">500</option>
                            <option value="750">750</option>
                            <option value="1000">1000</option>
                            <option value="1200">1200</option>
                        </select>
                    </div>

                    {/* Overlap */}
                    <div style={rowStyle}>
                        <div style={labelStyle}>Use Overlap</div>
                        <select style={selectStyle} value={useOverlap} onChange={(e) => setUseOverlap(e.target.value)}>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>
            )}

            <Handle type="target" position={Position.Left} style={{ background: 'none', border: 'none' }} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
};

export default ChunkingNode;
