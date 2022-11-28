import { GraphNode } from '../../types/node'
import { motion } from 'framer-motion'
import { fullname } from 'react-lorem-ipsum'
import { useState } from 'react'

const ImageNode = ({ node }: { node?: GraphNode }) => {
  const [n] = useState(fullname())
  return (
    <>
      <motion.image
        href={`https://xsgames.co/randomusers/avatar.php?g=female&random=${node?.id}`}
        width={40}
        height={40}
        clipPath={`url(#circleClip)`}
        initial={{ scale: 1 }}
        animate={{ scale: node?.scale }}
      ></motion.image>
      <motion.text
        initial={{ x: 20, y: 55 }}
        animate={{ y: 55 * (node?.scale ? (node.scale === 1 ? 1 : node.scale * 0.9) : 1) }}
        textAnchor="middle"
        fontWeight={600}
        fontSize={12}
      >
        {n}
      </motion.text>
    </>
  )
}

export default ImageNode
