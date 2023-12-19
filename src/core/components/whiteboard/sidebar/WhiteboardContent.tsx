import { useWhiteboardNodes } from '@/core/components/whiteboard/StateHooks'
import { useEffect, useState } from 'react'
import { IWhiteboardInstance, IWhiteboardOutline } from '~/typings'
import { useDebounceEffect } from '@/hooks'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'

export default () => {
  const nodes = useWhiteboardNodes()
  const instance = useWhiteboardInstance()
  const [outline, setOutline] = useState<IWhiteboardOutline[]>()
  const [s, setS] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setS(g => g + 1)
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])
  useDebounceEffect(
    () => {
      const outline = instance.contentOps?.transformToOutline()
      if (outline) {
        setOutline(outline)
      }
    },
    [nodes, s],
    { wait: 300 }
  )

  return (
    <Content flex column style={{ paddingLeft: 4, lineHeight: 1.35, overflowY: 'auto', height: '100%', paddingBottom: 200 }}>
      {outline?.map(i => <GroupOutline instance={instance} outline={i} key={i.nodeId} />)}
    </Content>
  )
}

const GroupOutline = ({ outline, instance }: { outline: IWhiteboardOutline; instance: IWhiteboardInstance }) => {
  const [toggled, setToggled] = useState(true)
  return (
    <>
      <Content
        flex
        gap={6}
        data-id={outline.nodeId}
        alignItems={'center'}
        className={ClassName.flatButton()}
        key={outline.nodeId}
        onClick={e => {
          e.preventDefault()
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
        ) : null}
        <div
          className={ClassName.ellipsisFont(2)}
          style={{
            fontWeight: 500,
            fontSize: 14
          }}
        >
          {outline.name}
        </div>
      </Content>
      {!toggled && (
        <Content flex column style={{ marginLeft: 15, borderLeft: `1px solid var(--border-background)`, paddingLeft: 4 }}>
          {outline.children?.map(i => <GroupOutline outline={i} key={i.nodeId} instance={instance} />)}
        </Content>
      )}
    </>
  )
}
