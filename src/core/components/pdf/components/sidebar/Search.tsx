import { atom, useAtom } from 'jotai'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { css } from '@emotion/css'
import { Content, Icon, VirtualList } from '@/components'
import Colors from '@/consts/colors'
import { useTranslation } from 'react-i18next'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { ClassName } from 'rendevoz'
import { Virtualizer } from '@tanstack/react-virtual'
import { useAtomValue } from 'jotai/react'

const searchAtom = atom<{
  total: number
  results?: {
    pageIndex: number
    str: string
    num: number
  }[]
  selectedPageIndex?: number
  selectedNum?: number
  numIndex?: number
}>({ total: 0 })
const searchStrAtom = atom<string>('')
const PDFSearch = () => {
  const instance = usePDFInstance()
  const [searchStr, setSearchStr] = useAtom(searchStrAtom)
  const [result, setResult] = useAtom(searchAtom)
  const { t } = useTranslation()
  const clickedRef = useRef(false)
  useEffect(() => {
    if (result.results) {
      const keydownHandler = (e: KeyboardEvent) => {
        if (instance.isFocused) {
          setTimeout(() => {
            if (!e.defaultPrevented) {
              if (isHotkey(KEY.Enter, e)) {
                setResult(s => ({ ...s, selectedNum: s.selectedNum === s.total - 1 ? 0 : (s.selectedNum ?? -1) + 1 }))
              }
            }
          })
        }
      }
      document.addEventListener('keydown', keydownHandler)
      return () => {
        document.removeEventListener('keydown', keydownHandler)
      }
    }
  }, [result.results])
  useLayoutEffect(() => {
    let targetIndex: number | undefined = undefined
    let numIndex: number | undefined = undefined
    let finished = false
    if (result.results) {
      result.results.reduce((prev, curr) => {
        if (!finished && result.selectedNum !== undefined && result.selectedNum >= prev && result.selectedNum < prev + curr.num) {
          targetIndex = curr.pageIndex
          numIndex = result.selectedNum - prev
          finished = true
        }
        return prev + curr.num
      }, 0)
      if (targetIndex !== undefined && numIndex !== undefined) {
        instance.highlightText?.(searchStr, targetIndex, numIndex)
        setResult(s => ({ ...s, selectedPageIndex: targetIndex, numIndex: numIndex }))
      }
    }
  }, [result.selectedNum])
  useLayoutEffect(() => {
    if (result.selectedPageIndex !== undefined && clickedRef.current !== true) {
      const idx = result.results?.findIndex(i => i.pageIndex === result.selectedPageIndex)
      if (idx !== undefined) {
        virtualizer.current?.scrollToIndex(idx)
      }
    }
  }, [result.selectedPageIndex])
  const virtualizer = useRef<Virtualizer<any, any>>()
  const thumbnailURLMap = useAtomValue(instance.values.thumbnailAtom)
  return (
    <div
      style={{
        width: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        height: '100%'
      }}
    >
      <div style={{ padding: '10px 10px 0px', width: '100%' }}>
        <input
          onCompositionStart={e => {
            e.currentTarget.setAttribute('composing', 'true')
          }}
          onCompositionEnd={e => {
            e.currentTarget.removeAttribute('composing')
            const value = e.currentTarget.value
            setSearchStr(value)
            if (value.length) {
              const r = instance?.search?.(value)
              if (r) {
                r.sort((b, a) => b.pageIndex - a.pageIndex)
                let num = 0
                r.forEach(i => {
                  num += i.num
                })
                setResult({
                  total: num,
                  results: r.map(i => ({
                    str: i.searchText,
                    pageIndex: i.pageIndex,
                    num: i.num
                  }))
                })
              }
            } else {
              setResult({
                total: 0,
                results: []
              })
            }
          }}
          className={'focus-input border-box-shadow font-size-14'}
          onChange={e => {
            if (e.target.hasAttribute('composing')) return
            const value = e.target.value
            setSearchStr(value)
            if (value.length) {
              const r = instance?.search?.(value)
              if (r) {
                r.sort((b, a) => b.pageIndex - a.pageIndex)
                let num = 0
                r.forEach(i => {
                  num += i.num
                })
                setResult({
                  total: num,
                  results: r.map(i => ({
                    str: i.searchText,
                    pageIndex: i.pageIndex,
                    num: i.num
                  }))
                })
              }
            } else {
              setResult({
                total: 0,
                results: []
              })
            }
          }}
          placeholder={t('general.search')}
          style={{ padding: '4px 8px', borderRadius: 4, width: '100%' }}
        ></input>
        {searchStr && (
          <Content flex justifyContent={'space-between'} style={{ userSelect: 'none', marginTop: 6 }} alignItems={'center'}>
            <div className={'transparent-font font-size-12'}>{t('general.find results', { num: result.total })}</div>
            {(result.results?.length ?? 0) > 1 ? (
              <Content flex gap={4}>
                <Icon
                  name={'park-left'}
                  className={ClassName.flatButton(4, '3px')}
                  onClick={() => {
                    setResult(s => ({ ...s, selectedNum: s.selectedNum === 0 ? 0 : (s.selectedNum ?? 1) - 1 }))
                  }}
                />
                <Icon
                  name={'park-right'}
                  className={ClassName.flatButton(4, '3px')}
                  onClick={() => {
                    setResult(s => ({ ...s, selectedNum: s.selectedNum === s.total - 1 ? 0 : (s.selectedNum ?? -1) + 1 }))
                  }}
                />
              </Content>
            ) : null}
          </Content>
        )}
      </div>
      <div
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100%',
          width: '100%'
        }}
        className={css({
          em: {
            fontStyle: 'normal',
            fontWeight: 600
          }
        })}
      >
        <VirtualList
          style={{ width: '100%', height: '100%', padding: '0px 10px 10px' }}
          estimateSize={100}
          childrenContainerClassname={'font-size-14'}
          items={result.results || []}
          paddingEnd={200}
          ref={virtualizer}
          renderItem={i => (
            <ResultRenderer
              key={i.pageIndex}
              imgURL={thumbnailURLMap.get(i.pageIndex)}
              onClick={() => {
                clickedRef.current = true
                setTimeout(() => (clickedRef.current = false))
                const prevNum = result.results?.filter(o => o.pageIndex < i.pageIndex).reduce((prev, curr) => prev + curr.num, 0)
                setResult(s => ({
                  ...s,
                  selectedPageIndex: i.pageIndex,
                  selectedNum: prevNum,
                  numIndex: 0
                }))
                instance.highlightText?.(searchStr, i.pageIndex, 0)
              }}
              pageIndex={i.pageIndex}
              str={i.str}
              num={i.num}
              selected={result.selectedPageIndex === i.pageIndex}
            />
          )}
        ></VirtualList>
      </div>
    </div>
  )
}

const ResultRenderer = ({
  pageIndex,
  num,
  str,
  onClick,
  selected,
  imgURL
}: {
  pageIndex: number
  num: number
  str: string
  onClick?: VoidFunction
  selected?: boolean
  imgURL?: string
}) => {
  const instance = usePDFInstance()
  const { t } = useTranslation()
  useEffect(() => {
    instance.getThumbnail?.(pageIndex)
  }, [])
  return (
    <Content
      onClick={onClick}
      flex
      style={{
        padding: '8px 10px',
        borderRadius: 4,
        fontSize: 13,
        minHeight: 80
      }}
      className={selected ? 'active-button' : undefined}
      gap={10}
    >
      <div>
        <img style={{ marginTop: 4 }} src={imgURL} width={36} />
      </div>
      <div style={{ flexGrow: 1 }}>
        <Content className={'font-size-12'} flex justifyContent={'space-between'}>
          <div className={'bold-font'}>{t('general.Page', { num: pageIndex + 1 })}</div>
          <div className={selected ? undefined : 'transparent-font'}>{t('general.Matched', { num })}</div>
        </Content>
        <div className={'ellipsis-font-3'} dangerouslySetInnerHTML={{ __html: str }}></div>
      </div>
    </Content>
  )
}
export default memo(PDFSearch)
