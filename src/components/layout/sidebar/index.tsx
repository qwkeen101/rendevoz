import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './index.module.less'
import Navigation from './Navigation'
import { Rnd } from 'react-rnd'
import { delay } from 'lodash'
import classNames from 'classnames'
import ClassName from '@/styles/classNames'
import { getOS } from '@/App'
import { atom } from 'jotai'
import { useGlobalAtom, useMount } from '@/hooks'
import { Rendevoz } from '@/core/rendevoz'
import { LayoutIdToTabMap } from '..'
import useAppState from '@/core/rendevoz/appState'

export const SidebarStateAtom = atom<{
  collapsed: boolean
  width: number
  hovered: boolean
  ref?: Rnd
}>({
  collapsed: false,
  width: 240,
  hovered: false
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
      setSidebarState(s => ({ ...s, collapsed: appState.sidebarCollapsed, width: 0 }))
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
    <div
      tabIndex={-1}
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
      <Rnd
        id="global-sidebar"
        data-hovered={sidebarState.hovered}
        data-collapsed={collapsed}
        data-width-transition={widthTransition}
        ref={r => {
          rndRef.current = r
          sidebarState.ref = r
        }}
        default={{ width: 240, height: '100vh', x: 0, y: 0 }}
        position={{ x: 0, y: 0 }}
        className={styles.rnd}
        disableDragging
        style={{ pointerEvents: collapsed ? 'none' : 'auto' }}
        enableResizing={{ right: hovered || !collapsed }}
        maxWidth={380}
        onResizeStart={() => {
          setIsResizing(true)
        }}
        onResize={(e, dir, ele) => {
          if (ele.clientWidth <= 100) {
            setWidthTransition(true)
            delay(() => {
              setWidthTransition(false)
            }, 200)
            rndRef.current?.updateSize({ width: 20, height: '100vh' })
            setSidebarState({
              width: 10,
              collapsed: true,
              hovered: false
            })
          }
        }}
        onResizeStop={(e, dir, ele) => {
          if (!collapsed) {
            setSidebarState(s => ({ ...s, width: ele.clientWidth }))
          }
          delay(() => {
            setIsResizing(false)
          }, 200)
          if (ele.clientWidth <= 200) {
            if (ele.clientWidth === 20) {
              rndRef.current?.updateSize({ width: 240, height: '100vh' })
              setSidebarState(s => ({ ...s, width: 0 }))
            } else {
              setWidthTransition(true)
              delay(() => {
                setWidthTransition(false)
              }, 200)
              if (!collapsed) {
                setSidebarState(s => ({ ...s, width: 240 }))
              }
              rndRef.current?.updateSize({ width: 240, height: '100vh' })
            }
          }
        }}
      >
        <nav
          onMouseEnter={e => {
            if (
              e.nativeEvent.path.some(i => i.getAttribute && (i.getAttribute('role') === 'modal' || i.getAttribute('role') === 'backdrop'))
            ) {
              return
            }
            if (!isResizing) setSidebarState(s => ({ ...s, hovered: true }))
          }}
          onDragOver={e => {
            e.preventDefault()
            if (!isResizing) setSidebarState(s => ({ ...s, hovered: true }))
          }}
          className={classNames(styles.nav, collapsed && ClassName.Background.pseudoBlubBackground)}
          ref={navRef}
          style={
            collapsed
              ? {
                  minHeight: '55vh',
                  maxHeight: '80vh',
                  padding: '20px 0px',
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px',
                  overflow: 'hidden',
                  pointerEvents: 'auto'
                }
              : undefined
          }
        >
          <Navigation hovered={collapsed}></Navigation>
        </nav>
      </Rnd>
    </div>
  )
}
