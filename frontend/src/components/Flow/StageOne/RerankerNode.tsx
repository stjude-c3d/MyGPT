import { useState, useEffect } from 'react';
import {
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const stateKey = 'upRerankerNodeState';
const RerankerNode = ({ data }: any) => {
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
            reranker: 'qnli-electra-base (default)'
        }
    }

    const initialData = getInitialUploadNodeData()

    const [reranker, setReranker] = useState(initialData.reranker)

    useEffect(() => {
        // localStorage.setItem(
        //     stateKey,
        //     JSON.stringify({
        //         reranker: reranker,
        //     })
        // )
        data.settingsCallback({
            ...data.currentSettings,
            reranker: reranker,
        })
    }, [reranker])

    const labelStyle: React.CSSProperties = {
        fontSize: 13,
        width: 110,
        color: '#2a4759',
        flexShrink: 0,
    };

    const selectStyle: React.CSSProperties = {
        padding: '6px 8px',
        fontSize: 13,
        border: '1px solid #ccc',
        borderRadius: 6,
        height: 30,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        width: '190px'
    };


    return (
        <div style={{ width: 330, border: '1px solid #ccc', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
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
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={labelStyle}>Reranker</div>

                        <select style={selectStyle} value={reranker} onChange={(e) => setReranker(e.target.value)}>
                            <option value="qnli-electra-base (default)">qnli-electra-base (default)</option>
                            <option value="zerank-2">zerank-2</option>
                            <option value="gte-multilingual-reranker">gte-multilingual-reranker</option>
                            <option value="mmarco-mMiniLMv2-L12-H384-v1">mmarco-mMiniLMv2-L12-H384-v1</option>
                            <option value="none">None</option>
                        </select>
                    </div>
                </div>
            )}

            <Handle type="target" position={Position.Top} id="reranker-target-top" style={{ left: 15, transform: 'none', background: 'none', border: 'none' }} />
            <Handle type="target" position={Position.Bottom} id="reranker-target-bottom" style={{ left: 15, transform: 'none', background: 'none', border: 'none' }} />
            <Handle type="target" position={Position.Left} id="reranker-target-left" style={{ background: 'none', border: 'none' }} />
            <Handle type="source" position={Position.Bottom} style={{ background: 'none', border: 'none' }} />
        </div>
    );
};

export default RerankerNode;