import { memo } from 'react'
import { NodeRendererProps, IWhiteboardNode } from '../../types'

/**
 * Default node renderer - fallback for nodes without a specific renderer
 * Displays node.name or node.type in a simple card style
 */
const DefaultNodeRenderer = memo(({ node, selected }: NodeRendererProps) => {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600,
                padding: 8,
                boxSizing: 'border-box',
                userSelect: 'none'
            }}
        >
            {node.name || node.type}
        </div>
    )
})

DefaultNodeRenderer.displayName = 'DefaultNodeRenderer'

export default DefaultNodeRenderer
