import { atom, useAtom } from 'jotai'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { css } from '@emotion/css'
import { Content, Icon, VirtualList, Virtualizer } from '@/components'
import { useTranslation } from 'react-i18next'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import { useAtomValue } from 'jotai/react'
import classnames from 'classnames'
import BetterInput from '@/components/base/BetterInput'

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
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (isHotkey('mod+f', e) && instance.isFocused) {
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('keydown', keydown)
    }
  }, [])
  useEffect(() => {
    if (result.results) {
      const keydownHandler = (e: KeyboardEvent) => {
        if (inputRef.current === document.activeElement) {
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
    <div className={'w-full h-full max-h-full flex flex-col gap-2'}>
      <div className={'p-3 pb-0 w-full'}>
        <div className={'flex items-center gap-2 rounded-md bg-input px-2.5 py-1 border-box-shadow focus-within-input'}>
          <Icon name={Icons.Search} size={16} />
          <BetterInput
            ref={inputRef}
            className={'flex-1'}
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
            autoFocus
            placeholder={t('general.search')}
          ></BetterInput>
        </div>
        {searchStr && (
          <div className={'flex justify-between mt-2 h-6 items-center select-none'}>
            {(result.results?.length ?? 0) > 1 ? (
              <div className={'flex gap-1'}>
                <Icon
                  name={'park-left'}
                  className={'square-button-small'}
                  onClick={() => {
                    setResult(s => ({ ...s, selectedNum: s.selectedNum === 0 ? 0 : (s.selectedNum ?? 1) - 1 }))
                  }}
                />
                <Icon
                  name={'park-right'}
                  className={'square-button-small'}
                  onClick={() => {
                    setResult(s => ({ ...s, selectedNum: s.selectedNum === s.total - 1 ? 0 : (s.selectedNum ?? -1) + 1 }))
                  }}
                />
              </div>
            ) : null}
          </div>
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
          className={'w-full h-full pt-0 p-3'}
          estimateSize={100}
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
    <div onClick={onClick} className={classnames(selected && 'active-button', 'p-3 flex gap-3 rounded font-size-13 min-h-24')}>
      <div className={'shrink-0'}>
        <img className={'w-11 mt-1'} src={imgURL} />
      </div>
      <div className={'grow'}>
        <Content className={'font-size-12'} flex justifyContent={'space-between'}>
          <div className={'bold-font'}>{t('general.Page', { num: pageIndex + 1 })}</div>
          <div className={selected ? undefined : 'transparent-font'}>{t('general.Matched', { num })}</div>
        </Content>
        <div className={'line-clamp-3'} dangerouslySetInnerHTML={{ __html: str }}></div>
      </div>
    </div>
  )
}
export default memo(PDFSearch)
