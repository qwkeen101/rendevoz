import { CollectionStore, MetaStore } from '@/stores'
import { Content, Icon, WithBorder } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import { DateFormat } from '@/utils'
import { css } from '@emotion/css'
import { memo } from 'react'
import { useIsIn } from '@/hooks'
import ContextMenu from '@/components/contextMenu'
import { ObjectActionPopover } from '@/core'

const GalleryItem = memo(({ metaId }: { metaId: number }) => {
  const collections = CollectionStore.useMetaCollections(metaId)
  const meta = MetaStore.useValue(metaId)
  const { isIn, ref } = useIsIn()
  const hasCollection = collections.length > 0
  if (!meta) return null
  return (
    <ContextMenu
      content={setV => (
        <WithBorder>
          <ObjectActionPopover onClose={() => setV(false)} metaObjectId={metaId} />
        </WithBorder>
      )}
    >
      <Content
        flex
        column
        style={{ width: 208, cursor: 'pointer' }}
        className={css({
          ':hover': {
            '.cover': {
              transform: 'scale(1.02, 1.02)'
            }
          }
        })}
        ref={ref}
        onClick={() => Rendevoz.Actions.Open.Meta.openMetaObject(metaId)}
      >
        <div
          className={'cover'}
          style={{
            height: 200,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            borderRadius: 10,
            justifyContent: 'center',
            color: Colors.Font.Tertiary,
            backgroundSize: 'cover',
            transition: 'all 0.2s ease',
            backgroundPosition: 'center',
            position: 'relative',
            border: '1px solid var(--border-background)',
            backgroundImage: meta?.coverImgSrc ? 'url(' + meta.coverImgSrc + ')' : Colors.Background.RadialGradient
          }}
        >
          {!meta?.coverImgSrc && <Icon size={54} name={Rendevoz.Utils.Object.getMetaObjectIcon(meta.type)} />}
        </div>
        <Content flex column gap={5} auto style={{ paddingTop: 12 }}>
          <div
            style={{ fontWeight: 'bold', letterSpacing: '-0.2px', fontSize: 14, lineHeight: '20px', height: 40 }}
            className={ClassName.ellipsisFont(2)}
          >
            {meta.name}
          </div>

          <Content flex justifyContent={'space-between'} style={{ fontSize: '12px' }} gap={10}>
            <span style={{ flex: 1 }} className={ClassName.ellipsisFont(1)}>
              {Rendevoz.Utils.Meta.getTypeName(meta.type)}
              {hasCollection && (
                <>
                  <span style={{ margin: '0px 4px' }}>•</span>
                  <span>{collections[0][collections[0].length - 1].name}</span>
                </>
              )}
            </span>
            <span>{DateFormat.formatDistanceToNowStrict(meta.createdAt)}</span>
          </Content>
        </Content>
      </Content>
    </ContextMenu>
  )
})

export default GalleryItem
