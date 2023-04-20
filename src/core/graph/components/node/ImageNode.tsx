import { GraphNode } from '../../types/node'
import { motion } from 'framer-motion'
import { TypeToNodeRadius } from './Node'
import { useMemo } from 'react'
import Colors from '@/consts/colors'
import { MarkerColor } from '@/consts'

const ImageNode = ({ node, imageUrl, label }: { node: GraphNode; imageUrl?: string; label?: string }) => {
  const realImageUrl = imageUrl || node.coverImgSrc
  const realLabel = label || node.label
  const radius = TypeToNodeRadius[node.type || 'normal']
  const d = radius * 2
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
                borderRadius: '8px',
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
        </g>
      )}
      <motion.text
        initial={{ x: radius, y: d }}
        animate={{ y: d * (node.scale ? (node.scale === 1 ? 1 : node.scale * 0.9) : 1) }}
        textAnchor="middle"
        fontWeight={600}
        style={{
          fill: node.isCenter ? MarkerColor.EMPHASIS : Colors.Font.Primary
        }}
        fontSize="calc(var(--zoom-level) * 12px)"
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
