import { useWhiteboardNodes } from '@/core/components/whiteboard/StateHooks'
import { useEffect, useRef, useState } from 'react'
import { IWhiteboardEvents, IWhiteboardInstance, IWhiteboardOutline } from '~/typings'
import { useDebounceEffect } from '@/hooks'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import { Content, Icon, Menu, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import ContextMenu from '@/components/contextMenu'
import getNodeMenu from '@/core/components/whiteboard/toolbars/contextMenus/getNodeMenu'

export default () => {
  const nodes = useWhiteboardNodes()
  const instance = useWhiteboardInstance()
  const [outline, setOutline] = useState<IWhiteboardOutline[]>()
  const [s, setS] = useState(0)
  const [selected, setSelected] = useState<number>()
  const { t } = useTranslation()
  useEffect(() => {
    const interval = setInterval(() => {
      setS(g => g + 1)
    }, 500)
    return () => {
      clearInterval(interval)
    }
  }, [])
  useDebounceEffect(
    () => {
      const outline = instance.contentOps?.transformToOutline()
      if (outline) {
        setOutline(outline)
        const s = new Set((instance.selectOps?.getSelectedNodes?.() || []).map(i => i.id))
        setSelected(selected && s.has(selected) ? selected : s.size === 1 ? s.values().next().value : undefined)
      }
    },
    [nodes, s],
    { wait: 300, leading: true }
  )

  return (
    <Content flex column style={{ paddingLeft: 4, paddingRight: 10, overflowY: 'auto', height: '100%', paddingBottom: 100 }}>
      {outline?.length ? (
        <>
          <div
            style={{
              margin: '2px 8px 6px'
            }}
            className={'menu-sub-title'}
          >
            {t('whiteboard.Contents')}
          </div>
          {outline?.map(i => (
            <GroupOutline
              selected={selected}
              onClick={id => {
                setSelected(id)
              }}
              instance={instance}
              outline={i}
              key={i.nodeId}
            />
          ))}
        </>
      ) : (
        <Content fullWidth fullHeight flex centered className={'transparent-font normal-font'}>
          No content
        </Content>
      )}
    </Content>
  )
}

const GroupOutline = ({
  outline,
  instance,
  onClick,
  selected
}: {
  outline: IWhiteboardOutline
  instance: IWhiteboardInstance
  onClick?: (id: number) => void
  selected: number | undefined
}) => {
  const [toggled, setToggled] = useState(true)
  let isSelected = false
  const { t } = useTranslation()
  const closeRef = useRef<VoidFunction>()
  useEffect(() => {
    const h = (e: IWhiteboardEvents) => {
      if (e.type === 'closeToolbar') {
        closeRef.current?.()
      }
    }
    instance.addEventListener?.(h)
    return () => {
      instance.removeEventListener?.(h)
    }
  })
  if (selected) {
    if (selected === outline.nodeId) {
      isSelected = true
    }
    if (outline.children?.length && toggled === true) {
      const loopChildren = (c: IWhiteboardOutline[]) => {
        c.forEach(i => {
          if (i.nodeId === selected) {
            isSelected = true
          }
          if (i.children?.length) {
            loopChildren(i.children)
          }
        })
      }
      loopChildren(outline.children)
    }
  }
  return (
    <>
      <ContextMenu
        onContextMenu={() => {
          instance.selectOps?.selectNode(outline.nodeId)
          onClick?.(outline.nodeId)
        }}
        content={setV => {
          closeRef.current = () => setV(false)
          return (
            <WithBorder padding={'0.4rem 0'} width={250} borderRadius={4}>
              <Menu.NavigationMenu layout={getNodeMenu(instance, t, 'contextMenu', outline.nodeId) || []} />
            </WithBorder>
          )
        }}
      >
        <Content
          flex
          gap={10}
          alignItems={'center'}
          className={classNames('button', isSelected && 'active-button')}
          key={outline.nodeId}
          onClick={e => {
            e.preventDefault()
            onClick?.(outline.nodeId)
            instance.containerOps?.fitToNode(outline.nodeId)
            instance.selectOps?.deselectAll(outline.nodeId)
            instance.selectOps?.selectNode(outline.nodeId)
          }}
        >
          {outline.children?.length ? (
            <Icon
              theme={'filled'}
              name={'park-right-one'}
              style={{
                transform: !toggled ? 'rotate(90deg)' : undefined,
                transition: 'transform 0.2s ease'
              }}
              onClick={e => {
                setToggled(!toggled)
                e.stopPropagation()
              }}
            />
          ) : outline.icon ? (
            <Icon name={outline.icon} />
          ) : null}
          <div className={'ellipsis-font-1'}>{outline.name}</div>
        </Content>
      </ContextMenu>
      {!toggled && (
        <Content flex column style={{ marginLeft: 15, borderLeft: `1px solid var(--border-background)`, paddingLeft: 10 }}>
          {outline.children?.map(i => (
            <GroupOutline onClick={onClick} selected={selected} outline={i} key={i.nodeId} instance={instance} />
          ))}
        </Content>
      )}
    </>
  )
}
