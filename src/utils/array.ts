import React, { cloneElement, ReactChild, ReactNode, Children, isValidElement, ReactElement } from 'react'

export const pushNumberIntoUnrepeatableArray = (value: number, origin?: number[]) => {
  const set = new Set([...(origin || [])])
  set.add(value)
  return Array.from(set.values())
}

export default function flattenChildren(children: ReactNode, depth: number = 0, keys: (string | number)[] = []): ReactNode[] {
  return Children.toArray(children).reduce((acc: ReactNode[], node: ReactNode, nodeIndex) => {
    if (node?.type === React.Fragment) {
      acc.push.apply(acc, flattenChildren(node.props.children, depth + 1, keys.concat(node.key || nodeIndex)))
    } else {
      if (isValidElement(node)) {
        acc.push(
          cloneElement(node, {
            key: keys.concat(String(node.key)).join('.')
          })
        )
      } else if (typeof node === 'string' || typeof node === 'number') {
        acc.push(node)
      }
    }
    return acc
  }, [])
}
