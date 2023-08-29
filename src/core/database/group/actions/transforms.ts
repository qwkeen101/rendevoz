import { MetaGroupChild } from '~/typings'
import produce from 'immer'
import { Path } from 'slate'

const swapTwoElements = (root: MetaGroupChild[], sourcePath: number[], targetPath: number[], position: 'top' | 'bottom' | 'inner') => {
  const copyedSource = sourcePath.slice()
  const lastSourceIndex = sourcePath[sourcePath.length - 1]
  return produce(root, draft => {
    // get origin
    let originParent
    let origin = draft[copyedSource[0]]
    copyedSource.shift()
    while (copyedSource.length) {
      const first = copyedSource.shift()
      if (first !== undefined && origin.children?.length) {
        originParent = origin
        origin = origin.children[first]
      }
    }
    // delete origin
    if (sourcePath.length > 1 && originParent?.children) {
      originParent.children.splice(lastSourceIndex, 1)
    } else {
      draft.splice(sourcePath[0], 1)
    }

    // insert into target, recalculate target path
    const newTargetPath = Path.transform(targetPath, {
      type: 'remove_node',
      path: sourcePath
    })
    if (newTargetPath?.length) {
      if (newTargetPath.length === 1) {
        if (position === 'top') {
          draft.splice(newTargetPath[0], 0, origin)
        }
        if (position === 'bottom') {
          draft.splice(newTargetPath[0] + 1, 0, origin)
        }
        if (position === 'inner') {
          draft[newTargetPath[0]].children = [origin, ...(draft[newTargetPath[0]].children || [])]
        }
      } else {
        let finalTargetParent = draft[newTargetPath[0]]
        newTargetPath.shift()
        const lastTargetIndex = newTargetPath[newTargetPath.length - 1]
        while (newTargetPath.length > 1) {
          const i = newTargetPath.shift()
          if (i !== undefined) {
            finalTargetParent = finalTargetParent.children?.[i]
          }
        }
        if (finalTargetParent && finalTargetParent.children?.length) {
          if (position === 'top') {
            finalTargetParent.children.splice(lastTargetIndex, 0, origin)
          }
          if (position === 'bottom') {
            finalTargetParent.children.splice(lastTargetIndex + 1, 0, origin)
          }
          if (position === 'inner') {
            finalTargetParent.children[lastTargetIndex].children = [origin, ...(finalTargetParent.children[lastTargetIndex].children || [])]
          }
        }
      }
    }
  })
}

export const GroupTransforms = {
  swapTwoElements
}
