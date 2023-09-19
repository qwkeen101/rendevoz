import { GroupValueEntry, MetaGroupChild } from '~/typings'
import { Path } from 'slate'
type GroupRoot = { children: MetaGroupChild[] }
const Node = {
  get: (root: GroupRoot, path: Path) => {
    let node = root
    for (let i = 0; i < path.length; i++) {
      const p = path[i]
      if (!node.children || !node.children[p]) {
        break
      }
      node = node.children[p]
    }
    return node
  },
  elements(
    root: GroupRoot,
    options?: {
      match?: (r: MetaGroupChild) => boolean
    }
  ) {
    const entries: GroupValueEntry[] = []
    const loop = (r: MetaGroupChild, path: Path) => {
      if (options?.match) {
        const matched = options.match(r)
        if (!matched) return
      }
      entries.push([r, path])
      if (r.children) {
        r.children.forEach((v, i) => loop(v, [...path, i]))
      }
    }
    root.children.forEach((v, i) => loop(v, [i]))
    return entries
  },
  has(root: GroupRoot, path: Path): boolean {
    let node = root

    for (let i = 0; i < path.length; i++) {
      const p = path[i]

      if (!node.children?.[p]) {
        return false
      }

      node = node.children[p]
    }

    return true
  }
}

export default Node
