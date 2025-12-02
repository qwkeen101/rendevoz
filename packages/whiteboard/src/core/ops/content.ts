import { Node } from 'slate'
import { IWhiteboardInstance, IWhiteboardOutline } from '../../types'

const asText = (content: any) => {
  try {
    return Node.string({ children: content })
  } catch {
    return ''
  }
}

export const assignContentOps = (instance: IWhiteboardInstance) => {
  const transformMindmap = (nodeId: number) => {
    const node = instance.getNode?.(nodeId)
    if (!node || node.type !== 'mindmap') return
    const children: IWhiteboardOutline['children'] = []
    const appendChildren = (list: any[] | undefined) => {
      if (!list) return
      list.forEach(child => {
        const parsed = transformCommon(child.root, true)
        if (parsed) {
          parsed.children = []
          appendChildren(child.children)
          children.push(parsed)
        }
      })
    }
    appendChildren(node.rightChildren)
    appendChildren(node.leftChildren)
    return {
      nodeId,
      name: node.name || '',
      icon: 'mindmap',
      children,
      type: 'whiteboard mindmap'
    } as IWhiteboardOutline
  }

  const transformCommon = (nodeId: number, mindmapChildValid = false): IWhiteboardOutline | undefined => {
    const node = instance.getNode?.(nodeId)
    if (!node) return
    if (node.rootId && !mindmapChildValid) return
    switch (node.type) {
      case 'mindmap':
        return transformMindmap(node.id)
      case 'text':
        return {
          nodeId: node.id,
          name: node.name || asText(node.content),
          icon: 'text',
          type: 'whiteboard text'
        }
      case 'group':
        return {
          nodeId: node.id,
          name: node.name || 'Group',
          children: [],
          type: 'whiteboard group'
        }
      default:
        return {
          nodeId: node.id,
          name: node.name || '',
          icon: node.type,
          type: node.type
        }
    }
  }

  instance.contentOps = {
    transformToOutline: () => {
      const allNodes = instance.getAllNode?.() || []
      const inGroupNodeIds = new Set<number>()
      const outlines: IWhiteboardOutline[] = []

      // Build group hierarchy
      allNodes
        .filter(n => n.type === 'group')
        .forEach(group => {
          const children = instance.groupOps?.getNodesInGroup?.(group.id, false, true) || []
          children.forEach(c => inGroupNodeIds.add(c.id))
          const childOutlines = children
            .map(c => (c.type === 'group' ? undefined : transformCommon(c.id, true)))
            .filter(Boolean) as IWhiteboardOutline[]
          outlines.push({
            nodeId: group.id,
            name: group.name || 'Group',
            children: childOutlines,
            type: 'whiteboard group'
          })
        })

      // Nodes not in any group
      allNodes
        .filter(n => n.type !== 'group' && !inGroupNodeIds.has(n.id))
        .forEach(n => {
          const parsed = transformCommon(n.id)
          if (parsed) outlines.push(parsed)
        })

      const record: Record<string, IWhiteboardOutline[]> = {}
      outlines.forEach(o => {
        record[o.type] = [...(record[o.type] || []), o]
      })
      return record
    }
  }
}
