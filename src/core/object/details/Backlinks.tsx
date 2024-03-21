import { memo, useEffect, useState } from 'react'
import calculateAppearIn from '@/core/search/calculateAppearIn'
import { Content, Icon } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import { ClassName } from 'rendevoz'
import { useRenderObject } from '@/core'
import { GlobalInstance } from '@/hooks'
import getInsideMetas from '@/core/components/editor/utils/getInsideMetas'
import { waitFor } from '@/utils'
export default memo(({ metaId, visible }: { metaId: number; visible?: boolean }) => {
  const [backlinks, setBacklinks] = useState<Awaited<ReturnType<typeof calculateAppearIn>>>()
  useEffect(() => {
    if (visible) {
      calculateAppearIn([metaId]).then(appears => {
        setBacklinks(appears)
      })
    }
  }, [metaId, visible])

  const { t } = useTranslation()
  if (backlinks && (backlinks.group.length || backlinks.whiteboard.length || backlinks.note.length)) {
    return (
      <Content>
        <Content
          flex
          alignItems={'center'}
          gap={12}
          style={{
            fontWeight: 500,
            fontSize: 14,
            margin: '16px 0 12px'
          }}
        >
          <Icon
            name={'park-arrow-up'}
            size={16}
            containerStyle={{
              background: 'linear-gradient(#7bc3ff 0%, #286efa 140%)',
              color: 'white',
              borderRadius: 6,
              padding: 4
            }}
          />
          {t('general.Appear in')}
        </Content>
        <Content className={'border-box-shadow'} column gap={3} flex style={{ borderRadius: 8, padding: 8 }}>
          {[...backlinks.group, ...backlinks.whiteboard, ...backlinks.note].map(i => (
            <Item parentMetaId={metaId} metaId={i.parent.id} key={i.parent.id} />
          ))}
        </Content>
      </Content>
    )
  }
  return null
})

const Item = ({ metaId, parentMetaId }: { metaId: number; parentMetaId: number }) => {
  const m = MetaStore.useValue(metaId)
  const { renderInline } = useRenderObject({ metaObjectId: metaId })
  if (m && !m.deleted) {
    return (
      <Content className={'font-size-13'}>
        {renderInline({
          ellipsisLine: 1,
          containerStyle: {
            width: '100%',
            alignItems: 'center'
          },
          showMoreOptions: true,
          onClick: () => {
            GlobalInstance.metaOps?.closeDetails()
            if (m.type === 'note') {
              GlobalInstance.layoutOps?.openObject<'editor'>(m.id).then(async ins => {
                const v = ins?.getSlateEditor?.().children
                if (v) {
                  const metas = getInsideMetas(v)
                  if (metas[parentMetaId]) {
                    const blocks = metas[parentMetaId]
                    ins?.scrollToBlock?.({ blockId: blocks[0], highlight: true })
                  }
                }
              })
            }
            if (m.type === 'group') {
              GlobalInstance.layoutOps?.openObject<'group'>(m.id).then(ins => {
                waitFor(
                  () => !!ins?.bodyOps?.scrollToMeta,
                  () => {
                    ins?.bodyOps?.scrollToMeta?.(parentMetaId, true)
                  }
                )
              })
            }
            if (m.type === 'whiteboard') {
              GlobalInstance.layoutOps?.openObject<'whiteboard'>(m.id).then(ins => {
                ins?.moveToMetaNode?.(parentMetaId, {
                  select: true
                })
              })
            }
          }
        })}
      </Content>
    )
  }
  return null
}
