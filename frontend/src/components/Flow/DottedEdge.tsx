import React, { FC } from 'react';
import {
  BaseEdge,
  type EdgeProps,
} from '@xyflow/react';

type CustomEdgeData = {
  color?: string;
  id: string;
  source: string;
  target: string;
};

const DottedEdge: FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  data,
}: EdgeProps<CustomEdgeData>) => {
  const strokeColor = '#ff0000';

  const edgePath = `M${sourceX},${sourceY}
    C ${sourceX} ${targetY} ${sourceX} ${targetY} ${targetX},${targetY}`;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        className="dotted-edge"
        style={{
          stroke: strokeColor,
          strokeWidth: 1.5,
          ...(style ?? {}),
        }}
      />
    </>
  );
};

export default DottedEdge;
