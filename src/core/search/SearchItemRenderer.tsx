import { ISearchResult } from '@/api/textSearch/types'
import { MetaStore } from '@/api/stores'
import { Content, Icon, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { CSSProperties } from 'react'
import { ObjectActionMenu } from '@/core'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import highlightAndTruncate from '@/api/textSearch/highlightAndTruncate'
import ContextMenu from '@/components/contextMenu'

export default ({
  hit,
  selected,
  onClick,
  style,
  size
}: {
  hit: ISearchResult[0]
  selected: boolean
  size?: number
  onClick?: React.MouseEventHandler
  style?: CSSProperties
  className?: string
}) => {
  const { t } = useTranslation()
  let name = hit.matched?.['name'] || hit.name || t('general.Unnamed')
  const noName = !hit.matched?.['name'] && !hit.name
  const description = hit.matched?.['description'] || hit.description
  let content = hit.matched?.['content']
  const meta = MetaStore.useValue(hit.metaId)
  let showName = true
  if (!meta || meta.deleted) return null
  if (meta.type.includes('Label')) {
    if (meta.placeholderName) {
      content = hit.terms ? highlightAndTruncate(meta.placeholderName, hit.terms, 9999) : meta.placeholderName
    }
    if (!meta.name) {
      name = ''
      showName = false
      if (!meta.placeholderName) {
        name = t('general.Unnamed')
        showName = true
      }
    }
  }
  return (
    <ContextMenu
      content={setV => (
        <WithBorder onClick={e => e.stopPropagation()}>
          <ObjectActionMenu
            onClose={() => {
              setV(false)
            }}
            metaObjectId={meta.id}
          />
        </WithBorder>
      )}
    >
      <Content
        title={meta.name}
        className={'button items-stretch flex flex-1'}
        onClick={e => {
          e.stopPropagation()
          onClick?.(e)
        }}
        style={{
          flex: '1',
          padding: '0.375rem 0.375rem 0.375rem 0px',
          background: selected ? Colors.Background.ButtonHover : 'transparent',
          ...style
        }}
      >
        <div
          className={'w-8 flex items-center h-8 justify-center shrink-0'}
          style={{
            marginLeft: 10,
            marginRight: 10,
            marginTop: (content || description) && meta.coverImgSrc ? 4 : 0
          }}
        >
          {meta.coverImgSrc ? (
            <img src={meta.coverImgSrc} className={'w-full h-full object-cover rounded'} />
          ) : (
            <Icon
              size={20}
              name={Global.utils.getIcon(meta.type)}
              containerStyle={{
                color: Colors.Font.Description,
                height: 'fit-content'
              }}
            />
          )}
        </div>
        <Content flex alignItems={'flex-start'} justifyContent={'space-between'} gap={8} style={{ flex: 1 }}>
          <Content style={{ alignSelf: 'center' }}>
            {showName && (
              <div className={'flex items-center gap-2'}>
                <div
                  className={classnames('bold-font ellipsis-font-1', noName && 'super-transparent-font')}
                  dangerouslySetInnerHTML={{ __html: name }}
                ></div>
                {size ? <div className={'px-1 shrink-0 text-sm rounded bg-border'}>{size}</div> : null}
              </div>
            )}
            {(content || description) && (
              <div
                className={'font-size-12 transparent-font line-clamp-2'}
                dangerouslySetInnerHTML={{ __html: content || description }}
              ></div>
            )}
          </Content>
        </Content>
      </Content>
    </ContextMenu>
  )
}
