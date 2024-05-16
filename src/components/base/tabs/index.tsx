import {
  cloneElement,
  CSSProperties,
  FC,
  memo,
  MouseEventHandler,
  ReactElement,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useState
} from 'react'
import Content from '../Content'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './index.module.less'
import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'
import classnames from 'classnames'

export interface TabNavListProps {
  leftExtra?: ReactNode
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
const TabNavList: FC<TabNavListProps> = ({ leftExtra, navs, onTabClick, defaultActiveKey, extra, style, containerStyle }) => {
  const [selectedTabKey, setSelectedTabKey] = useState(defaultActiveKey)
  useEffect(() => {
    if (defaultActiveKey) {
      setSelectedTabKey(defaultActiveKey)
    }
  }, [defaultActiveKey])

  return (
    <Content flex alignItems="center" justifyContent="space-between" gap={16} style={containerStyle}>
      <Content flex alignItems="center" style={{ flexShrink: 1, flexWrap: 'wrap' }} gap={6}>
        {leftExtra}
        {navs.map(nav => (
          <div
            className={classnames(ClassName.flatButton(), nav.key === selectedTabKey && 'active-button')}
            onClick={e => {
              onTabClick(nav.key, e)
              setSelectedTabKey(nav.key)
            }}
            style={{
              userSelect: 'none',
              padding: '2px 8px',
              fontSize: FontSize['13px'],
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
  mountAll?: boolean
}
const TabPanesList: FC<TabPanesListProps> = memo(({ activeKey, tabPanes, disableAnimation, mountAll }) => {
  return (
    <Content fullWidth fullHeight style={{ overflow: 'hidden' }}>
      {disableAnimation ? (
        <>
          {tabPanes.map(tabPane => (
            <TabPane
              mount={tabPane.mount ?? mountAll}
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
              mount={tabPane.mount ?? mountAll}
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

type TabsProps = {
  mountAll?: boolean
  children: ReactElement<TabPaneProps> | (ReactElement<TabPaneProps> | null)[] | null
  extra?: ReactNode
  style?: CSSProperties
  onTabClick?: (key: string, e: MouseEvent) => void
  renderTabNav?: (defaultTabNav: TabNavListProps) => ReactNode
  disableInnerPanes?: boolean
  disableTabNav?: boolean
  disableAnimation?: boolean
  tabNavStyle?: CSSProperties
  tabNavContainerStyle?: CSSProperties
  tabNavLeftExtra?: ReactNode
} & (
  | {
      defaultActiveKey: string
    }
  | {
      activeKey?: string
    }
  | {
      activeKey?: string
      defaultActiveKey?: string
    }
)
export const Tabs: FC<TabsProps> = memo(
  ({
    children,
    defaultActiveKey,
    onTabClick,
    renderTabNav,
    extra,
    mountAll,
    disableInnerPanes = false,
    activeKey: outActiveKey,
    disableTabNav,
    disableAnimation,
    tabNavStyle,
    style,
    tabNavContainerStyle,
    tabNavLeftExtra
  }) => {
    let panes: (ReactElement<TabPaneProps> | null)[]
    if (!Array.isArray(children)) {
      panes = [children]
    } else {
      panes = children
    }
    panes = panes.filter(i => i)

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
    useLayoutEffect(() => {
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
          leftExtra={tabNavLeftExtra}
          onTabClick={onInternalTabClick}
          extra={extra}
          navs={tabNavs}
          defaultActiveKey={activeKey}
          style={tabNavStyle}
        />
      )
    return (
      <Content fullHeight flex column style={style}>
        {!disableTabNav && tabNavListRenderer()}
        {disableInnerPanes ? (
          panes
        ) : (
          <TabPanesList mountAll={mountAll} disableAnimation={disableAnimation} activeKey={activeKey} tabPanes={tabPanes} />
        )}
      </Content>
    )
  }
)
interface TabPaneProps {
  onClick?: MouseEventHandler
  children: ReactNode
  tab?: string | ReactElement | null
  innerKey?: string
  style?: CSSProperties
  active?: boolean
  disableAnimation?: boolean
  mount?: boolean
}
export const TabPane: FC<TabPaneProps> = memo(({ children, onClick, style, active, disableAnimation, mount }) => {
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
      position: 'relative',
      zIndex: 0
    }
  }
  const [actived, setActived] = useState(mount ?? false)
  useLayoutEffect(() => {
    if (active) {
      setActived(true)
    }
  }, [active])
  if (!actived) return null
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
