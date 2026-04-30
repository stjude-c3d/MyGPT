import { useState, useCallback, useEffect } from 'react';
import {
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import defaultSettings from '../../../utils/DefaultState'

const stateKey = 'upEmbeddingModelNodeState';
const EmbeddingModelNode = ({ data }: any) => {
    const [collapsed, setCollapsed] = useState(false);
    const [modelOptions, setModelOptions] = useState([
        ...defaultSettings.embedding_models,
    ]);

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
            selectedEmbeddingModel: '',
            distanceFn: 'l2'
        }
    }

    const initialData = getInitialUploadNodeData()

    const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState(initialData.selectedEmbeddingModel)
    const [distanceFn, setDistanceFn] = useState(initialData.distanceFn)

    useEffect(() => {
        // localStorage.setItem(
        //     stateKey,
        //     JSON.stringify({
        //         selectedEmbeddingModel: selectedEmbeddingModel,
        //     })
        // )
        data.settingsCallback({
            ...data.currentSettings,
            selectedEmbeddingModel: selectedEmbeddingModel,
            distanceFn: distanceFn,
        })
    }, [selectedEmbeddingModel])

    const labelStyle: React.CSSProperties = {
        fontSize: 13,
        width: 120,
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

    const inputStyle: React.CSSProperties = {
        flex: 1,
        padding: '6px 8px',
        fontSize: 13,
        border: '1px solid #ccc',
        borderRadius: 6,
        height: 30,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
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
        <div style={{ width: 400, border: '1px solid #ccc', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
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
                    <div style={rowStyle}>
                        <div style={labelStyle}>Model</div>

                        <select
                            style={inputStyle}
                            value={selectedEmbeddingModel}
                            onChange={(e) => setSelectedEmbeddingModel(e.target.value)}
                        >
                            {modelOptions.map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={rowStyle}>
                        <div style={labelStyle}>Distance Function</div>

                        <select style={inputStyle} value={distanceFn} onChange={(e) => setDistanceFn(e.target.value)}>
                            <option value="l2">Squared L2</option>
                            <option value="cosine">Cosine similarity</option>
                            <option value="inner">Inner product</option>
                        </select>
                    </div>
                </div>
            )}

            <Handle type="target" position={Position.Left} style={{ background: 'none', border: 'none' }} />
            <Handle type="source" position={Position.Right} id="embeddingModel-source-right" />
            {/* <Handle type="source" position={Position.Bottom} id="embeddingModel-source-bottom" /> */}
        </div>
    );
};

export default EmbeddingModelNode;
