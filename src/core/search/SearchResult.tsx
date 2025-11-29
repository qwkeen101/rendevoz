import { ISearchResult } from '@/api/textSearch/types'
import { Content, VirtualList, Virtualizer } from '@/components'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
import SearchItemRenderer from '@/core/search/SearchItemRenderer'

const SearchResult = ({ result, onClose, enableOpen }: { result: ISearchResult; onClose: VoidFunction; enableOpen: boolean }) => {
  const handleOpenResult = (metaId: number) => {
    if (!enableOpen) return
    Global.layoutOps?.openObject(metaId)
    onClose()
  }
  const { t } = useTranslation()

  const virtualizerRef = useRef<Virtualizer<any, any>>()
  useEffect(() => {
    virtualizerRef.current?.setFocus(0)
  }, [result])
  return (
    <Content flex column fullHeight>
      {result.length > 0 && (
        <>
          <VirtualList
            ref={virtualizerRef}
            withKeyboardNavigation={enableOpen}
            onSelect={item => {
              handleOpenResult(item.metaId)
            }}
            paddingEnd={100}
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
            renderItem={(item, idx, selected) => (
              <SearchItemRenderer
                onClick={() => {
                  handleOpenResult(item.metaId)
                }}
                hit={item}
                selected={selected}
              />
            )}
          ></VirtualList>
          <Content
            flex
            style={{
              padding: '6px 14px',
              lineHeight: 1
            }}
            className={'border-top bg-secondary transparent-font font-size-12'}
          >
            {t('general.Keyboard navigation and switch tabs')}
          </Content>
        </>
      )}
    </Content>
  )
}

export default SearchResult
