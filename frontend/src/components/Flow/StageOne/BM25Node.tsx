import { useState, useEffect } from 'react';
import {
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const stateKey = 'upBm25NodeState';
const BM25Node = ({ data }: any) => {
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

        // data.settingsCallback({
        //     ...data.currentSettings,
        //     useBM25: 'Yes',
        // })

        return {
            useBM25: 'Yes'
        }
    }

    const initialData = getInitialUploadNodeData()

    const [useBM25, setUseBM25] = useState(initialData.useBM25)

    useEffect(() => {
        // localStorage.setItem(
        //     stateKey,
        //     JSON.stringify({
        //         useBM25: useBM25,
        //     })
        // )

        data.settingsCallback({
            ...data.currentSettings,
            useBM25: useBM25,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useBM25])

    return (
        <div style={{ width: 260, border: '1px solid #ccc', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 13, color: '#2a4759' }}>BM25</div>

                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                onClick={() => setUseBM25(true)}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: 12,
                                    border: '1px solid #ccc',
                                    background: useBM25 ? '#2a4759' : '#f5f5f5',
                                    color: useBM25 ? '#fff' : '#000',
                                    borderRadius: 5,
                                }}
                            >
                                Yes
                            </button>

                            <button
                                onClick={() => setUseBM25(false)}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: 12,
                                    border: '1px solid #ccc',
                                    background: !useBM25 ? '#2a4759' : '#f5f5f5',
                                    color: !useBM25 ? '#fff' : '#000',
                                    borderRadius: 5,
                                }}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Handle type="target" position={Position.Left} style={{ background: 'none', border: 'none' }} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
};

export default BM25Node;
