import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { assignProperties, boxContain, boxesIntersect } from '@/utils'
import { useFlow, WhiteboardAtom } from '@/core/components/whiteboard/StateHooks'
import { getBoxOfNodes } from '@/core/components/whiteboard/utils'
import Id from '@/utils/id'
import useUpdateWhiteboard from '@/core/components/whiteboard/hooks/useUpdateWhiteboard'
import { MetaStore } from '@/api/stores'
import { enlargeBox } from '@/core/components/whiteboard/hooks/ops/group'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalInstance } from '@/hooks'
import { useStore } from 'jotai'

const assignNodeOps = (instance: IWhiteboardInstance) => {
  const updateWhiteboard = useUpdateWhiteboard()
  const store = useStore()
  const metaMap = MetaStore.getMetaObjectsMap()
  assignProperties(instance, {
    nodeOps: {
      getMaxZindex: () => {
        const allNodes = instance.getAllNode?.()
        if (!allNodes) throw 'Failed to get nodes'
        const zs = allNodes.map(i => i.z).filter(i => i !== undefined) as number[]
        return Math.max(...zs, 0)
      },
      updateAfterZ: currentNodeId => {
        const n = instance.getNode?.(currentNodeId)
        if (n) {
          const allNodes = instance.getAllNode?.()
          if (allNodes) {
            const afterZNodes = allNodes.filter(no => no.z > n.z)
            if (afterZNodes.length) {
              const maxZ = Math.max(...afterZNodes.map(i => i.z), 0)
              instance.updateWhiteboard?.(w => {
                afterZNodes.forEach(n => {
                  w.nodes?.set(n.id, { ...n, z: n.z - 1 })
                })
                w.nodes?.set(n.id, { ...n, z: maxZ })
              })
            }
          }
        }
      },
      updateRelatedEdges: nodeId => {
        const idArr = Array.isArray(nodeId) ? nodeId : [nodeId]
        idArr.forEach(id => {
          const relatedEdges = instance.values.NODE_TO_EDGE_MAP.get(id)
          relatedEdges?.forEach(edgeId => {
            instance.values.ID_TO_EDGE_MAP.get(edgeId)?.drawPath()
          })
        })
      },
      deleteNode: (nodeId, redo = true) => {
        const idArr = Array.isArray(nodeId) ? nodeId : [nodeId]
        idArr.forEach(id => {
          const origin = instance.getNode?.(id)
          if (origin) {
            const whiteboardId = store.get(WhiteboardAtom)?.id
            if (origin.type === 'metaObject' && whiteboardId) {
              const whiteboardMeta = MetaStore.getMetaObjectByObjectId(whiteboardId)
              if (whiteboardMeta) {
                const link = MetaStore.getMetaLinkBySourceAndTarget(origin.metaObjectId, whiteboardMeta.id)
                if (link) {
                  MetaStore.deleteMetaLink(link, true)
                }
              }
            }
          }
        })
        updateWhiteboard(w => {
          idArr.forEach(i => {
            w.nodes?.delete(i)
            instance.values.NODE_TO_EDGE_MAP.get(i)?.forEach(l => {
              w.edges?.delete(l)
            })
          })
        }, redo)
      },
      getNodeDOM: nodeId => {
        const element = instance.nodeOps?.getNodeFuncs(nodeId)?.getNodeDOM()
        if (!element) {
          throw new Error("Failed to find node's DOM!")
        }
        return element
      },
      expand: nodeId => {
        const idArr = Array.isArray(nodeId) ? nodeId : [nodeId]
        updateWhiteboard(w => {
          idArr.forEach(id => {
            const origin = w.nodes?.get(id)
            if (origin && origin.width) {
              w.nodes?.set(id, { ...origin, expanded: true, height: undefined, resized: false })
            }
          })
        }, true)
        setTimeout(() => {
          instance.selectOps?.resetSelectionBox()
        }, 50)
      },
      fold: nodeId => {
        const idArr = Array.isArray(nodeId) ? nodeId : [nodeId]
        updateWhiteboard(w => {
          idArr.forEach(id => {
            w.nodes?.has(id) &&
              w.nodes?.set(id, { ...w.nodes!.get(id)!, expanded: false, height: undefined, resized: false })
          })
        }, true)
        setTimeout(() => {
          instance.selectOps?.resetSelectionBox()
        }, 50)
      },
      intersectWith: (nodeId, box) => {
        const node = instance.getNode?.(nodeId)
        if (!node) return false
        if (node.type === 'group') {
          return boxContain(box, {
            left: node.x,
            top: node.y,
            width: node.width ?? 0,
            height: node.height ?? 0
          })
        }
        return boxesIntersect(
          {
            left: node.x,
            top: node.y,
            width: node.width ?? 0,
            height: node.height ?? 0
          },
          box
        )
      },
      canExpand: node => {
        if (node.type !== 'metaObject' || !node.metaObjectId) {
          return false
        }
        const metaObject = metaMap.get(node.metaObjectId)
        if (!metaObject) {
          return false
        }
        switch (metaObject.type) {
          case 'note':
          case 'pdf':
          case 'question':
          case 'video':
          case 'webpage':
          case 'audio':
          case 'tweet':
          case 'whiteboard':
          case 'group':
          case 'syncedBlock':
          case 'code':
            return true
        }
        return false
      },
      copy: nodeId => {
        const idArr = Array.isArray(nodeId) ? nodeId : [nodeId]
        const nodes = idArr.map(id => instance.getNode?.(id)).filter(i => i) as IWhiteboardNode[]
        const box = getBoxOfNodes(nodes)
        if (box) {
          // reset nodes coord to outest box
          const newNodes = nodes.map(n => ({ ...n, x: n.x - box.left, y: n.y - box.top }))
          instance.values.copiedElements = newNodes
        }
      },
      paste: position => {
        const currentCopied = instance.values.copiedElements
        if (currentCopied.length) {
          const pasteElements = currentCopied.map(n => ({ ...n, id: Id.getId(), x: n.x + position.x, y: n.y + position.y }))
          updateWhiteboard(w => {
            pasteElements.forEach(n => {
              w.nodes?.set(n.id, n)
            })
          }, true)
        }
      },
      getNodeFuncs: nodeId => {
        return instance.values.ID_TO_NODE_MAP.get(nodeId)
      },
      extendNodes: currentNodes => {
        const nodesArr = Array.isArray(currentNodes) ? currentNodes : [currentNodes]
        const normalized = (
          typeof nodesArr[0] === 'number' ? nodesArr.map(i => instance.getNode?.(i as number)).filter(i => i) : nodesArr
        ) as IWhiteboardNode[]
        const nodeSet = new Set<IWhiteboardNode>(normalized)
        const groupNodes = normalized.filter(i => i.type === 'group')
        groupNodes.forEach(g => {
          const insideNodes = instance.groupOps?.getNodesInGroup(g.id)
          insideNodes?.forEach(n => nodeSet.add(n))
        })
        return Array.from(nodeSet.values())
      },
      open: (nodeId, type) => {
        const node = instance.getNode?.(nodeId)
        if (!node || node.type !== 'metaObject' || !node.metaObjectId) return
        switch (type) {
          case 'newTab': {
            Rendevoz.Actions.Open.Meta.openMetaObject(node.metaObjectId)
            return
          }
          case 'sidePeek': {
            instance.sidebarOps?.openNodeAtSidebar(nodeId)
            return
          }
          case 'center': {
            GlobalInstance.metaOps?.preview(node.metaObjectId)
            return
          }
          case 'float': {
            instance.floatOps?.openNode(nodeId)
            return
          }
        }
      },
      fitContent: nodeId => {
        const idArr = Array.isArray(nodeId) ? nodeId : [nodeId]
        updateWhiteboard(w => {
          if (w.nodes) {
            idArr.forEach(id => {
              const origin = w.nodes?.get(id)
              if (origin) {
                if (origin.type === 'group') {
                  const insideNodes = instance.groupOps?.getNodesInGroup(origin.id)
                  if (insideNodes?.length) {
                    const box = getBoxOfNodes(
                      insideNodes.map(i => {
                        // if inside node also need fit content
                        if (idArr.includes(i.id)) {
                          const dom = instance.nodeOps?.getNodeDOM(i.id)
                          const scrollHeight = (
                            dom?.querySelector('[role="editor-container"]') || dom?.querySelector('[role="scroll-container"]')
                          )?.scrollHeight
                          if (scrollHeight) {
                            return { ...i, height: scrollHeight }
                          }
                          return i
                        }
                        return i
                      })
                    )
                    if (box) {
                      const enlarged = enlargeBox(box)
                      w.nodes?.set(id, { ...origin, x: enlarged.left, y: enlarged.top, width: enlarged.width, height: enlarged.height })
                    }
                  }
                } else {
                  w.nodes?.set(id, { ...origin, resized: false })
                }
              }
            })
          }
        }, true)
        setTimeout(() => {
          instance.selectOps?.resetSelectionBox()
        }, 20)
      }
    }
  })
}

export default assignNodeOps
