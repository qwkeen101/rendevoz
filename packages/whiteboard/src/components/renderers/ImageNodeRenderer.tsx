import { memo } from 'react'
import { NodeRendererProps, IWhiteboardNode } from '../../types'

type ImageNodeType = IWhiteboardNode & { type: 'image' }

/**
 * Image node renderer - displays an image from imageUrl
 */
const ImageNodeRenderer = memo(({ node }: NodeRendererProps<ImageNodeType>) => {
    const imageNode = node as ImageNodeType

    return (
        <img
            src={imageNode.imageUrl}
            alt={imageNode.name || 'Image node'}
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
                userSelect: 'none'
            }}
            draggable={false}
        />
    )
})

ImageNodeRenderer.displayName = 'ImageNodeRenderer'

export default ImageNodeRenderer
