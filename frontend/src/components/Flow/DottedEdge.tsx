import React, { FC, useCallback } from 'react';
import {
  BaseEdge,
  useReactFlow,
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
  const { setEdges } = useReactFlow();

  const strokeColor = '#ff0000';

  const edgePath = `M${sourceX},${sourceY}
    C ${sourceX} ${targetY} ${sourceX} ${targetY} ${targetX},${targetY}`;

  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  const onEdgeClick = useCallback(() => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  }, [id, setEdges]);

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
