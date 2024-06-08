import { ISearchResult } from '@/api/textSearch/types'
import { MetaStore } from '@/api/stores'
import { Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { css } from '@emotion/css'
import { CSSProperties } from 'react'
import { ObjectActionMenu } from '@/core'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import globalInstance from '@/api/global/GlobalInstance'
import highlightAndTruncate from '@/api/textSearch/highlightAndTruncate'
import ContextMenu from '@/components/contextMenu'

export default ({
  hit,
  selected,
  onClick,
  style,
  className,
  size
}: {
  hit: ISearchResult[0]
  selected: boolean
  size?: number
  onClick?: VoidFunction
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
  let ellipsis = true
  if (!meta || meta.deleted) return null
  if (meta.type.includes('Label')) {
    if (meta.placeholderName) {
      content = highlightAndTruncate(meta.placeholderName, hit.terms, 9999)
      ellipsis = false
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
        title={meta.name || meta.placeholderName}
        className={'button'}
        onClick={e => {
          e.stopPropagation()
          onClick?.()
        }}
        flex
        style={{
          width: '100%',
          padding: '8px 6px 8px 0px',
          background: selected ? Colors.Background.ButtonHover : 'transparent',
          ...style
        }}
        alignItems={'stretch'}
      >
        <Content
          flex
          alignItems={'flex-start'}
          style={{
            marginLeft: 10,
            marginRight: 10,
            marginTop: meta.coverImgSrc ? 0 : 3
          }}
        >
          {meta.coverImgSrc ? (
            <img src={meta.coverImgSrc} width={24} height={24} style={{ objectFit: 'cover', borderRadius: 4 }} />
          ) : (
            <Icon
              size={16}
              name={Rendevoz.Utils.Object.getMetaObjectIcon(meta.type)}
              containerStyle={{
                color: Colors.Font.Description,
                height: 'fit-content'
              }}
            />
          )}
        </Content>
        <Content flex alignItems={'flex-start'} justifyContent={'space-between'} gap={8} style={{ flex: 1 }}>
          <Content style={{ alignSelf: 'center' }}>
            {showName && (
              <Content flex gap={4} alignItems={'center'}>
                <div
                  className={classnames('bold-font ellipsis-font-1', noName && 'super-transparent-font')}
                  dangerouslySetInnerHTML={{ __html: name }}
                ></div>
                {size ? <div className={'transparent-font font-size-12'}>({size})</div> : null}
              </Content>
            )}
            {(content || description) && (
              <div
                className={classnames('font-size-12 transparent-font', ellipsis && 'ellipsis-font-3')}
                dangerouslySetInnerHTML={{ __html: content || description }}
              ></div>
            )}
          </Content>
        </Content>
      </Content>
    </ContextMenu>
  )
}
