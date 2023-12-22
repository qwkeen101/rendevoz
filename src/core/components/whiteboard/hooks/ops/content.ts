import { IWhiteboardInstance, IWhiteboardNode, IWhiteboardOutline } from '~/typings'
import { assignProperties } from '@/utils'
import { MetaStore } from '@/api/stores'
import { Node } from 'slate'

export default function assignContentOps(instance: IWhiteboardInstance) {
  assignProperties(instance, {
    contentOps: {
      transformToOutline: () => {
        const allNodes = instance.getAllNode?.()
        if (!allNodes) throw 'Failed to get nodes!'
        const inGroupNodeIds = new Set<number>()
        const groupToNodesMap = new Map<number, IWhiteboardNode[]>()
        const outlineArray: IWhiteboardOutline[] = []

        allNodes.forEach(i => {
          if (i.type === 'group') {
            const inGroupNodes = instance.groupOps?.getNodesInGroup(i.id) || []
            groupToNodesMap.set(i.id, inGroupNodes)
            inGroupNodes.forEach(n => inGroupNodeIds.add(n.id))
          }
        })
        const notInGroupNodes: IWhiteboardNode[] = allNodes.filter(
          i => !inGroupNodeIds.has(i.id) && i.type !== 'group'
        ) as IWhiteboardNode[]
        const metaMap = MetaStore.getMetaObjectsMap()
        const transformCommonNodeToOutlineName = (nodeId: number): string => {
          const node = instance.getNode?.(nodeId)
          if (!node) throw 'Failed to get node!'
          switch (node.type) {
            case 'metaObject': {
              if (node.metaObjectId) {
                const object = metaMap.get(node.metaObjectId)
                if (object) {
                  return object?.name || object?.placeholderName || 'Unnamed object'
                }
              }
              return 'Unnamed object'
            }
            case 'text': {
              return typeof node.content === 'string'
                ? node.content
                : node.content
                ? Node.string({ children: node.content }) || 'Unnamed text'
                : 'Unnamed text'
            }
            default:
              return 'Unnamed ' + node.type
          }
        }
        const transformGroupToOutline = (groupId: number): IWhiteboardOutline => {
          const inGroupNodes = groupToNodesMap.get(groupId)
          groupToNodesMap.delete(groupId)
          const group = instance.getNode?.(groupId)
          if (!group) throw 'Failed to get group node!'
          if (inGroupNodes?.length) {
            const children = inGroupNodes.map(i => {
              if (i.type === 'group') {
                // delete here
                const result = transformGroupToOutline(i.id)
                groupToNodesMap.delete(i.id)
                return result
              }
              return {
                nodeId: i.id,
                name: transformCommonNodeToOutlineName(i.id)
              }
            })
            children.sort(a => (a.children ? -1 : 1))
            return {
              nodeId: groupId,
              name: group.name || 'Unnamed group',
              children
            }
          } else {
            return {
              nodeId: groupId,
              name: group.name || 'Unnamed group'
            }
          }
        }
        // first transform groups here
        groupToNodesMap.forEach((nodes, groupNode) => {
          outlineArray.push(transformGroupToOutline(groupNode))
        })
        notInGroupNodes.forEach(n => {
          outlineArray.push({
            nodeId: n.id,
            name: transformCommonNodeToOutlineName(n.id)
          })
        })
        return outlineArray
      }
    }
  })
}
