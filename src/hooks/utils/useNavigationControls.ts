import { useLocation, useNavigationType } from 'react-router-dom'
import { useEffect } from 'react'
import { atom } from 'jotai/index'
import { useGlobalAtom } from '@/hooks'

const HISTORY_RECORD: Record<
  'YOUTUBE' | 'PODCAST' | 'FEED',
  {
    stack: string[]
    index: number
  }
> = {
  YOUTUBE: {
    stack: [],
    index: 0
  },
  PODCAST: {
    stack: [],
    index: 0
  },
  FEED: {
    stack: [],
    index: 0
  }
}

const atoms = {
  YOUTUBE: atom(0),
  FEED: atom(0),
  PODCAST: atom(0)
}
export default (key: keyof typeof HISTORY_RECORD) => {
  const location = useLocation()
  const navigationType = useNavigationType()
  const historyStack = HISTORY_RECORD[key].stack // 维护历史路径
  const latestIndex = HISTORY_RECORD[key].index
  const [currentIndex, setCurrentIndex] = useGlobalAtom(atoms[key])

  useEffect(() => {
    const currentPath = location.key
    const index = HISTORY_RECORD[key].stack.indexOf(currentPath)
    const currIdx = latestIndex
    if (index === -1) {
      if (navigationType === 'REPLACE') {
        HISTORY_RECORD[key].stack[currIdx] = currentPath
      }
      // 新页面，添加到历史栈
      else {
        HISTORY_RECORD[key].stack = HISTORY_RECORD[key].stack.slice(0, currIdx + 1)
        HISTORY_RECORD[key].stack.push(currentPath)
        setCurrentIndex(HISTORY_RECORD[key].stack.length - 1)
        HISTORY_RECORD[key].index = HISTORY_RECORD[key].stack.length - 1
      }
    } else {
      // 已经访问过，更新索引
      HISTORY_RECORD[key].index = index
      setCurrentIndex(index)
    }
  }, [location.key])

  return {
    currentIndex,
    historyStack,
    canForward: currentIndex < HISTORY_RECORD[key].stack.length - 1,
    canBack: currentIndex > 0
  }
}
