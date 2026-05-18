import { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MathJaxContext, MathJax } from 'better-react-mathjax'
const stateKey = 'seRelevanceScoreNodeState';
const RelevanceScoreNode = ({ data }: any) => {
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
            ARSbest: data.currentSettings.relevance_score_cutoff.answer_best,
            ARSworst: data.currentSettings.relevance_score_cutoff.answer_worst,
            QRSbest: data.currentSettings.relevance_score_cutoff.question_best,
            QRSworst: data.currentSettings.relevance_score_cutoff.question_worst,
            HIp: data.currentSettings.relevance_score_cutoff.HIp,
            HIq: data.currentSettings.relevance_score_cutoff.HIq,
        }
    }

    const initialData = getInitialUploadNodeData()

    const [ARSbest, setARSbest] = useState(initialData.ARSbest)
    const [ARSworst, setARSworst] = useState(initialData.ARSworst)
    const [QRSbest, setQRSbest] = useState(initialData.QRSbest)
    const [QRSworst, setQRSworst] = useState(initialData.QRSworst)
    const [HIp, setHIp] = useState(initialData.HIp)
    const [HIq, setHIq] = useState(initialData.HIq)
    const [HIMode, setHIMode] = useState('ML based prediction')
    // const [HIc, setHIc] = useState(initialData.HIc)

    useEffect(() => {
        // localStorage.setItem(
        //     stateKey,
        //     JSON.stringify({
        //         ARSbest,
        //         ARSworst,
        //         QRSbest,
        //         QRSworst,
        //         HIp,
        //         HIq,
        //     })
        // )

        data.setChatSettings((prev: any) => ({
            ...prev,
            relevance_score_cutoff: {
                ...data.currentSettings.relevance_score_cutoff, 
                answer_best: ARSbest,
                answer_worst: ARSworst,
                question_best: QRSbest,
                question_worst: QRSworst,
                HIp: HIp,
                HIq: HIq,
            }
        }))

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ARSbest, ARSworst, QRSbest, QRSworst, HIp, HIq])


    const rowStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
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

            {!collapsed && (

                <div style={{ padding: 12 }}>
                    <MathJaxContext>
                        {/* Chunking Method */}
                        <div style={rowStyle}>
                            <div>
                                <div className='text-nav dark:text-nav-dark inline-block my-2 text-sm'>Question relevance score (QRS) range</div>
                                <div>
                                    <div className='w-24 block text-nav dark:text-nav-dark text-sm '><MathJax>{"\\(QRS = 1 - \\frac{QC_{mean} - QC_{best}}{QC_{worst} - QC_{best}} \\)"}</MathJax></div>
                                </div>
                                <div className='flex justify-between'>
                                    <div className='text-nav dark:text-nav-dark my-1 text-sm'><MathJax>{"\\(QC_{best} \\)"}</MathJax></div>
                                    <input type='number' className='text-sm rounded-md w-24 m-1 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={QRSbest} onChange={(e)=>setQRSbest(e.target.value)} />
                                </div>
                                <div className='flex justify-between'>
                                    <div className='text-nav dark:text-nav-dark  my-1 text-sm'><MathJax>{"\\(QC_{worst} \\)"}</MathJax></div>
                                    <input type='number' className='text-sm rounded-md w-24 m-1 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={QRSworst} onChange={(e)=>setQRSworst(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div style={rowStyle}>
                            <div>
                                <div className='text-nav dark:text-nav-dark inline-block text-sm'>Answer relevance score (ARS) range</div>
                                <div>
                                    <div>
                                        <div className='w-24 block text-nav dark:text-nav-dark text-sm '><MathJax>{"\\(ARS = 1 - \\frac{AC_{mean} - AC_{best}}{AC_{worst} - AC_{best}} \\)"}</MathJax></div>
                                    </div>
                                    <div className='flex justify-between'>
                                        <div className='text-nav dark:text-nav-dark my-1 text-sm'><MathJax>{"\\(AC_{best} \\)"}</MathJax></div>
                                        <input type='number' placeholder='Best' className='text-sm rounded-md w-24 m-1 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={ARSbest} onChange={(e) => setARSbest(e.target.value)} />
                                    </div>
                                    <div className='flex justify-between'>
                                        <div className='text-nav dark:text-nav-dark my-1 text-sm'><MathJax>{"\\(AC_{worst} \\)"}</MathJax></div>
                                        <input type='number' placeholder='Worst' className='text-sm rounded-md w-24 m-1 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={ARSworst} onChange={(e) => setARSworst(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={rowStyle}>
                            <div>
                                <div className='text-nav dark:text-nav-dark inline-block text-sm'>Hallucination Index</div>
                                <div className='flex justify-between my-2'>
                                    <label className='text-nav dark:text-nav-dark text-sm my-auto mx-2'>Mode:</label>
                                    <select value={HIMode} style={inputStyle} onChange={(e) => setHIMode(e.target.value)} className='text-sm rounded-md w-40 p-1 dark:text-white dark:bg-gray-500'>
                                        <option value='ML based prediction'>ML based prediction</option>
                                        <option value='Equation based'>Equation based</option>
                                    </select>
                                </div>
                                {HIMode === 'Equation based' && (
                                    <div>
                                        <div className='w-24 inline-block text-nav dark:text-nav-dark text-sm'><MathJax>{"\\(HI = 1 - (\\frac{p \\times QRS}{p  +  q})\\ - (\\frac{q \\times ARS}{p + q})\\)"}</MathJax></div>
                                    </div>
                                )}
                                {HIMode === 'Equation based' && (
                                    <div>
                                        <div className='flex justify-between'>
                                            <div className='text-nav dark:text-nav-dark p-1 my-1 text-sm'><MathJax>{"\\(p \\)"}</MathJax></div>
                                            <input type='number' placeholder='p' className='inputStyle text-sm rounded-md w-24 m-1 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={HIp} onChange={(e) => setHIp(e.target.value)} />
                                        </div>
                                        <div className='flex justify-between'>
                                            <div className='text-nav dark:text-nav-dark p-1 my-1 text-sm'><MathJax>{"\\(q \\)"}</MathJax></div>
                                            <input type='number' placeholder='q' className='inputStyle text-sm rounded-md w-24 m-1 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={HIq} onChange={(e) => setHIq(e.target.value)} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </MathJaxContext>
                </div >

            )
            }

            <Handle type="target" position={Position.Right} style={{ top: 15, transform: 'none', background: 'none', border: 'none' }} />
            <Handle type="source" position={Position.Right} />
        </div >
    );
};

export default RelevanceScoreNode;
