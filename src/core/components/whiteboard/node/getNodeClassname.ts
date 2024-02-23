import { IWhiteboardNode } from '~/typings'
import { css } from '@emotion/css'

const HoverBoxShadowClassname = css({
  ':hover': {
    boxShadow: '0px 0px 0px 2px var(--button-active-background)'
  }
})
export default (node: IWhiteboardNode) => {
  if (!node.background) {
    if (node.type === 'mindmap') {
      if (node.nodeType === 'text') {
        return HoverBoxShadowClassname
      }
    }
    if (node.type === 'text' && node.rootId) {
      return HoverBoxShadowClassname
    }
  }
}
