import { cloneElement, CSSProperties, FC, memo, MouseEventHandler, ReactElement, ReactNode, useEffect, useState } from 'react'
import Content from '../Content'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './index.module.less'
import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'

export interface TabNavListProps {
  defaultActiveKey: string
  navs: {
    tab: string | ReactElement
    key: string
  }[]
  style?: CSSProperties
  onTabClick: (key: string, e: MouseEvent) => void
  extra?: ReactNode
  containerStyle?: CSSProperties
}
const TabNavList: FC<TabNavListProps> = ({ navs, onTabClick, defaultActiveKey, extra, style, containerStyle }) => {
  const [selectedTabKey, setSelectedTabKey] = useState(defaultActiveKey)
  useEffect(() => {
    if (defaultActiveKey) {
      setSelectedTabKey(defaultActiveKey)
    }
  }, [defaultActiveKey])

  return (
    <Content flex alignItems="center" justifyContent="space-between" gap={16} style={containerStyle}>
      <Content flex alignItems="center" style={{ flexShrink: 1, flexWrap: 'wrap' }} gap={6}>
        {navs.map(nav => (
          <div
            className={ClassName.flatButton()}
            onClick={e => {
              onTabClick(nav.key, e)
              setSelectedTabKey(nav.key)
            }}
            style={{
              userSelect: 'none',
              padding: '2px 8px',
              fontWeight: 600,
              fontSize: FontSize['13px'],
              background: nav.key === selectedTabKey ? Colors.Background.ButtonHover : undefined,
              ...style
            }}
            key={nav.key}
          >
            {nav.tab}
          </div>
        ))}
      </Content>
      {extra}
    </Content>
  )
}
interface TabPanesListProps {
  activeKey: string
  tabPanes: TabPaneProps[]
  disableAnimation?: boolean
}
const TabPanesList: FC<TabPanesListProps> = memo(({ activeKey, tabPanes, disableAnimation }) => {
  return (
    <Content fullWidth fullHeight style={{ overflow: 'hidden' }}>
      {disableAnimation ? (
        <>
          {tabPanes.map(tabPane => (
            <TabPane
              onClick={tabPane.onClick}
              style={tabPane.style}
              key={tabPane.innerKey}
              active={activeKey === tabPane.innerKey}
              disableAnimation={disableAnimation}
              children={tabPane.children}
            />
          ))}
        </>
      ) : (
        <AnimatePresence initial={false}>
          {tabPanes.map(tabPane => (
            <TabPane
              onClick={tabPane.onClick}
              style={tabPane.style}
              key={tabPane.innerKey}
              active={activeKey === tabPane.innerKey}
              children={tabPane.children}
            />
          ))}
        </AnimatePresence>
      )}
    </Content>
  )
})

interface TabsProps {
  defaultActiveKey: string
  children: ReactElement<TabPaneProps> | ReactElement<TabPaneProps>[]
  extra?: ReactNode
  activeKey?: string
  onTabClick?: (key: string, e: MouseEvent) => void
  renderTabNav?: (defaultTabNav: TabNavListProps) => ReactNode
  disableInnerPanes?: boolean
  disableTabNav?: boolean
  disableAnimation?: boolean
  tabNavStyle?: CSSProperties
  tabNavContainerStyle?: CSSProperties
}
export const Tabs: FC<TabsProps> = memo(
  ({
    children,
    defaultActiveKey,
    onTabClick,
    renderTabNav,
    extra,
    disableInnerPanes = false,
    activeKey: outActiveKey,
    disableTabNav,
    disableAnimation,
    tabNavStyle,
    tabNavContainerStyle
  }) => {
    let panes: ReactElement<TabPaneProps>[]
    if (!Array.isArray(children)) {
      panes = [children]
    } else {
      panes = children
    }

    const tabNavs = panes.map(c => {
      return {
        tab: c.props.tab,
        key: c.key
      }
    })
    const [activeKey, setActiveKey] = useState(defaultActiveKey || outActiveKey || tabNavs[0]?.key)
    const onInternalTabClick = (key: string, e: MouseEvent) => {
      onTabClick?.(key, e)
      setActiveKey(key)
    }
    if (disableInnerPanes) {
      panes = panes.map(p =>
        cloneElement(p, {
          active: p.key === activeKey
        })
      )
    }
    useEffect(() => {
      if (outActiveKey) {
        setActiveKey(outActiveKey)
      }
    }, [outActiveKey])
    const tabPanes = panes.map(pane => ({
      ...pane.props,
      innerKey: String(pane.key)
    }))
    const tabNavListRenderer = () =>
      renderTabNav ? (
        renderTabNav({
          onTabClick: onInternalTabClick,
          defaultActiveKey: activeKey,
          navs: tabNavs,
          extra
        })
      ) : (
        <TabNavList
          containerStyle={tabNavContainerStyle}
          onTabClick={onInternalTabClick}
          extra={extra}
          navs={tabNavs}
          defaultActiveKey={activeKey}
          style={tabNavStyle}
        />
      )
    return (
      <Content fullHeight flex column>
        {!disableTabNav && tabNavListRenderer()}
        {disableInnerPanes ? panes : <TabPanesList disableAnimation={disableAnimation} activeKey={activeKey} tabPanes={tabPanes} />}
      </Content>
    )
  }
)
interface TabPaneProps {
  onClick?: MouseEventHandler
  children: ReactNode
  tab: string | ReactElement
  innerKey?: string
  style?: CSSProperties
  active?: boolean
  disableAnimation?: boolean
}
export const TabPane: FC<TabPaneProps> = memo(({ children, onClick, style, active, disableAnimation }) => {
  const mergedStyle = { width: '100%', height: '100%', ...style, transition: disableAnimation ? 'none' : style?.transition }
  const variants = {
    hidden: {
      contentVisiblity: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: -1,
      opacity: 0
    },
    visible: {
      opacity: 1,
      pointerEvents: 'auto',
      zIndex: 0
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate={active ? 'visible' : 'hidden'}
      variants={variants}
      className={styles.tabPane}
      style={mergedStyle}
      onClick={onClick}
      transition={{ duration: 0 }}
    >
      {children}
    </motion.div>
  )
})
