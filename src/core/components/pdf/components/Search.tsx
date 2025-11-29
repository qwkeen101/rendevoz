import { atom, useAtom } from 'jotai'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import classnames from 'classnames'
import BetterInput from '@/components/base/BetterInput'
import { assignProperties, getCursorElement } from '@/utils'

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
const searchStrAtom = atom<string>('flow')
const PDFSearch = () => {
  const instance = usePDFInstance()
  const [visible, setVisible] = useState(false)
  const [searchStr, setSearchStr] = useAtom(searchStrAtom)
  const [result, setResult] = useAtom(searchAtom)
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  assignProperties(instance, {
    actionOps: {
      ...instance.actionOps,
      toggleSearch: () => setVisible(!visible)
    }
  })
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setResult(s => ({ ...s, selectedNum: s.selectedNum === 0 ? 0 : (s.selectedNum ?? 1) - 1 }))
    } else {
      setResult(s => ({ ...s, selectedNum: s.selectedNum === s.total - 1 ? 0 : (s.selectedNum ?? -1) + 1 }))
    }
  }
  useEffect(() => {
    if (visible === false) {
      setSearchStr('')
    } else {
      inputRef.current?.focus()
    }
    const keydown = (e: KeyboardEvent) => {
      if (isHotkey('mod+f', e)) {
        const element = getCursorElement()
        if (element) {
          const container = instance.getContainerElement?.()
          if (container && container.contains(element)) {
            setVisible(true)
            inputRef.current?.focus()
          }
        }
      }
      if (isHotkey(KEY.Escape, e)) {
        setVisible(false)
      }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('keydown', keydown)
      Object.values(instance.values.INDEX_TO_PAGE_LAYER).forEach(i => {
        i.clearTextSelect?.()
      })
    }
  }, [visible])
  useEffect(() => {
    if (result.results) {
      const keydownHandler = (e: KeyboardEvent) => {
        if (inputRef.current === document.activeElement) {
          setTimeout(() => {
            if (!e.defaultPrevented) {
              if (isHotkey(KEY.Enter, e)) {
                handleNavigate('next')
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

  const highlightText = (num?: number) => {
    let targetIndex: number | undefined = undefined
    let numIndex: number | undefined = undefined
    let finished = false
    if (result.results && num !== undefined) {
      result.results.reduce((prev, curr) => {
        if (!finished && num >= prev && num < prev + curr.num) {
          targetIndex = curr.pageIndex
          numIndex = num - prev
          finished = true
        }
        return prev + curr.num
      }, 0)
      if (targetIndex !== undefined && numIndex !== undefined) {
        instance.highlightText?.(searchStr, targetIndex, numIndex, true)
        setResult(s => ({ ...s, selectedPageIndex: targetIndex, numIndex: numIndex }))
      }
    }
  }
  useLayoutEffect(() => {
    highlightText(result.selectedNum)
  }, [result.selectedNum])

  useLayoutEffect(() => {
    if (searchStr) {
      const r = instance?.search?.(searchStr)
      if (r) {
        r.sort((b, a) => b.pageIndex - a.pageIndex)
        let num = 0
        r.forEach(i => {
          num += i.num
        })
        Object.values(instance.values.INDEX_TO_PAGE_LAYER).forEach(i => {
          i.clearTextSelect?.()
        })
        setResult({
          total: num,
          results: r.map(i => ({
            str: i.searchText,
            pageIndex: i.pageIndex,
            num: i.num
          })),
          selectedNum: num > 0 ? 0 : undefined
        })
        if (num > 0) {
          highlightText(0)
        }
      }
    } else {
      setResult({
        total: 0,
        results: []
      })
      Object.values(instance.values.INDEX_TO_PAGE_LAYER).forEach(i => {
        i.clearTextSelect?.()
      })
    }
  }, [searchStr])
  const hasResult = (result.results?.length ?? 0) > 1
  if (!visible) return null
  return (
    <WithBorder className={'px-3 py-2.5 flex items-center absolute top-14 right-6 z-20'}>
      <div className={'flex items-center gap-2'}>
        <Icon name={Icons.Search} size={16} />
        <BetterInput
          ref={inputRef}
          className={'flex-1'}
          onChange={e => {
            const value = e.target.value
            setSearchStr(value)
          }}
          autoFocus
          placeholder={t('general.search')}
        ></BetterInput>
      </div>

      {searchStr ? (
        <div className={'font-size-12 transparent-font ml-5'}>
          {Math.min(result.total, (result.selectedNum ?? 0) + 1)} / {result.total}
        </div>
      ) : null}
      <div className={'flex gap-2 pl-3 border-left ml-5'}>
        <Icon
          name={'park-up'}
          size={16}
          strokeWidth={5}
          className={classnames('square-button-small !rounded-full', !hasResult && '!cursor-not-allowed super-transparent-font')}
          onClick={() => {
            handleNavigate('prev')
          }}
        />
        <Icon
          name={'park-down'}
          size={16}
          strokeWidth={5}
          className={classnames('square-button-small !rounded-full', !hasResult && '!cursor-not-allowed super-transparent-font')}
          onClick={() => {
            handleNavigate('next')
          }}
        />
        <Icon
          name={'park-close-small'}
          size={16}
          strokeWidth={5}
          className={'square-button-small !rounded-full'}
          onClick={() => {
            setVisible(false)
          }}
        />
      </div>
    </WithBorder>
  )
}

export default memo(PDFSearch)
