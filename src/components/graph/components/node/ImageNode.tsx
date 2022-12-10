import { GraphNode } from '../../types/node'
import { motion } from 'framer-motion'
import { MarkerColor } from '../../consts/markerColors'

const ImageNode = ({ node }: { node: GraphNode }) => {
  return (
    <>
      {node.coverImgSrc ? (
        <motion.image
          preserveAspectRatio="xMidYMid slice"
          href={node.coverImgSrc || `https://xsgames.co/randomusers/avatar.php?g=female&random=${node?.id}`}
          width={40}
          height={40}
          clipPath={`url(#circleClip)`}
          initial={{ scale: 1 }}
          animate={{ scale: node.scale }}
        ></motion.image>
      ) : (
        <g>
          <motion.circle
            style={{ transformOrigin: '20px 20px' }}
            fill="#8590ae"
            initial={{ scale: 1 }}
            animate={{ scale: node.scale }}
            cx={20}
            cy={20}
            r={20}
          ></motion.circle>
          {node.isCenter && (
            <motion.circle
              style={{ transformOrigin: '20px 20px' }}
              fill="none"
              stroke={MarkerColor.EMPHASIS}
              strokeWidth="2"
              initial={{ scale: 1 }}
              animate={{ scale: node.scale }}
              cx={20}
              cy={20}
              r={20}
            >
              <animate
                attributeName="r"
                repeatCount="indefinite"
                dur="1s"
                values="20;50"
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
        initial={{ x: 20, y: 40 }}
        animate={{ y: 40 * (node.scale ? (node.scale === 1 ? 1 : node.scale * 0.9) : 1) }}
        textAnchor="middle"
        fontWeight={600}
        fontSize={12}
      >
        {node.label?.match(/.{1,50}/g)?.map(i => (
          <tspan x={0} dy="1.2em">
            {i}
          </tspan>
        ))}
      </motion.text>
    </>
  )
}

export default ImageNode
