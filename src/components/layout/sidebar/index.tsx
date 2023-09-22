import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './index.module.less'
import Navigation from './Navigation'
import { Rnd } from 'react-rnd'
import { delay } from 'lodash'
import classNames from 'classnames'
import ClassName from '@/styles/classNames'
import { getOS } from '@/App'
import { atom } from 'jotai'
import { useGlobalAtom, useGlobalAtomValue } from '@/hooks'
import { LayoutIdToTabMap } from '..'
import useAppState from '@/core/rendevoz/appState'
import { Content } from '@/components'
import SidebarPanel from '@/components/layout/sidebar/SidebarPanel'
import { Colors } from '@/consts'

export const SidebarStateAtom = atom<{
  collapsed: boolean
  width: number
  hovered: boolean
  ref?: Rnd
}>({
  collapsed: false,
  width: 64,
  hovered: false
})

export const SidebarPanelStateAtom = atom<{
  visible?: 'database' | 'collections' | 'webSearch'
  open: boolean
  showObjectDetails?: {
    id: number
    visible: boolean
  }
}>({
  open: false
})

export const SidebarCollapseAtom = atom(false)
export const Sidebar: FC = () => {
  const navRef = useRef<HTMLElement>(null)
  const rndRef = useRef<Rnd>(null)
  const [appState, setAppState] = useAppState()
  const [sidebarState, setSidebarState] = useGlobalAtom(SidebarStateAtom)
  const [widthTransition, setWidthTransition] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    setAppState(s => ({ ...s, sidebarCollapsed: sidebarState.collapsed }))
  }, [sidebarState.collapsed])

  useLayoutEffect(() => {
    if (appState.sidebarCollapsed) {
      setSidebarState(s => ({
        ...s,
        collapsed: appState.sidebarCollapsed,
        width: 0
      }))
    }
  }, [])
  const { hovered, collapsed } = sidebarState
  useEffect(() => {
    const os = getOS()
    if (os === 'macos' && collapsed) {
      const macosPlaceholder = document.getElementById('macos-placeholder')
      if (macosPlaceholder) {
        macosPlaceholder.style.setProperty('display', 'block')
        return () => {
          macosPlaceholder.style.setProperty('display', 'none')
        }
      }
    }
  }, [collapsed])
  return (
    <Content
      flex
      tabIndex={-1}
      style={{ zIndex: 1000 }}
      onMouseLeave={() => {
        if (!isResizing) setSidebarState(s => ({ ...s, hovered: false }))
      }}
      onClick={() => {
        console.log(LayoutIdToTabMap)
      }}
      onDragLeave={e => {
        e.preventDefault()
        if (!isResizing) setSidebarState(s => ({ ...s, hovered: false }))
      }}
    >
      <Navigation hovered={collapsed}></Navigation>
      <SidebarPanel />
    </Content>
  )
}
