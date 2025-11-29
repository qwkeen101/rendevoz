import { BetterInput, Button, Icon, WithBorder } from '@/components'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import useEditorSearch from '@/core/components/editor/hooks/useEditorSearch'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import { Icons, KEY } from '@/consts'
import isHotkey from 'is-hotkey'
import { useDebounceEffect } from '@/hooks'
import { assignProperties, getCursorElement } from '@/utils'
import { AnimatePresence, motion } from 'framer-motion'

export default memo(() => {
  const { t } = useTranslation()
  const instance = useEditorInstance()
  const [editorSearchState, setEditorSearchState] = useEditorSearch()
  const [visible, setVisible] = useState(false)
  const [searchInput, setSearchInput] = useState<string>('')
  const [searchState, setSearchState] = useState<{
    loop: boolean
    replaceInput: string
    replaceVisible: boolean
  }>({
    replaceVisible: false,
    replaceInput: '',
    loop: true
  })
  const inputRef = useRef<HTMLInputElement>(null)

  assignProperties(instance, {
    // @ts-ignore
    searchOps: {
      ...instance.searchOps,
      toggleSearch: () => {
        setVisible(!visible)
      }
    }
  })
  useEffect(() => {
    if (visible === false) {
      setSearchInput('')
      setSearchState(s => ({ ...s, replaceInput: '', replaceVisible: false }))
      setEditorSearchState({})
    } else {
      inputRef.current?.focus()
    }
    const keydown = (e: KeyboardEvent) => {
      if (isHotkey('mod+f', e)) {
        const element = getCursorElement()
        if (element) {
          const container = instance.getScrollElement?.()
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
    }
  }, [visible])

  const handleGetSearchResult = (reset = true) => {
    if (searchInput) {
      instance.searchOps?.search?.(searchInput, reset)
    } else {
      setEditorSearchState({})
    }
  }
  useDebounceEffect(
    () => {
      handleGetSearchResult()
    },
    [searchInput],
    { wait: 200 }
  )
  const handleChangeOccur = (direction: 'up' | 'down') => {
    instance.searchOps?.changeOccurrence(direction)
  }

  const handleReplaceCurrent = () => {
    const replaceString = searchState.replaceInput
    const sourceString = searchInput
    if (replaceString === sourceString) return
    instance.searchOps?.replace?.(sourceString, replaceString, true)
  }
  useEffect(() => {
    if (editorSearchState.currentOccurrence?.blockId) {
      instance.scrollToBlock?.({
        blockId: editorSearchState.currentOccurrence.blockId
      })
    }
  }, [editorSearchState.currentOccurrence])
  const { totalOccur, currentOccur } = useMemo(() => {
    let totalOccur = 0
    let currentOccur = 0
    if (editorSearchState.occurrences) {
      const entries = Array.from(editorSearchState.occurrences.entries())
      totalOccur = entries.reduce((prev, curr) => prev + curr[1], 0)
      if (editorSearchState.currentOccurrence) {
        const currentOccurIdx = entries.findIndex(i => i[0] === editorSearchState.currentOccurrence?.blockId)
        currentOccur =
          entries.slice(0, currentOccurIdx || 0).reduce((prev, curr) => prev + curr[1], 0) + (editorSearchState.currentOccurrence?.idx || 0)
      }
    }
    return {
      totalOccur,
      currentOccur
    }
  }, [editorSearchState])

  const ICON_SIZE = 18

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          transition={{ bounce: 0, duration: 0.1 }}
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
        >
          <WithBorder className={'absolute top-16 z-20 w-max right-6 flex flex-col gap-2 px-3 py-2'}>
            <div className={'flex items-center gap-3'}>
              <Icon name={Icons.Search} size={16} />
              <BetterInput
                ref={inputRef}
                onKeyDown={e => {
                  if (isHotkey(KEY.Enter, e)) {
                    handleChangeOccur('down')
                  }
                }}
                onChange={v => setSearchInput(v.target.value)}
                placeholder={t('general.search')}
              ></BetterInput>
              {searchInput ? (
                <div className={'font-size-12 transparent-font'}>{`${totalOccur ? currentOccur + 1 : 0} / ${totalOccur}`}</div>
              ) : null}
              <div className={'flex items-center gap-3.5 pl-3 border-left'}>
                <div
                  className={classnames('hover-active-button', 'font-size-13', !totalOccur && '!cursor-not-allowed !opacity-20')}
                  onClick={() => {
                    if (totalOccur) {
                      setSearchState(s => ({
                        ...s,
                        replaceVisible: !s.replaceVisible
                      }))
                    }
                  }}
                >
                  {t('general.replace')}
                </div>
                <Icon
                  className={classnames('hover-active-button', !totalOccur && '!cursor-not-allowed !opacity-20')}
                  name='park-down'
                  strokeWidth={4}
                  size={ICON_SIZE}
                  onClick={() => {
                    handleChangeOccur('down')
                  }}
                />
                <Icon
                  strokeWidth={4}
                  className={classnames('hover-active-button', !totalOccur && '!cursor-not-allowed !opacity-20')}
                  name='park-up'
                  size={ICON_SIZE}
                  onClick={() => {
                    handleChangeOccur('up')
                  }}
                />
                <Icon
                  strokeWidth={4}
                  className={'hover-active-button'}
                  name='park-close-small'
                  size={ICON_SIZE}
                  onClick={() => {
                    setVisible(false)
                  }}
                />
              </div>
            </div>
            {searchState.replaceVisible && (
              <div className={'border-top flex pt-2 items-center gap-2'}>
                <BetterInput
                  className={'flex-1'}
                  onKeyDown={e => {
                    if (isHotkey(KEY.Enter, e)) {
                      handleReplaceCurrent()
                    }
                  }}
                  onChange={v => setSearchState(s => ({ ...s, replaceInput: v.target.value }))}
                  placeholder={t('general.replace')}
                  autoFocus
                ></BetterInput>
                <div className={'flex gap-4 pr-1 font-size-13'}>
                  <div
                    className={'hover-active-button'}
                    onClick={() => {
                      handleReplaceCurrent()
                    }}
                  >
                    {t('general.replace')}
                  </div>
                  <div
                    className={'hover-active-button'}
                    onClick={() => {
                      instance.searchOps?.replace?.(searchInput, searchState.replaceInput)
                    }}
                  >
                    {t('general.replace all')}
                  </div>
                </div>
              </div>
            )}
          </WithBorder>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
