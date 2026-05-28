import { Handle, Position } from '@xyflow/react';

const OutputNode = ({ data }: any) => {
  return (
    <div
      style={{
        width: 140,
        padding: '10px 14px',
        border: '1px solid #ccc',
        borderRadius: 10,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 600,
        color: '#2a4759',
      }}
    >
      {data.title}
      <Handle type="target" position={Position.Left} style={{ background: 'none', border: 'none' }}/>
    </div>
  );
};

export default OutputNode;
