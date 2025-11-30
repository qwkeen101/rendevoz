import { NodeRendererRegistry } from '../../types'
import DefaultNodeRenderer from './DefaultNodeRenderer'
import ImageNodeRenderer from './ImageNodeRenderer'
import TextNodeRenderer from './TextNodeRenderer'

export { DefaultNodeRenderer, ImageNodeRenderer, TextNodeRenderer }

/**
 * Get default node renderers registry
 * Provides basic renderers for common node types
 */
export function getDefaultNodeRenderers(): NodeRendererRegistry {
    return {
        text: TextNodeRenderer,
        image: ImageNodeRenderer
        // Other node types will use DefaultNodeRenderer as fallback
    }
}
