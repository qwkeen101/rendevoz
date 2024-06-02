import { MetaStore } from '@/api/stores'
import { Content, Icon, WithBorder } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import { ClassName } from 'rendevoz'
import { DateFormat } from '@/utils'
import { css } from '@emotion/css'
import { memo } from 'react'
import ContextMenu from '@/components/contextMenu'
import { ObjectActionMenu } from '@/core'
import InnerContentDisplayer from '@/core/components/group/components/gallery/items/InnerContentDisplayer'
import { Colors } from '@/consts'

const GalleryItem = memo(({ metaId }: { metaId: number }) => {
  const meta = MetaStore.useValue(metaId)
  if (!MetaStore.isVisibleMetaObject(meta)) return null
  return (
    <ContextMenu
      content={setV => (
        <WithBorder>
          <ObjectActionMenu onClose={() => setV(false)} metaObjectId={metaId} />
        </WithBorder>
      )}
    >
      <Content
        flex
        column
        style={{ width: 220, cursor: 'pointer' }}
        className={css({
          ':hover': {
            '.cover': {
              transform: 'scale(1.02, 1.02)'
            }
          }
        })}
        onClick={() => Rendevoz.Actions.Open.Meta.openMetaObject(metaId)}
      >
        <div
          className={'cover border bg-secondary'}
          style={{
            height: 200,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            borderRadius: 10,
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <InnerContentDisplayer
            containerStyle={{ width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}
            metaId={metaId}
          />
        </div>
        <Content flex column gap={5} auto style={{ paddingTop: 12 }}>
          <div className={'ellipsis-font-2 font-size-13 normal-font'}>{meta.name || meta.placeholderName}</div>
          <Content flex justifyContent={'space-between'} className={'transparent-font font-size-12'} gap={10}>
            <span style={{ flex: 1 }} className={'ellipsis-font-1'}>
              {Rendevoz.Utils.Meta.getTypeName(meta.type)}
            </span>
            <span>{DateFormat.formatDistanceToNowStrict(meta.createdAt)}</span>
          </Content>
        </Content>
      </Content>
    </ContextMenu>
  )
})

export default GalleryItem
