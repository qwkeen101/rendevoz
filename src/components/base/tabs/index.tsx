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
  useState,
  Children
} from 'react'
import Content from '../Content'
import classnames from 'classnames'
import { Colors } from '@/consts'
import { Select } from '@/components'
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
  containerClassName?: string
  className?: string
  leftStyle?: CSSProperties
  mode?: 'select' | 'underline' | 'options' | 'switch' | 'reverse'
  leftClassName?: string
}
const TabNavList: FC<TabNavListProps> = ({
  mode = 'select',
  leftExtra,
  navs,
  onTabClick,
  defaultActiveKey,
  extra,
  leftStyle,
  leftClassName,
  style,
  containerStyle,
  containerClassName,
  className
}) => {
  const [selectedTabKey, setSelectedTabKey] = useState(defaultActiveKey)
  useEffect(() => {
    if (defaultActiveKey) {
      setSelectedTabKey(defaultActiveKey)
    }
  }, [defaultActiveKey])
  const renderTabs = () => {
    if (mode === 'reverse') {
      return navs.map(
        nav =>
          nav.tab && (
            <div
              className={classnames(
                className,
                nav.key === selectedTabKey ? 'active-button' : 'transparent-font',
                'icon-button font-medium !px-3'
              )}
              onClick={e => {
                onTabClick(nav.key, e)
                setSelectedTabKey(nav.key)
              }}
              style={{
                userSelect: 'none',
                padding: '5px 10px',
                ...style
              }}
              key={nav.key}
            >
              {nav.tab}
            </div>
          )
      )
    }
    if (mode === 'underline') {
      return (
        <>
          {navs.map(
            nav =>
              nav.tab && (
                <div
                  className={classnames('cursor-pointer flex flex-col items-center transition-all', className)}
                  onClick={e => {
                    onTabClick(nav.key, e)
                    setSelectedTabKey(nav.key)
                  }}
                  style={{
                    userSelect: 'none',
                    padding: '2px 8px',
                    color: nav.key === selectedTabKey ? Colors.Font.Primary : Colors.Font.Transparent,
                    ...style
                  }}
                  key={nav.key}
                >
                  {nav.tab}
                  <div
                    style={{
                      width: 16,
                      marginTop: 6,
                      height: 2,
                      background: nav.key === selectedTabKey ? 'var(--font-primary)' : 'transparent'
                    }}
                  ></div>
                </div>
              )
          )}
        </>
      )
    }
    if (mode === 'switch') {
      const available = navs.filter(i => i.tab)
      const idx = available.findIndex(i => i.key === selectedTabKey)
      return (
        <>
          {idx >= 0 ? (
            <div
              className={'absolute transition-transform'}
              style={{
                width: `${100 / available.length}%`,
                height: '100%',
                top: 0,
                left: 0,
                transform: `translateX(${100 * idx}%)`
              }}
            >
              <div className={'bg-hover w-full h-full rounded'}></div>
            </div>
          ) : null}
          {navs.map(
            nav =>
              nav.tab && (
                <div
                  className={classnames(
                    'hover:opacity-100 z-10 flex justify-center rounded flex-1 cursor-pointer transition-all',
                    nav.key === selectedTabKey ? 'opacity-100' : 'opacity-50',
                    className,
                    className?.includes('font-size') ? undefined : 'font-size-13'
                  )}
                  onClick={e => {
                    onTabClick(nav.key, e)
                    setSelectedTabKey(nav.key)
                  }}
                  style={{
                    userSelect: 'none',
                    padding: '0.5rem 0.6rem',
                    ...style
                  }}
                  key={nav.key}
                >
                  {nav.tab}
                </div>
              )
          )}
        </>
      )
    }
    if (mode === 'select') {
      return (
        <>
          {navs.map(
            nav =>
              nav.tab && (
                <div
                  className={classnames(
                    'cursor-pointer hover:opacity-100 transition-opacity min-w-12 flex justify-center',
                    nav.key === selectedTabKey ? 'opacity-100' : 'opacity-60',
                    className,
                    className?.includes('font-size') ? undefined : 'font-size-13'
                  )}
                  onClick={e => {
                    onTabClick(nav.key, e)
                    setSelectedTabKey(nav.key)
                  }}
                  style={{
                    userSelect: 'none',
                    padding: '2px 6px',
                    ...style
                  }}
                  key={nav.key}
                >
                  {nav.tab}
                </div>
              )
          )}
        </>
      )
    }
    if (mode === 'options') {
      return (
        <Select
          align={'start'}
          className={className}
          value={selectedTabKey}
          onSelect={k => {
            onTabClick(k[0], new MouseEvent('click'))
            setSelectedTabKey(k[0])
          }}
          options={navs
            .filter(i => typeof i.tab === 'string')
            .map(i => ({
              value: i.key,
              children: i.tab as string
            }))}
        />
      )
    }
  }
  return (
    <Content flex alignItems='center' justifyContent='space-between' className={containerClassName} gap={16} style={containerStyle}>
      <Content
        flex
        alignItems='center'
        className={classnames(leftClassName, mode === 'switch' && 'border rounded-md')}
        style={{ flexShrink: 1, flexWrap: 'wrap', width: mode === 'switch' ? '100%' : undefined, ...leftStyle }}
        gap={6}
      >
        {leftExtra}
        {renderTabs()}
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
  container?: boolean
  unmount?: boolean
  renderOnly?: boolean
}
const TabPanesList: FC<TabPanesListProps> = memo(
  ({ activeKey, renderOnly, tabPanes, container = true, disableAnimation, mountAll, unmount }) => {
    const renderer = (children: ReactElement) =>
      container ? (
        <Content fullWidth fullHeight style={{ overflow: 'hidden' }}>
          {children}
        </Content>
      ) : (
        children
      )
    return renderer(
      <>
        {tabPanes.map(tabPane => (
          <TabPane
            mount={tabPane.mount ?? mountAll}
            onClick={tabPane.onClick}
            style={tabPane.style}
            key={tabPane.innerKey}
            unmount={unmount}
            active={activeKey === tabPane.innerKey}
            disableAnimation={disableAnimation}
            children={tabPane.children}
            renderOnly={renderOnly}
            className={tabPane.className}
          />
        ))}
      </>
    )
  }
)

type TabsProps = {
  mountAll?: boolean
  children: ReactElement<TabPaneProps> | (ReactElement<TabPaneProps> | null)[] | null
  extra?: ReactNode
  style?: CSSProperties
  container?: boolean
  onTabClick?: (key: string, e: MouseEvent) => void
  renderTabNav?: (defaultTabNav: TabNavListProps) => ReactNode
  disableInnerPanes?: boolean
  disableTabNav?: boolean
  disableAnimation?: boolean
  tabNavContainerClassname?: string
  tabNavStyle?: CSSProperties
  tabNavContainerStyle?: CSSProperties
  tabNavLeftStyle?: CSSProperties
  tabNavLeftExtra?: ReactNode
  tabNavClassname?: string
  tabNavLeftClassName?: string
  tabNavMode?: TabNavListProps['mode']
  activeKey?: string
  defaultActiveKey?: string
  renderOnly?: boolean
  unmount?: boolean
}
export const Tabs: FC<TabsProps> = memo(
  ({
    children,
    defaultActiveKey,
    onTabClick,
    renderOnly,
    tabNavClassname,
    tabNavLeftClassName,
    renderTabNav,
    extra,
    mountAll,
    tabNavContainerClassname,
    disableInnerPanes = false,
    activeKey: outActiveKey,
    tabNavMode,
    disableTabNav,
    disableAnimation,
    tabNavStyle,
    container = true,
    style,
    tabNavContainerStyle,
    tabNavLeftExtra,
    tabNavLeftStyle,
    unmount
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
    const [activeKey, setActiveKey] = useState(defaultActiveKey ?? outActiveKey ?? tabNavs[0]?.key)

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
          mode={tabNavMode}
          containerClassName={tabNavContainerClassname}
          containerStyle={tabNavContainerStyle}
          leftExtra={tabNavLeftExtra}
          onTabClick={onInternalTabClick}
          extra={extra}
          className={tabNavClassname}
          navs={tabNavs}
          defaultActiveKey={activeKey}
          leftClassName={tabNavLeftClassName}
          leftStyle={tabNavLeftStyle}
          style={tabNavStyle}
        />
      )
    const renderer = (children: ReactElement) =>
      container ? (
        <div
          style={{
            height: '100%',
            ...style
          }}
          className={'flex flex-col'}
        >
          {children}
        </div>
      ) : (
        children
      )
    return renderer(
      <>
        {!disableTabNav && tabNavListRenderer()}
        {disableInnerPanes ? (
          panes
        ) : (
          <TabPanesList
            renderOnly={renderOnly}
            container={container}
            mountAll={mountAll}
            unmount={unmount}
            disableAnimation={disableAnimation}
            activeKey={activeKey}
            tabPanes={tabPanes}
          />
        )}
      </>
    )
  }
)
interface TabPaneProps {
  onClick?: MouseEventHandler
  children?: ReactNode
  className?: string
  tab?: string | ReactElement | null
  innerKey?: string
  style?: CSSProperties
  active?: boolean
  disableAnimation?: boolean
  mount?: boolean
  unmount?: boolean
  renderOnly?: boolean
}
export const TabPane: FC<TabPaneProps> = memo(
  ({ children, renderOnly, onClick, className, style, active, disableAnimation, mount, unmount }) => {
    const mergedStyle = {
      width: '100%',
      height: '100%',
      ...style,
      transition: disableAnimation ? 'none' : style?.transition,
      position: active ? 'relative' : 'absolute',
      visibility: active ? undefined : 'hidden',
      opacity: active ? 1 : 0,
      pointerEvents: active ? undefined : 'none',
      zIndex: active ? 1 : -10,
      left: active ? undefined : 0,
      top: active ? undefined : 0
    }
    const [actived, setActived] = useState(mount ?? active ?? false)
    useLayoutEffect(() => {
      if (active) {
        setActived(true)
      }
    }, [active])
    if (!children) return null
    if (!actived) return null
    if (unmount && !active) return null
    if (!active && renderOnly) return null
    return (
      <div className={classnames('relative h-full', className)} style={mergedStyle} onClick={onClick}>
        {children}
      </div>
    )
  }
)

export { default as Tab } from './Tab'
