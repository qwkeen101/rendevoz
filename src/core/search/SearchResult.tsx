import { ISearchResult } from '@/textSearch/types'
import { Content, Icon, VirtualList } from '@/components'
import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import { CollectionStore, MetaStore } from '@/stores'
import { Colors } from '@/consts'
import { css } from '@emotion/css'
import KeyvalueStore from '@/stores/keyvalue.store'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
import { Virtualizer } from '@tanstack/react-virtual'

const SearchResult = ({ result, onClose, enableOpen }: { result: ISearchResult; onClose: VoidFunction; enableOpen: boolean }) => {
  const map = MetaStore.useMetaObjectsMap()
  const searchHistory = KeyvalueStore.useValue('searchHistory') || []
  const handleOpenResult = (metaId: number) => {
    if (!enableOpen) return
    Rendevoz.Actions.Open.Meta.openMetaObject(metaId)
    const metaName = MetaStore.getMetaObjectsMap().get(metaId)?.name
    if (metaName) {
      KeyvalueStore.updateOne('searchHistory', [metaName, ...searchHistory.filter(i => i !== metaName).slice(0, 7)])
    }
    onClose()
  }
  const { t } = useTranslation()
  const renderItem = (hit: ISearchResult[0], selected: boolean) => {
    const name = hit.matched['name'] || hit.name
    const description = hit.matched['description'] || hit.description
    const content = hit.matched['content']
    const meta = map.get(hit.metaId)
    const collections = CollectionStore.buildMetaCollections(hit.metaId)

    if (!meta) return null
    return (
      <Content
        className={ClassName.flatButton(4, '8px 4px 9px 0px')}
        onClick={() => {
          handleOpenResult(hit.metaId)
        }}
        flex
        style={{ width: '100%', background: selected ? Colors.Background.ButtonHover : 'transparent' }}
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
        <Content>
          <div className={css([ClassName.title('0.95rem'), ClassName.ellipsisFont(1)])} dangerouslySetInnerHTML={{ __html: name }}></div>
          {(content || description) && (
            <div className={ClassName.description('0.85rem')} dangerouslySetInnerHTML={{ __html: content || description }}></div>
          )}
          {collections.length > 0 && (
            <div className={ClassName.description('0.8rem')}>{collections[0].map(i => i.name || '').join(' / ')}</div>
          )}
        </Content>
      </Content>
    )
  }
  const virtualizerRef = useRef<Virtualizer<any, any>>()
  useEffect(() => {
    virtualizerRef.current?.setFocus(0)
  }, [result])
  return (
    <Content flex column style={{ flex: 1, height: 0 }}>
      {result.length ? (
        <>
          <VirtualList
            ref={virtualizerRef}
            withKeyboardNavigation={true}
            onEnter={item => {
              handleOpenResult(item.metaId)
            }}
            style={{ width: '100%', height: '100%', marginTop: 6, marginBottom: 6, padding: '0px 6px' }}
            childrenContainerClassname={css({
              '>': {
                ':not(:last-child)': {
                  boxShadow: 'rgba(255, 255, 255, 0.055) 0px 1px 0px'
                },
                ':hover': {
                  boxShadow: 'none'
                },
                '[data-selected="true"]': {
                  boxShadow: 'none'
                },
                ':has(+ div:hover)': {
                  boxShadow: 'none'
                },
                ':has(+ div[data-selected="true"])': {
                  boxShadow: 'none'
                }
              }
            })}
            items={result}
            estimateSize={40}
            renderItem={(item, idx, selected) => renderItem(item, selected)}
          ></VirtualList>
          <Content
            flex
            style={{
              borderTop: `1px solid ${Colors.Background.Border}`,
              padding: '6px 14px',
              lineHeight: 1,
              fontSize: '12px',
              color: Colors.Font.Secondary
            }}
          >
            ↑↓ 键选择, ↵ 键打开
          </Content>
        </>
      ) : (
        <Content fullWidth style={{ padding: 16, color: Colors.Font.Transparent, fontWeight: 500 }} flex gap={12}>
          <Icon name={'park-emotion-unhappy'} />
          <div>{t('general.Search no result')}</div>
        </Content>
      )}
    </Content>
  )
}

export default SearchResult
