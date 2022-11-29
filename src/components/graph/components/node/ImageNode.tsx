import { GraphNode } from '../../types/node'
import { motion } from 'framer-motion'

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
        <motion.circle
          style={{ transformOrigin: '20px 20px' }}
          fill="#8590ae"
          initial={{ scale: 1 }}
          animate={{ scale: node.scale }}
          cx={20}
          cy={20}
          r={20}
        ></motion.circle>
      )}
      <motion.text
        initial={{ x: 20, y: 55 }}
        animate={{ y: 55 * (node.scale ? (node.scale === 1 ? 1 : node.scale * 0.9) : 1) }}
        textAnchor="middle"
        fontWeight={600}
        fontSize={12}
      >
        {node.label}
      </motion.text>
    </>
  )
}

export default ImageNode
