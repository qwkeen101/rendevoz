import { MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { useMemo } from 'react'
import { MetaObject } from '~/typings'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { useIsIn } from '@/hooks'

export default ({ metaId }: { metaId: number }) => {
  const whiteboardMeta = MetaStore.useValue(metaId)
  const obj = ObjectStore('whiteboard').useValue(whiteboardMeta?.objectId)
  const contains = useMemo(() => {
    if (obj?.nodes) {
      const metaMap = MetaStore.getMetaObjectsMap()
      const cards = Array.from(obj.nodes.values()).filter(i => i.type === 'metaObject')
      const objs = cards
        .map(i => ({ ...metaMap.get(i.metaObjectId), whiteboardCardId: i.id }))
        .filter(i => i)
        .sort((a, b) => (b.name || b.placeholderName || '').length - (a.name || a.placeholderName || '').length) as (MetaObject & {
        whiteboardCardId: number
      })[]
      const noRepeatObjs = Array.from(new Map(objs.map(i => [i.id, i])).values())
      return {
        objs: noRepeatObjs,
        num: noRepeatObjs.length,
        whiteboards: noRepeatObjs.filter(i => i.type === 'whiteboard').length
      }
    }
  }, [obj?.nodes])
  const { ref, isIn } = useIsIn()
  return (
    <Content
      ref={ref}
      style={{
        padding: 24,
        width: 650,
        minWidth: '100%',
        maxWidth: '100%',
        minHeight: '100%',
        maxHeight: '100%'
      }}
    >
      <Content flex alignItems={'center'} className={ClassName.title('26px')} gap={16}>
        <Icon name={Rendevoz.Utils.Object.getMetaObjectIcon('whiteboard')} />
        <div className={ClassName.ellipsisFont(1)}>{whiteboardMeta?.name}</div>
        <Icon
          onClick={() => {
            whiteboardMeta && Rendevoz.Actions.Open.Meta.openMetaObject(whiteboardMeta.id)
          }}
          name={'park-share'}
          size={18}
          className={ClassName.flatButton(4, '6px')}
          containerStyle={{ opacity: isIn ? 1 : 0, transition: 'opacity 0.26s ease' }}
        />
      </Content>
      {contains && (
        <Content
          flex
          gap={6}
          style={{
            marginTop: 8,
            fontSize: 16,
            fontWeight: 500
          }}
        >
          <div>{contains.num} Cards,</div>
          <div>{contains.whiteboards} Whiteboards</div>
        </Content>
      )}
      {contains?.objs && (
        <Content
          flex
          gap={8}
          style={{
            flexWrap: 'wrap',
            marginTop: 12
          }}
        >
          {contains.objs.map(i => (
            <div
              key={i.id}
              className={ClassName.ellipsisFont(1)}
              style={{
                padding: '4px 12px',
                border: '1px solid var(--border-background)',
                borderRadius: 8,
                background: Colors.Background.Global,
                cursor: 'pointer'
              }}
              onClick={() => {
                obj &&
                  Rendevoz.Actions.Open.Whiteboard.openWhiteboard(obj.id).then(ins => {
                    setTimeout(() => {
                      ins.containerOps?.fitToNode(i.whiteboardCardId)
                      ins.selectOps?.selectNode(i.whiteboardCardId)
                    }, 100)
                  })
              }}
            >
              {i.name || i.placeholderName}
            </div>
          ))}
        </Content>
      )}
    </Content>
  )
}
