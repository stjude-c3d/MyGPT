import { useState, useEffect } from 'react';
import {
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const stateKey = 'sePromptNodeState';
const PromptNode =({ data }: any) => {

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
            systemPrompt: data.currentSettings?.system_prompt || '',
            contextParameters: {
                maximum_chunks_count: data.currentSettings?.maximum_chunks_count || '15',
                no_chunk_cutoff: data.currentSettings?.no_chunk_cutoff || false,
            },
            llmParameters: {
                temperature: data.currentSettings?.temperature || 0.4,
                top_k: data.currentSettings?.top_k || 20,
                top_p: data.currentSettings?.top_p || 0.7,
            }
        }
    }

    const initialData = getInitialUploadNodeData()

    const [systemPrompt, setSystemPrompt] = useState(initialData.systemPrompt);
    const [contextParameters, setContextParameters] = useState(initialData.contextParameters);
    const [llmParameters, setLlmParameters] = useState(initialData.llmParameters);


    useEffect(() => {
        // localStorage.setItem(
        //     stateKey,
        //     JSON.stringify({
        //         systemPrompt: systemPrompt,
        //         contextParameters: contextParameters,
        //         llmParameters: llmParameters,
        //     })
        // )

        data.setChatSettings((prev: any) => ({
            ...prev,
            systemPrompt: systemPrompt,
            maximum_chunks_count: contextParameters.maximum_chunks_count,
            no_chunk_cutoff: contextParameters.no_chunk_cutoff,
            temperature: llmParameters.temperature,
            top_k: llmParameters.top_k,
            top_p: llmParameters.top_p,
        }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemPrompt, contextParameters, llmParameters])




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
        gap: 12,
        marginBottom: 12,
    };

    const textareaStyle: React.CSSProperties = {
        flex: 1,
        padding: '6px 8px',
        fontSize: 13,
        border: '1px solid #ccc',
        borderRadius: 6,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
    };



    return (
        <div
            style={{
                width: 550,
                // minHeight: 400,
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
                    {/* System Prompt */}
                    <div style={rowStyle}>
                        <div style={labelStyle}>System Prompt</div>
                        <textarea
                            className='nodrag'
                            style={{ ...textareaStyle, resize: 'both' }}
                            placeholder="Enter system prompt here..."
                            value={systemPrompt}
                            rows={7}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                        />
                    </div>

                    <div className='flex flex-column mt-2'>
                        <div style={labelStyle}>Precision vs Creativity</div>
                        <div className='mx-4 w-full'>
                            <div className='text-nav dark:text-nav-dark text-sm mb-2'>Temperature</div>
                            <input
                                type='range'
                                min='0'
                                max='1'
                                step='0.1'
                                value={llmParameters.temperature}
                                onChange={(e) =>
                                    setLlmParameters((prev: any) => ({
                                        ...prev,
                                        temperature: parseFloat(e.target.value),
                                    }))
                                }
                                className='nodrag w-80 p-1 accent-panel1 dark:accent-panel3-dark'
                            />
                        </div>
                    </div>

                    <div className='flex flex-column mt-2'>
                        <div style={labelStyle}></div>
                        <div className='mx-4 w-full'>
                            <div className='text-nav dark:text-nav-dark text-sm mb-2'>Top K</div>
                            <input
                                type='range'
                                min='5'
                                max='100'
                                step='5'
                                value={llmParameters.top_k}
                                onChange={(e) =>
                                    setLlmParameters((prev: any) => ({
                                        ...prev,
                                        top_k: parseInt(e.target.value),
                                    }))
                                }
                                className='nodrag w-80 p-1 accent-panel1 dark:accent-panel3-dark'
                            />
                            <div className='flex flex-row justify-between'>
                                <div className='text-nav dark:text-nav-dark text-sm text-center'>5</div>
                                <div className='text-nav dark:text-nav-dark text-sm text-center font-semibold'>{llmParameters.top_k}</div>
                                <div className='text-nav dark:text-nav-dark text-sm text-center'>100</div>
                            </div>
                        </div>
                    </div>

                    <div className='flex flex-column mt-2'>
                        <div style={labelStyle}></div>
                        <div className='mx-4 w-full'>
                            <div className='text-nav dark:text-nav-dark text-sm mb-2'>Top P</div>
                            <input
                                type='range'
                                min='0.4'
                                max='1.0'
                                step='0.05'
                                value={llmParameters.top_p}
                                onChange={(e) =>
                                    setLlmParameters((prev: any) => ({
                                        ...prev,
                                        top_p: parseFloat(e.target.value),
                                    }))
                                }
                                className='nodrag w-80 p-1 accent-panel1 dark:accent-panel3-dark'
                            />
                            <div className='flex flex-row justify-between'>
                                <div className='text-nav dark:text-nav-dark text-sm text-center'>0.4</div>
                                <div className='text-nav dark:text-nav-dark text-sm text-center font-semibold'>{llmParameters.top_p}</div>
                                <div className='text-nav dark:text-nav-dark text-sm text-center'>1.0</div>
                            </div>
                        </div>
                    </div>

                    <div className='flex flex-column mt-2'>
                        <div style={labelStyle}>Maximum Chunks (n)</div>
                        {/* slider from value 1 to 20 in increament of 1 */}
                        <div className="mx-4">
                            <input
                                type="range"
                                min="1"
                                max="30"
                                step="1"
                                value={contextParameters.maximum_chunks_count}
                                onChange={(e) =>
                                    setContextParameters((prev: any) => ({
                                        ...prev,
                                        maximum_chunks_count: e.target.value,
                                    }))
                                }
                                className="nodrag w-80 p-1 accent-panel1 dark:accent-panel3-dark"
                            />

                            <div className="flex flex-row justify-between">
                                <div className="text-nav dark:text-nav-dark text-sm text-center">1</div>
                                <div className="text-nav dark:text-nav-dark text-sm text-center font-semibold">
                                    {contextParameters.maximum_chunks_count}
                                </div>
                                <div className="text-nav dark:text-nav-dark text-sm text-center">30</div>
                            </div>
                        </div>
                    </div>

                    <div className='flex flex-column mt-2'>
                        <div style={labelStyle}>No Chunk Cutoff</div>
                        {/* checkbox */}
                        <div className='mx-4'>
                            <input type='checkbox' checked={contextParameters.no_chunk_cutoff}
                                onChange={(e) => setContextParameters((prev: any) => ({ ...prev, no_chunk_cutoff: e.target.checked }))}
                                className='p-1 accent-panel1 dark:accent-panel3-dark'
                            />
                        </div>
                    </div>
                </div>
            )}

            <Handle type="target" position={Position.Left} style={{ top: 15, transform: 'none', background: 'none', border: 'none' }} />
            <Handle type="source" position={Position.Left} />
        </div>
    );
};

export default PromptNode;
