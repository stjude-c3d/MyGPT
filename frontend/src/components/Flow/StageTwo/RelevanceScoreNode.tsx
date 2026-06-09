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
            Qsem_a: data.currentSettings.relevance_score_cutoff.Qsem_a,
            Qkey_b: data.currentSettings.relevance_score_cutoff.Qkey_b,
            Qrank_c: data.currentSettings.relevance_score_cutoff.Qrank_c,
            Asem_x: data.currentSettings.relevance_score_cutoff.Asem_x,
            Akey_y: data.currentSettings.relevance_score_cutoff.Akey_y,
            Arank_z: data.currentSettings.relevance_score_cutoff.Arank_z,
            QRS_p: data.currentSettings.relevance_score_cutoff.QRS_p,
            ARS_q: data.currentSettings.relevance_score_cutoff.ARS_q,
            HI_by_equation: data.currentSettings.relevance_score_cutoff.HI_by_equation,
        }
    }

    const initialData = getInitialUploadNodeData()

    const [Qsem_a, setQsem_a] = useState(initialData.Qsem_a)
    const [Qkey_b, setQkey_b] = useState(initialData.Qkey_b)
    const [Qrank_c, setQrank_c] = useState(initialData.Qrank_c)
    const [Asem_x, setAsem_x] = useState(initialData.Asem_x)
    const [Akey_y, setAkey_y] = useState(initialData.Akey_y)
    const [Arank_z, setArank_z] = useState(initialData.Arank_z)
    const [QRS_p, setQRS_p] = useState(initialData.QRS_p)
    const [ARS_q, setARS_q] = useState(initialData.ARS_q)
    const [HIMode, setHIMode] = useState(initialData.HI_by_equation ? 'Equation based' : 'ML based prediction')

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
        // )

        data.setChatSettings((prev: any) => ({
            ...prev,
            relevance_score_cutoff: {
                ...(prev?.relevance_score_cutoff || {}),
                Qsem_a: parseFloat(Qsem_a),
                Qkey_b: parseFloat(Qkey_b),
                Qrank_c: parseFloat(Qrank_c),
                Asem_x: parseFloat(Asem_x),
                Akey_y: parseFloat(Akey_y),
                Arank_z: parseFloat(Arank_z),
                QRS_p: parseFloat(QRS_p),
                ARS_q: parseFloat(ARS_q),
                HI_by_equation: HIMode === 'Equation based',
            }
        }))

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Qsem_a, Qkey_b, Qrank_c, Asem_x, Akey_y, Arank_z, QRS_p, ARS_q, HIMode])


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
                width: 450,
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

            <div style={{ padding: 12, display: collapsed ? 'none' : 'block' }}>
                <MathJaxContext
                    hideUntilTypeset={'first'}
                    onStartup={(mathJax: any) => {
                        const origTypesetPromise = mathJax.typesetPromise.bind(mathJax);
                        const origTypesetClear = mathJax.typesetClear.bind(mathJax);
                        mathJax.typesetPromise = (elements?: (HTMLElement | null)[]) => {
                            const safe = elements ? elements.filter(Boolean) : [];
                            if (safe.length === 0) return Promise.resolve();
                            return origTypesetPromise(safe);
                        };
                        mathJax.typesetClear = (elements?: (HTMLElement | null)[]) => {
                            const safe = elements ? elements.filter(Boolean) : [];
                            if (safe.length > 0) origTypesetClear(safe);
                        };
                    }}
                >
                    {/* Chunking Method */}
                    <div style={rowStyle}>
                        <div>
                            <div className='text-nav dark:text-nav-dark inline-block my-2 text-sm'>Question relevance score (QRS)</div>
                            <div>
                                <div className='w-24 block text-nav dark:text-nav-dark text-sm '><MathJax>{"\\(QRS = (a \\times \\frac{\\sum_{i=1}^{k}Q_{sem,i}}{k} ) + (b \\times \\frac{\\sum_{i=1}^{k}Q_{key,i}}{k} ) + (c \\times \\frac{\\sum_{i=1}^{k}Q_{rank,i}}{k} )\\)"}</MathJax></div>
                            </div>
                            <div className='flex justify-between'>
                                <div className='text-nav dark:text-nav-dark my-1 text-sm'><MathJax>{"\\(a \\)"}</MathJax></div>
                                <input type='number' style={inputStyle} className='text-sm rounded-md w-16 m-1 ml-6 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={Qsem_a} onChange={(e)=>setQsem_a(e.target.value)} />
                            </div>
                            <div className='flex justify-between'>
                                <div className='text-nav dark:text-nav-dark  my-1 text-sm'><MathJax>{"\\(b \\)"}</MathJax></div>
                                <input type='number' style={inputStyle} className='text-sm rounded-md w-16 m-1 ml-6 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={Qkey_b} onChange={(e)=>setQkey_b(e.target.value)} />
                            </div>
                            <div className='flex justify-between'>
                                <div className='text-nav dark:text-nav-dark  my-1 text-sm'><MathJax>{"\\(c \\)"}</MathJax></div>
                                <input type='number' style={inputStyle} className='text-sm rounded-md w-16 m-1 ml-6 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={Qrank_c} onChange={(e)=>setQrank_c(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div style={rowStyle}>
                        <div>
                            <div className='text-nav dark:text-nav-dark inline-block text-sm'>Answer relevance score (ARS)</div>
                            <div>
                                <div>
                                    <div className='w-24 block text-nav dark:text-nav-dark text-sm '><MathJax>{"\\(ARS = (x \\times \\frac{\\sum_{i=1}^{k}A_{sem,i}}{k} ) + (y \\times \\frac{\\sum_{i=1}^{k}A_{key,i}}{k} ) + (z \\times \\frac{\\sum_{i=1}^{k}A_{rank,i}}{k} )\\)"}</MathJax></div>
                                </div>
                                <div className='flex justify-between'>
                                    <div className='text-nav dark:text-nav-dark my-1 text-sm'><MathJax>{"\\(x \\)"}</MathJax></div>
                                    <input type='number' style={inputStyle} className='text-sm rounded-md w-16 m-1 ml-6 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={Asem_x} onChange={(e) => setAsem_x(e.target.value)} />
                                </div>
                                <div className='flex justify-between'>
                                    <div className='text-nav dark:text-nav-dark my-1 text-sm'><MathJax>{"\\(y \\)"}</MathJax></div>
                                    <input type='number' style={inputStyle} className='text-sm rounded-md w-16 m-1 ml-6 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={Akey_y} onChange={(e) => setAkey_y(e.target.value)} />
                                </div>
                                <div className='flex justify-between'>
                                    <div className='text-nav dark:text-nav-dark my-1 text-sm'><MathJax>{"\\(z \\)"}</MathJax></div>
                                    <input type='number' style={inputStyle} className='text-sm rounded-md w-16 m-1 ml-6 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={Arank_z} onChange={(e) => setArank_z(e.target.value)} />
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
                            <div style={{ display: HIMode === 'Equation based' ? 'block' : 'none' }}>
                                <div className='w-24 inline-block text-nav dark:text-nav-dark text-sm'><MathJax>{"\\(HI = 1 - (\\frac{p \\times QRS}{p  +  q})\\ - (\\frac{q \\times ARS}{p + q})\\)"}</MathJax></div>
                            </div>
                            <div style={{ display: HIMode === 'Equation based' ? 'block' : 'none' }}>
                                <div className='flex justify-between'>
                                    <div className='text-nav dark:text-nav-dark p-1 my-1 text-sm'><MathJax>{"\\(p \\)"}</MathJax></div>
                                    <input type='number' style={inputStyle} placeholder='p' className='inputStyle text-sm rounded-md w-16 m-1 ml-6 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={QRS_p} onChange={(e) => setQRS_p(e.target.value)} />
                                </div>
                                <div className='flex justify-between'>
                                    <div className='text-nav dark:text-nav-dark p-1 my-1 text-sm'><MathJax>{"\\(q \\)"}</MathJax></div>
                                    <input type='number' style={inputStyle} placeholder='q' className='inputStyle text-sm rounded-md w-16 m-1 ml-6 dark:text-white dark:bg-gray-500 dark:placeholder:text-nav-dark' value={ARS_q} onChange={(e) => setARS_q(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </MathJaxContext>
            </div>

            <Handle type="target" position={Position.Right} style={{ top: 15, transform: 'none', background: 'none', border: 'none' }} />
            <Handle type="source" position={Position.Right} />
        </div >
    );
};

export default RelevanceScoreNode;
