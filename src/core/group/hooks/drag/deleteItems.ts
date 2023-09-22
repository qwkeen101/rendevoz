import { Draft } from 'immer'
import { MetaGroupChild } from '~/typings'
import { NodeEntry, NodeNodesOptions, Path, Node as SlateNode } from 'slate'
import Node from '../../utils/node'

function* nodes(root: Node, options: NodeNodesOptions = {}): Generator<NodeEntry, void, undefined> {
  const { pass, reverse = false } = options
  const { from = [], to } = options
  const visited = new Set()
  let p: Path = from
  let n = root

  while (true) {
    console.log(p)
    if (to && (reverse ? Path.isBefore(p, to) : Path.isAfter(p, to))) {
      break
    }

    if (!visited.has(n)) {
      yield [n, p]
    }

    // If we're allowed to go downward and we haven't descended yet, do.
    if (!visited.has(n) && n.children?.length !== 0) {
      visited.add(n)
      let nextIndex = reverse ? n.children.length - 1 : 0

      if (Path.isAncestor(p, from)) {
        nextIndex = from[p.length]
      }

      p = p.concat(nextIndex)
      n = Node.get(root, p)
      continue
    }

    // If we're at the root and we can't go down, we're done.
    if (p.length === 0) {
      break
    }

    // If we're going forward...
    if (!reverse) {
      const newPath = Path.next(p)

      if (Node.has(root, newPath)) {
        p = newPath
        n = Node.get(root, p)
        continue
      }
    }

    // If we're going backward...
    if (reverse && p[p.length - 1] !== 0) {
      const newPath = Path.previous(p)
      p = newPath
      n = Node.get(root, p)
      continue
    }

    // Otherwise we're going upward...
    p = Path.parent(p)
    n = Node.get(root, p)
    visited.add(n)
  }
}

const deleteItems = (value: Draft<MetaGroupChild>[], startPath: Path, endPath: Path) => {
  const items = nodes(
    { children: value },
    {
      from: startPath,
      to: endPath
    }
  )
  const itemsArr = Array.from(items)
  for (const [node, path] of itemsArr) {
    if (!path?.length) continue
    const index = path[path.length - 1]
    const parent = Node.get({ children: value }, Path.parent(path))
    parent.children.splice(index, 1)
    itemsArr.forEach(
      i =>
        (i[1] = Path.transform(i[1], {
          type: 'remove_node',
          path
        }))
    )
  }
}

export default deleteItems
