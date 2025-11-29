import { createContext, CSSProperties } from 'react'

const BlockLevelContext = createContext<
  | {
      id: number
      style?: CSSProperties
      index: number
      measureElement?: any
    }
  | undefined
>(undefined)

export default BlockLevelContext
