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
    Node,
    MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
// import { UploadNode, ChunkingNode, EmbeddingModelNode, BM25Node, RerankerNode } from './Flow/StageOne';
import { InputNode, OutputNode, LLMNode, PromptNode, RelevanceScoreNode, SaveNode } from './Flow/StageTwo';
import { ReactNode } from 'react';

type FlowNode = Node<{ title: string | ReactNode; libraryName?: string; languageOfDocument?: string }, string>;

/* ---------- Node Types ---------- */
const nodeTypes = {
    inputNode: InputNode,
    outputNode: OutputNode,
    llmNode: LLMNode,
    promptNode: PromptNode,
    relevanceScoreNode: RelevanceScoreNode,
    saveNode: SaveNode,
};

/* ---------- Initial Data ---------- */
const initialNodes: FlowNode[] = [
    {
        id: 'inputNode',
        type: 'inputNode',
        position: { x: 0, y: 50 },
        data: {
            title: 'Input',
        },
    },
    {
        id: 'llmNode',
        type: 'llmNode',
        position: { x: 200, y: 0 },
        data: {
            title: 'LLM',
        },
    },
    {
        id: 'promptNode',
        type: 'promptNode',
        position: { x: 600, y: 0 },
        data: {
            title: 'Prompt',
        },
    },
    {
        id: 'relevanceScoreNode',
        type: 'relevanceScoreNode',
        position: { x: 200, y: 150 },
        data: {
            title: 'Relevance Score',
        },
    },
    {
        id: 'outputNode',
        type: 'outputNode',
        position: { x: 600, y: 500 },
        data: {
            title: 'Output',
        },
    },
    {
        id: 'saveNode',
        type: 'saveNode',
        position: { x: 800, y: 500 },
        data: {
            title: 'Save Settings',
        },
    }
];



const initialEdges = [
    {
        id: 'input-to-llm',
        source: 'inputNode',
        target: 'llmNode',
        type: 'smoothstep',
        animated: false,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#333',
            width: 20,
            height: 20,
        },
        style: { stroke: '#333', strokeWidth: 1 }
    },
    {
        id: 'llm-to-prompt',
        source: 'llmNode',
        target: 'promptNode',
        type: 'smoothstep',
        animated: false,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#333',
            width: 20,
            height: 20,
        },
        style: { stroke: '#333', strokeWidth: 1 }
    },
    {
        id: 'prompt-to-relevance',
        source: 'promptNode',
        target: 'relevanceScoreNode',
        type: 'smoothstep',
        animated: false,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#333',
            width: 20,
            height: 20,
        },
        style: { stroke: '#333', strokeWidth: 1 }
    },
    {
        id: 'relevance-to-output',
        source: 'relevanceScoreNode',
        target: 'outputNode',
        type: 'smoothstep',
        animated: false,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#333',
            width: 20,
            height: 20,
        },
        style: { stroke: '#333', strokeWidth: 1 }
    },
    {
        id: 'output-to-save',
        source: 'outputNode',
        target: 'saveNode',
        type: 'smoothstep',
        animated: false,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#333',
            width: 20,
            height: 20,
        },
        style: { stroke: '#333', strokeWidth: 1 }
    }
];


/* ---------- Main Component ---------- */
const FlowSettings = (props: {
    currentSettings: any,
    settingsCallback: any,
    user?: any,
    djangoLogin?: any
}) => {

    const [formValidation, setFormValidation] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [chatSettings, setChatSettings] = useState({
        selectedLlm: props.currentSettings?.selectedLlm || 'llama3:latest',
        systemPrompt: props.currentSettings?.system_prompt || '',
        maximum_chunks_count: props.currentSettings?.maximum_chunks_count || '15',
        no_chunk_cutoff: props.currentSettings?.no_chunk_cutoff || false,
        relevance_score_cutoff: props.currentSettings?.relevance_score_cutoff || {}
    })

    useEffect(() => {
        console.log('Chat settings updated:', chatSettings)
    }, [chatSettings])

    //  useEffect(() => {
    //     const { systemPrompt, contextParameters, llmParameters } = chatSettings

    //     const { maximum_chunks_count, no_chunk_cutoff } = contextParameters
    //     const { temperature, top_k, top_p } = llmParameters

    //     const chunkingMethod = maximum_chunks_count === '0' ? 'no_chunking' : 'chunking'
    //     const chunkSizeActive = maximum_chunks_count === '0' ? false : true

    //     const newSettings = {
    //         ...props.currentSettings,
    //         system_prompt: systemPrompt,
    //         chunkingMethod: chunkingMethod,
    //         chunkSizeActive: chunkSizeActive,
    //         useOverlap: 'Yes',
    //         chunkSize: maximum_chunks_count,
    //         no_chunk_cutoff: no_chunk_cutoff,
    //         temperature: temperature,
    //         top_k: top_k,
    //         top_p: top_p,
    //     }

    //     props.settingsCallback(newSettings)

    // }, [chatSettings])

    const [nodes, setNodes] = useState<FlowNode[]>(() =>
        initialNodes.map((node) => ({
            ...node,
            data: { ...node.data, currentSettings: props.currentSettings, setChatSettings: setChatSettings, user: props.user, formValidation: formValidation },
        }))
    );

    const [edges, setEdges] = useState(initialEdges);
    const currentSettings = JSON.stringify(props.currentSettings ?? {});

    const onNodesChange = useCallback(
        (changes: NodeChange<FlowNode>[]) =>
            setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange<any>[]) =>
            setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
        (params: any) =>
            setEdges((eds) => addEdge(params, eds)),
        []
    );

    /* Pass currentSetting to all nodes as data */
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({ ...node, data: { ...node.data, currentSettings: props.currentSettings, user: props.user } }))
        );
    }, [currentSettings, props.user]);

    const saveSettings = () => {
        props.settingsCallback({...props.currentSettings, ...chatSettings})
        setShowSuccess(true)
    }

    const onNodeClick = (event: React.MouseEvent, node: FlowNode) => {
        if (node.type === 'saveNode') {
            saveSettings()
        }
    };

    return (
        <div style={{ width: '100%', height: '90%' }}>
            {showSuccess &&
                <div className='flex justify-start'>
                    <div className='text-nav dark:text-nav-dark p-1 text-sm bg-green-200 rounded-md'>Settings are applied.</div>
                </div> 
            }
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                // fitView
                defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
            // fitViewOptions={{ padding: 0.2 }}
            />
        </div>
    );
}

export default FlowSettings
