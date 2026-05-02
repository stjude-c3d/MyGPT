import { Handle, Position } from '@xyflow/react';

const UploadButtonNode = ({ data }: any) => {
  return (
    <div
      style={{
        width: 200,
        padding: '10px 14px',
        border: '1px solid #ccc',
        borderRadius: 10,
        backgroundColor: 'rgb(104 126 140 / var(--tw-bg-opacity))',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 600,
      }}
      className='text-white'
    >
      {data.title}
      <Handle type="target" position={Position.Top} style={{left: 15, transform: 'none', background: 'none', border: 'none' }} id="upload-button-target-top-left" />
      <Handle type="target" position={Position.Top} style={{ background: 'none', border: 'none' }} id="upload-button-target-top-center" />
      <Handle type="target" position={Position.Left} style={{ background: 'none', border: 'none' }} id="upload-button-target-left"/>
    </div>
  );
};

export default UploadButtonNode;
