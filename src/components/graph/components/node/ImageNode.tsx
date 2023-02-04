import { GraphNode } from '../../types/node'
import { motion } from 'framer-motion'
import { MarkerColor } from '../../consts/markerColors'
import { TypeToNodeRadius } from './Node'
import { useMemo } from 'react'

const ImageNode = ({ node, imageUrl, label }: { node: GraphNode; imageUrl?: string; label?: string }) => {
  const realImageUrl = imageUrl || node.coverImgSrc
  const realLabel = label || node.label
  const radius = TypeToNodeRadius[node.type || 'normal']
  const d = useMemo(() => radius * 2, [radius])
  const imageSize = () => {
    switch (node.type) {
      case 'pdf':
        return {
          width: d * 0.7,
          height: d * 0.7 * 1.33
        }
      default:
        return {
          width: d,
          height: d
        }
    }
  }
  const shouldHaveBorderRadius = node.type === 'normal'
  const shouldHaveBoxShadow = node.type === 'pdf'
  const imgSize = useMemo(() => imageSize(), [node.type])
  return (
    <>
      {realImageUrl ? (
        <motion.foreignObject
          style={{ transformOrigin: `${radius}px ${radius}px` }}
          width={d}
          height={d}
          initial={{ scale: 1 }}
          animate={{ scale: node.scale }}
        >
          <div style={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img
              width={imgSize.width}
              height={imgSize.height}
              style={{
                boxShadow: shouldHaveBoxShadow ? 'rgba(0, 0, 0, 0.35) 0px 5px 16px' : undefined,
                margin: 'auto',
                borderRadius: shouldHaveBorderRadius ? '8px' : undefined,
                objectFit: 'cover'
              }}
              src={imageUrl || node.coverImgSrc}
            />
          </div>
        </motion.foreignObject>
      ) : (
        <g>
          <motion.circle
            style={{ transformOrigin: `${radius}px ${radius}px` }}
            fill="#8590ae"
            initial={{ scale: 1 }}
            animate={{ scale: node.scale }}
            cx={radius}
            cy={radius}
            r={radius}
          ></motion.circle>
          {node.isCenter && (
            <motion.circle
              style={{ transformOrigin: `${radius}px ${radius}px` }}
              fill="none"
              stroke={MarkerColor.EMPHASIS}
              strokeWidth="2"
              initial={{ scale: 1 }}
              animate={{ scale: node.scale }}
              cx={radius}
              cy={radius}
              r={radius}
            >
              <animate
                attributeName="r"
                repeatCount="indefinite"
                dur="1s"
                // values="20;50"
                values={`${radius}; ${d + 10}`}
                keyTimes="0;1"
                keySplines="0 0.2 0.8 1"
                calcMode="spline"
                begin="0s"
              ></animate>
              <animate
                attributeName="opacity"
                repeatCount="indefinite"
                dur="1s"
                values="0.8;0"
                keyTimes="0;1"
                keySplines="0 0.2 0.8 1"
                calcMode="spline"
                begin="0s"
              ></animate>
            </motion.circle>
          )}
        </g>
      )}
      <motion.text
        initial={{ x: radius, y: d }}
        animate={{ y: d * (node.scale ? (node.scale === 1 ? 1 : node.scale * 0.9) : 1) }}
        textAnchor="middle"
        fontWeight={600}
        fontSize={12}
      >
        {realLabel?.match(/.{1,40}/g)?.map(i => (
          <tspan x={0} dy="1.2em">
            {i}
          </tspan>
        ))}
      </motion.text>
    </>
  )
}

export default ImageNode
