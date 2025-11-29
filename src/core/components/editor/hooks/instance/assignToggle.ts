import { CustomEditor, CustomElement, HeadingElement, IEditorInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { Editor, Element, Path, Transforms } from 'slate'
import { HeadingToLevel } from '@/core/components/editor/elements/Heading'

/**
 *  Toggle blocks like headings, ordered lists, bullet lists
 *  第一步：在当前层内找到被隐藏的元素
 *  Example:
 *  - 1
 *  - 2
 *    - 2.1
 *    - 2.2
 *    - 2.3
 *      - 2.3.1
 *      - 2.3.2
 *  如果toggle 2,那么找到同一层下方全部level大于自身的节点
 */

type NodeEntry = [element: CustomElement, path: Path]
const assignToggle = (instance: IEditorInstance, editor: CustomEditor) => {
  const findAllUnderNodes = (path: Path) => {
    const currentNode = Editor.node(editor, path)
    if (!currentNode) return
    // list item can only toggle levels larger than it, but headings can toggle level equals with it
    if (currentNode[0].type?.startsWith('heading')) {
      return findNodesUnderHeading(path)
    }
    const currentLevel = 'level' in currentNode[0] ? currentNode[0].level || 0 : 0

    const underNodes: NodeEntry[] = []
    let next: NodeEntry | undefined
    const nextPath = Path.next(currentNode[1])
    if (Editor.hasPath(editor, nextPath)) {
      next = Editor.node(editor, nextPath)
    }
    while (next) {
      if ('level' in next[0] && (next[0].level || 0) > currentLevel) {
        underNodes.push(next)
        const nextPath = Path.next(next[1])
        if (Editor.hasPath(editor, nextPath)) {
          next = Editor.node(editor, nextPath)
        } else {
          next = undefined
        }
      } else {
        next = undefined
      }
    }
    return underNodes
  }
  const haveUnderNode = (path: Path): boolean => {
    const currentNode = Editor.node(editor, path)
    if (!currentNode) return false
    const currentLevel = 'level' in currentNode[0] ? currentNode[0].level || 0 : 0
    const nextPath = Path.next(currentNode[1])
    let next
    if (Editor.hasPath(editor, nextPath)) {
      next = Editor.node(editor, nextPath)
    }

    // list item can only toggle levels larger than it, but headings can toggle level equals with it
    if (currentNode[0].type?.startsWith('heading')) {
      return !!next
    }
    if (next && 'level' in next[0] && (next[0].level || 0) > currentLevel) {
      return true
    }
    return false
  }
  const findNodesUnderHeading = (path: Path) => {
    const currentHeadingNode = Editor.node(editor, path)[0] as HeadingElement
    const headingLevel = HeadingToLevel[currentHeadingNode.type] || 1
    const underNodes: NodeEntry[] = []
    const nextPath = Path.next(path)
    let next: NodeEntry | undefined = undefined
    if (Editor.hasPath(editor, nextPath)) {
      next = Editor.node(editor, nextPath)
    }
    console.log(currentHeadingNode, next)
    let loop = 0
    while (next) {
      loop += 1
      if (loop > 2000) {
        next = false
        return
      }
      if (next[0].type.startsWith('heading')) {
        const nextHeadingLevel = HeadingToLevel[next[0].type] || 1
        if (nextHeadingLevel <= headingLevel) {
          next = undefined
          return underNodes
        }
      }
      underNodes.push(next)
      const nextPath = Path.next(next[1])
      if (Editor.hasPath(editor, nextPath)) {
        next = Editor.node(editor, nextPath)
      } else {
        next = undefined
      }
    }
    return underNodes
  }
  assignProperties(instance, {
    toggleOps: {
      toggleBlock: path => {
        const currentNode = Editor.node(editor, path)[0]
        if (!currentNode || !('type' in currentNode)) return
        if (instance.toggleOps?.isTogglableElement(currentNode) && currentNode.folded) {
          return
        }
        const allUnderNodes = findAllUnderNodes(path)
        console.log(allUnderNodes)
        Transforms.setNodes(
          editor,
          {
            folded: true
          },
          {
            at: path
          }
        )
        if (allUnderNodes && allUnderNodes.length) {
          allUnderNodes.forEach(([element, path]) => {
            Transforms.setNodes(
              editor,
              {
                hide: true
              },
              {
                at: path
              }
            )
          })
        }
      },
      untoggleBlock: path => {
        const currentNode = Editor.node(editor, path)[0]
        if (!currentNode || !('type' in currentNode)) return
        if (instance.toggleOps?.isTogglableElement(currentNode) && !currentNode.folded) {
          return
        }
        Transforms.setNodes(
          editor,
          {
            folded: false
          },
          {
            at: path
          }
        )
        const allUnderNodes = findAllUnderNodes(path)
        if (allUnderNodes && allUnderNodes.length) {
          // some nodes maybe hiden by nestest toggle items, don't make them visible
          const copyed = new Map(allUnderNodes.map(i => [i[0].id, i]))
          for (const [k, v] of copyed) {
            if (instance.toggleOps?.isTogglableElement(v[0]) && v[0].folded === true && haveUnderNode(v[1])) {
              const children = findAllUnderNodes(v[1])
              if (children) {
                children.forEach(c => {
                  copyed.delete(c[0].id)
                })
              }
            }
          }
          const left = Array.from(copyed.values())
          left.forEach(([element, path]) => {
            Transforms.setNodes(
              editor,
              {
                hide: false
              },
              {
                at: path
              }
            )
          })
        }
      },
      haveToggledChildren: path => {
        const nodesUnder = haveUnderNode(path)
        return nodesUnder
      },
      getUnderNodes: path => {
        const currentNode = Editor.node(editor, path)[0] as CustomElement
        if ('type' in currentNode && instance.toggleOps?.isTogglableElement(currentNode)) {
          if (currentNode.folded) {
            const allUndernodes = findAllUnderNodes(path)
            if (allUndernodes) {
              const hidenNodes = allUndernodes.filter(i => i[0].hide === true)
              return hidenNodes
            }
          }
        }
        return [[currentNode, path]]
      },
      findAllPossibleChildrenNodes: path => {
        return findAllUnderNodes(path)
      },
      isTogglableElement: element => {
        if (
          'type' in element &&
          (element.type === 'list-item' || element.type === 'order-list-item' || element.type?.startsWith('heading'))
        ) {
          return true
        }
        return false
      },
      getFoldedOffsetPath: path => {
        const node = Editor.node(editor, path)[0] as CustomElement
        if (instance.toggleOps?.isTogglableElement(node) && node.folded && haveUnderNode(path)) {
          const underNodes = instance.toggleOps?.getUnderNodes(path)
          if (underNodes?.length) {
            return underNodes[underNodes.length - 1][1]
          }
        }
        return path
      },
      extendElements: elementz => {
        const elements = Array.isArray(elementz) ? elementz : [elementz]
        const normalized: NodeEntry[] = []
        const pathMap = instance.values.ID_TO_PATH
        elements.forEach(element => {
          const path = pathMap.get(element.id)
          if (!path) throw new Error("Can't find element's path")
          normalized.push([element, path])
          if (instance.toggleOps?.isTogglableElement(element) && element.folded) {
            const underNodes = instance.toggleOps?.getUnderNodes(path)
            underNodes?.forEach(n => {
              normalized.push(n)
            })
          }
        })
        return normalized
      }
    }
  })
}

export default assignToggle
