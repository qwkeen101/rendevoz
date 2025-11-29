import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components'
import { Icons, KEY } from '@/consts'
import isHotkey from 'is-hotkey'
import { ObjectStore } from '@/api/stores'
import { IFeedItem } from '~/typings'
import fuzzysort from 'fuzzysort'
import { atom } from 'jotai'
import { useAtomValue, useSetAtom } from 'jotai/react'

const FeedSearchCache = atom<
  Record<
    number | string,
    {
      query?: string
      result?: number[]
      visible?: boolean
    }
  >
>({})

export default (currItems: number[], id: number | string | undefined) => {
  const state = useAtomValue(FeedSearchCache)[id] || {
    visible: false
  }
  const setCacheState = useSetAtom(FeedSearchCache)
  const setState = (updater: (curr: typeof state) => typeof state) => {
    if (!id) return
    setCacheState(s => ({ ...s, [id]: updater(s[id] ?? state) }))
  }
  const calculateSearch = async () => {
    if (!state.query) {
      setState(s => ({ ...s, result: undefined }))
      return
    }
    const items = (await Promise.all(currItems.map(async i => await ObjectStore('feed').fetchOneById(i)))).filter(i => i) as IFeedItem[]
    const res = fuzzysort.go(state.query, items, {
      key: 'title',
      threshold: -100000
    })
    setState(s => ({ ...s, result: res.map(i => i.obj.id) }))
  }
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (state.visible) {
      inputRef.current?.focus()
    }
  }, [state.visible])
  const renderSearch = () => {
    return (
      <div className={'flex items-center gap-3'}>
        <Icon
          name={Icons.Search}
          className={'!rounded-full !p-1.5 icon-18 !h-auto button border'}
          onClick={() => {
            setState(s => ({ ...s, visible: !s.visible }))
          }}
        />
        <input
          ref={inputRef}
          className={'border-bottom'}
          value={state.query}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              calculateSearch()
            }
            if (isHotkey(KEY.Escape, e)) {
              setState(s => ({ ...s, query: undefined, visible: false }))
            }
          }}
          onChange={e => setState(s => ({ ...s, query: e.target.value }))}
          style={{
            width: state.visible ? 160 : 0,
            transition: 'width 0.3s ease'
          }}
        />
      </div>
    )
  }
  return {
    state,
    setState,
    renderSearch
  }
}
