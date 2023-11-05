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
      match?: (r: MetaGroupChild, path: Path, parent?: MetaGroupChild) => boolean
    }
  ) {
    const entries: GroupValueEntry[] = []
    const loop = (r: MetaGroupChild, path: Path, parent?: MetaGroupChild) => {
      if (options?.match) {
        const matched = options.match(r, path, parent)
        if (!matched) return
      }
      entries.push([r, path])
      if (r.children) {
        r.children.forEach((v, i) => loop(v, [...path, i], r))
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
  },
  fragment(root: GroupRoot, startPath: Path, endPath: Path) {
    const start = Path.isAfter(startPath, endPath) ? endPath : startPath
    const end = start === startPath ? endPath : startPath
    const entries = Node.elements(root, {
      match: (n, path) => {
        return Path.compare(path, start) >= 0 && Path.compare(path, end) <= 0
      }
    })
    return entries
  }
}

export default Node
