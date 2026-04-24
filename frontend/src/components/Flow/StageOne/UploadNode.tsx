import { useState, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    Handle,
    Position,
    NodeChange,
    EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
const stateKey = 'upUploadNodeState';
const UploadNode = ({ data }: any) => {
    const [files, setFiles] = useState<File[]>([]);
    const [collapsed, setCollapsed] = useState(false);

    const emptyUploadDocs = Array.from(Array(40).keys()).map((x: any) => { return { title: '', file: null } })
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
            libraryName: '',
            docs: emptyUploadDocs,
            languageOfDocs: 'English',
        }
    }

    const initialData = getInitialUploadNodeData()

    const [uploadLibraryName, setUploadLibraryName] = useState(initialData.libraryName)
    const [uploadDocs, setUploadDocs] = useState(initialData.docs)
    const [languageOfDocs, setLanguageOfDocs] = useState(initialData.languageOfDocs)

    useEffect(() => {
        // localStorage.setItem(
        //     stateKey,
        //     JSON.stringify({
        //         libraryName: uploadLibraryName,
        //         docs: uploadDocs,
        //         languageOfDocs: languageOfDocs,
        //     })
        // )

        data.settingsCallback({
            ...data.currentSettings,
            libraryName: uploadLibraryName,
            docs: uploadDocs,
            languageOfDocs: languageOfDocs,
        })

    }, [uploadLibraryName, uploadDocs, languageOfDocs, uploadDocs])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // const selected = Array.from(e.target.files || []);
        // setFiles(selected);
        const files = e.target.files
        if (files) {
            const docs = Array.from(files).map((file: any) => { return { title: file.name.split('.pdf')[0], file: file } })
            setUploadDocs(docs)
        }
    };

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
        gap: 10,
        marginBottom: 12,
    };

    const inputStyle: React.CSSProperties = {
        flex: 1,
        minWidth: 0,
        padding: '6px 8px',
        fontSize: 13,
        border: '1px solid #ccc',
        borderRadius: 6,
        height: 30,
        boxSizing: 'border-box',
    };

    return (
        <div
            style={{
                width: 300,
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

            {/* BODY (hidden when collapsed) */}
            {!collapsed && (
                <div style={{ padding: 12 }}>
                    {/* LIBRARY ROW */}
                    {data.formValidation && (
                        <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'flex-start', borderRadius: '4px', marginBottom: '8px' }}>
                            {uploadLibraryName === undefined || uploadLibraryName.trim() === '' ? (
                                <div className="text-nav dark:text-nav-dark text-sm" style={{ background: '#ffcccc' }}>* Library name cannot be empty.</div>
                            ) : null}
                            {uploadDocs.filter((d: { file: null; title: string; })=> d.file !== null && d.title !== '').length === 0 ? (
                                <div className="text-nav dark:text-nav-dark text-sm" style={{ background: '#ffcccc' }}>* Please select at least one document.</div>
                            ) : null}
                        </div>
                    )}
                    <div style={rowStyle}>
                        <div style={labelStyle}>Library Name</div>
                        <input
                            type="text"
                            placeholder="Enter library name"
                            value={uploadLibraryName || ''}
                            style={inputStyle}
                            onChange={(e) => setUploadLibraryName(e.target.value)}
                        />
                    </div>

                    {/* FILE UPLOAD ROW */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 10,
                            marginBottom: 14,
                            alignItems: 'flex-start',
                        }}
                    >
                        <div style={labelStyle}>Select Documents</div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <input
                                id="fileUpload"
                                type="file"
                                multiple
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />

                            <button
                                type="button"
                                disabled={Boolean(data.currentSettings?.restriction_without_login) && !data.user}
                                onClick={() =>
                                    document.getElementById('fileUpload')?.click()
                                }
                                style={{
                                    padding: '4px 10px',
                                    fontSize: 12,
                                    height: 28,
                                    border: '1px solid #ccc',
                                    borderRadius: 5,
                                    background: '#f5f5f5',
                                    cursor: 'pointer',
                                }}
                            >
                                Choose Files
                            </button>

                            <div
                                style={{
                                    fontSize: 11,
                                    color: '#666',
                                    marginTop: 4,
                                    lineHeight: '14px',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {uploadDocs.filter((d: { file: null; title: string; }) => d.file !== null && d.title !== '').length === 0
                                    ? 'No files selected'
                                    : uploadDocs.filter((d: { file: null; title: string; }) => d.file !== null && d.title !== '').map((f: { title: any; }) => f.title).join(', ')}
                            </div>
                        </div>
                    </div>

                    {/* LANGUAGE ROW */}
                    <div style={rowStyle}>
                        <div style={labelStyle}>Language of Document</div>

                        <select
                            style={inputStyle}
                            value={languageOfDocs || 'English'}
                            onChange={(e) => setLanguageOfDocs(e.target.value)}
                        >
                            <option value="English">English</option>
                            <option value="French">French</option>
                            <option value="Spanish">Spanish</option>
                        </select>

                    </div>
                </div>
            )}

            <Handle type="source" position={Position.Right} />
        </div>
    );
};



export default UploadNode;