import { GraphNode } from '../../types/node'
import { getRadius, TypeToNodeRadius } from './Node'
import Colors from '@/consts/colors'

const ImageNode = ({ node, imageUrl, label }: { node: GraphNode; imageUrl?: string; label?: string }) => {
  const realImageUrl = imageUrl || node.coverImgSrc
  const realLabel = label || node.label
  const radius = getRadius(node.type)
  const d = radius * 2

  return (
    <>
      {realImageUrl ? (
        <image
          decoding="async"
          width={d}
          scale={node.scale}
          height={d}
          preserveAspectRatio="xMidYMid slice"
          href={imageUrl || node.coverImgSrc}
          clipPath="inset(0% round 15px)"
          imageRendering="optimizeSpeed"
        ></image>
      ) : (
        <circle fill="#8590ae" cx={radius} cy={radius} r={radius}></circle>
      )}
      <text
        transform={`translate(${d / 2},${d})`}
        textAnchor="middle"
        fontWeight={600}
        fill={Colors.Font.Primary}
        fontSize="calc(var(--zoom-level) * 16px)"
        dy="1.6em"
      >
        {realLabel}
      </text>
    </>
  )
}

export default ImageNode
