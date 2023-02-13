import Id from '@/utils/id'
import { Editor, Element, NodeEntry, Path, PathRef, Transforms } from 'slate'
import { CustomEditor, CustomElement } from '../types'
import moveSingleElement from './moveSingleElement'

const moveMultiElements = (
  editor: CustomEditor,
  currNodes: NodeEntry<CustomElement>[],
  targetPath: Path,
  direction: string,
  isNested: boolean
) => {
  const tempPathRefMap = new Map<Element, PathRef>()
  // before moving, track all paths
  currNodes.forEach(([element, path]) => {
    const pathRef = Editor.pathRef(editor, path)
    tempPathRefMap.set(element, pathRef)
  })
  currNodes.sort((prev, curr) => {
    const prevPath = tempPathRefMap.get(prev[0])?.current
    const currPath = tempPathRefMap.get(curr[0])?.current
    return Path.compare(prevPath, currPath)
  })

  // bottom or top move won't destory path ref,use move single element is okay
  if (direction === 'bottom' || direction === 'top') {
    let nextTargetPath = targetPath
    if (direction === 'top') {
      currNodes.reverse()
    }

    let nested = isNested
    currNodes.forEach(([ele]) => {
      const currPathRef = tempPathRefMap.get(ele)

      if (!currPathRef) return
      const currPath = currPathRef.current
      if (!currPath) {
        currPathRef.unref()
        return
      }
      // multi select only handle nested once
      moveSingleElement(editor, currPath, nextTargetPath, direction, nested)
      nested = false
      nextTargetPath = currPathRef.unref() as Path
    })
  }
  if (direction === 'left' || direction === 'right') {
    const targetNode = Editor.node(editor, targetPath)
    if (targetNode[0].type !== 'column') {
      // we are dropping on normal block
      // first we need to create a column list at target path
      Transforms.removeNodes(editor, { at: targetPath })
      Transforms.insertNodes(
        editor,
        {
          type: 'columnList',
          id: Id.getId(),
          children:
            direction === 'left'
              ? [
                  {
                    type: 'column',
                    id: Id.getId(),
                    ratio: 0.5,
                    children: [...currNodes.map(i => i[0])]
                  },
                  {
                    type: 'column',
                    id: Id.getId(),
                    ratio: 0.5,
                    children: [targetNode[0]]
                  }
                ]
              : [
                  {
                    type: 'column',
                    id: Id.getId(),
                    ratio: 0.5,
                    children: [targetNode[0]]
                  },
                  {
                    type: 'column',
                    id: Id.getId(),
                    ratio: 0.5,
                    children: [...currNodes.map(i => i[0])]
                  }
                ]
        },
        {
          at: targetPath
        }
      )
      currNodes.forEach(([ele]) => {
        const path = tempPathRefMap.get(ele)?.current
        path && Transforms.removeNodes(editor, { at: path })
      })
    } else {
      let doesAllSelectedBlocksAreColumnAllChildren = true
      const tempParentColumnPath = Path.parent(tempPathRefMap.get(currNodes[0][0])?.current)
      currNodes.forEach(([ele]) => {
        const path = tempPathRefMap.get(ele)?.current
        if (path) {
          const parent = Path.parent(path)
          if (!Path.equals(parent, tempParentColumnPath)) {
            doesAllSelectedBlocksAreColumnAllChildren = false
          }
        }
      })
      if (
        doesAllSelectedBlocksAreColumnAllChildren &&
        tempParentColumnPath &&
        (Path.equals(targetPath, tempParentColumnPath) ||
          (Path.equals(Path.hasPrevious(targetPath) ? Path.previous(targetPath) : targetPath, tempParentColumnPath) &&
            direction !== 'right'))
      ) {
        return
      }
      if (direction === 'right') {
        targetPath = Path.next(targetPath)
      }
      Transforms.insertNodes(
        editor,
        {
          type: 'column',
          id: Id.getId(),
          children: []
        },
        { at: targetPath }
      )
      const targetColumnListId = Editor.node(editor, Path.parent(targetPath))[0].id
      let count = 0
      currNodes.forEach(([ele]) => {
        const currPathRef = tempPathRefMap.get(ele)
        if (!currPathRef) return
        if (currPathRef.current === null) {
          currPathRef.unref()
          return
        }
        const currPath = currPathRef.current
        Transforms.moveNodes(editor, {
          at: currPath,
          to: [...targetPath, count]
        })
        const currParentPath = Path.parent(currPath)
        const currParentNode = Editor.node(editor, currParentPath)
        console.log(currParentNode)
        if (Editor.isEmpty(editor, currParentNode[0])) {
          Transforms.removeNodes(editor, { at: currParentPath })
        }
        count += 1
      })
      // after insert new column,we need to recalculate the widths of all the columns
      // origin column blocks width ratio should * (1 - 1/n),new column width ratio = 1/n
      const targetColumnListPath = [editor.children.findIndex(i => i.id === targetColumnListId)]
      const targetColumnList = Editor.node(editor, targetColumnListPath)[0]
      const columnsLength = targetColumnList.children.length
      targetColumnList.children.forEach((i, idx) => {
        const columnPath = [...targetColumnListPath, idx]
        Transforms.setNodes(
          editor,
          {
            ratio: i.ratio ? i.ratio * (1 - 1 / columnsLength) : 1 / columnsLength
          },
          {
            at: columnPath
          }
        )
      })
    }
  }
}

export default moveMultiElements
