import { Button, Content, Icon, VirtualList } from '@/components'
import BorderInput from '@/components/base/BorderInput'
import Colors from '@/consts/colors'
import { EditorBarStateAtom } from '@/core/components/editor/hooks/useEditorBarState'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import useEditorSearch from '@/core/components/editor/hooks/useEditorSearch'
import { useDebounceEffect, useSelectAtomValue } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { atom, useAtom } from 'jotai'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IEditorInstance } from '~/typings'

const EditorSearchAtom = atom<{
  loop: boolean
  replaceInput: string
  replaceVisible: boolean
}>({
  replaceVisible: false,
  replaceInput: '',
  loop: true
})

const EditorSearchPanel = () => {
  const { t } = useTranslation()
  const instance = useEditorInstance()
  const visible = useSelectAtomValue(EditorBarStateAtom, s => s.showSearch)
  const [editorSearchState, setEditorSearchState] = useEditorSearch()
  const [searchInput, setSearchInput] = useState('')
  const [searchState, setSearchState] = useAtom(EditorSearchAtom)
  const [searchResult, setSearchResult] = useState<
    {
      resultString: string
      blockId: number
    }[]
  >([])
  const handleGetSearchResult = (reset = true) => {
    if (searchInput) {
      const result = instance.searchOps?.search?.(searchInput, reset)
      result?.length
        ? setSearchResult(
            result.map(i => ({
              resultString: i[1],
              blockId: i[0]
            }))
          )
        : setSearchResult([])
    } else {
      setSearchResult([])
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
    const currentOccur = editorSearchState.currentOccurrence
    const { loop } = searchState
    if (!editorSearchState.occurrences) return
    const occurrences = editorSearchState.occurrences
    if (!currentOccur) {
      const firstOccur = Object.entries(editorSearchState.occurrences || {})[0]
      setEditorSearchState(s => ({
        ...s,
        currentOccurrence: {
          blockId: Number(firstOccur[0]),
          idx: 0
        }
      }))
      return
    } else {
      const occurs = occurrences[currentOccur.blockId]
      const strCurrentOccurBlockId = String(currentOccur.blockId)
      const occurKeys = Object.keys(occurrences)
      const currentOccurIdx = occurKeys.findIndex(i => i === strCurrentOccurBlockId)
      if (direction === 'down') {
        // if last
        let nextOccur: {
          blockId: number
          idx: number
        }
        // last occur in current block
        if (currentOccur.idx === occurs - 1) {
          // no next occur
          if (currentOccurIdx === occurKeys.length - 1) {
            if (loop) {
              const firstOccurBlockId = Number(occurKeys[0])
              nextOccur = {
                blockId: firstOccurBlockId,
                idx: 0
              }
            } else {
              nextOccur = currentOccur
            }
          }
          // get next occur block
          else {
            const nextBlockOccur = occurKeys[currentOccurIdx + 1]
            nextOccur = {
              blockId: Number(nextBlockOccur),
              idx: 0
            }
          }
        } else {
          nextOccur = {
            blockId: currentOccur.blockId,
            idx: currentOccur.idx + 1
          }
        }
        setEditorSearchState(s => ({ ...s, currentOccurrence: nextOccur }))
      } else {
        let prevOccur: {
          blockId: number
          idx: number
        }
        if (currentOccur.idx === 0) {
          // no prev occur
          if (currentOccurIdx === 0) {
            if (loop) {
              const lastOccurBlockId = Number(occurKeys[occurKeys.length - 1])
              prevOccur = {
                blockId: lastOccurBlockId,
                idx: Math.max(occurrences[lastOccurBlockId] - 1, 0)
              }
              console.log(prevOccur)
            } else {
              prevOccur = currentOccur
            }
          } else {
            const prevBlockOccur = occurKeys[currentOccurIdx - 1]
            prevOccur = {
              blockId: Number(prevBlockOccur),
              idx: Math.max(0, occurrences[Number(prevBlockOccur)] - 1)
            }
          }
        } else {
          prevOccur = {
            blockId: currentOccur.blockId,
            idx: currentOccur.idx - 1
          }
        }
        setEditorSearchState(s => ({ ...s, currentOccurrence: prevOccur }))
      }
    }
  }

  const handleReplaceCurrent = () => {
    const replaceString = searchState.replaceInput
    const sourceString = searchInput
    if (replaceString === sourceString) return
    instance.searchOps?.replace?.(sourceString, replaceString, true)
    setTimeout(() => {
      handleGetSearchResult(false)
    })
  }
  useEffect(() => {
    if (editorSearchState.currentOccurrence?.blockId) {
      instance.scrollToBlock?.({
        blockId: editorSearchState.currentOccurrence.blockId
      })
    }
  }, [editorSearchState.currentOccurrence])
  const totalOccur = Object.values(editorSearchState.occurrences || {}).reduce((prev, curr) => prev + curr, 0)
  const occurArr = Array.from(Object.entries(editorSearchState.occurrences || {}))
  const strCurrentOccurBlockId = String(editorSearchState.currentOccurrence?.blockId)
  const currentOccurIdx = occurArr.findIndex(i => i[0] === strCurrentOccurBlockId)
  const currentOccur =
    Object.values(editorSearchState.occurrences || {})
      .slice(0, currentOccurIdx || 0)
      .reduce((prev, curr) => prev + curr, 0) + (editorSearchState.currentOccurrence?.idx || 0)
  return (
    <Content fullHeight fullWidth flex column gap={10}>
      <BorderInput
        value={searchInput}
        onChange={v => typeof v === 'string' && setSearchInput(v)}
        textarea={false}
        placeholder={t('general.search')}
        containerStyle={{ borderRadius: 6 }}
        style={{ padding: '6px 12px' }}
      ></BorderInput>
      <Content flex gap={8} className={ClassName.description()} alignItems="center" style={{ flexWrap: 'wrap' }}>
        <div style={{ marginRight: 'auto' }}>{`${totalOccur ? currentOccur + 1 : 0} / ${totalOccur}`}</div>
        <Button.IconButton
          className={ClassName.circleButton()}
          icon="park-repair"
          selected={searchState.replaceVisible === true ? true : undefined}
          text={t('general.replace')}
          onClick={() => {
            setSearchState(s => ({
              ...s,
              replaceVisible: !s.replaceVisible
            }))
          }}
        />
        <Icon
          className={ClassName.circleButton()}
          name="park-down"
          onClick={() => {
            handleChangeOccur('down')
          }}
        />
        <Icon
          className={ClassName.circleButton()}
          name="park-up"
          onClick={() => {
            handleChangeOccur('up')
          }}
        />
      </Content>
      {searchState.replaceVisible && (
        <>
          <BorderInput
            placeholder={t('general.replace')}
            textarea={false}
            onChange={v => typeof v === 'string' && setSearchState(s => ({ ...s, replaceInput: v }))}
            value={searchState.replaceInput}
            containerStyle={{ borderRadius: 6 }}
            style={{ padding: '6px 12px' }}
          ></BorderInput>
          <Content flex gap={10} className={ClassName.description()}>
            <div
              className={ClassName.flatButton()}
              onClick={() => {
                handleReplaceCurrent()
              }}
            >
              {t('general.replace')}
            </div>
            <div
              className={ClassName.flatButton()}
              onClick={() => {
                instance.searchOps?.replace?.(searchInput, searchState.replaceInput)
                setTimeout(() => handleGetSearchResult(true), 100)
              }}
            >
              {t('general.replace all')}
            </div>
          </Content>
        </>
      )}
      <VirtualList
        style={{ width: '100%', height: '100%' }}
        estimateSize={80}
        items={searchResult}
        renderItem={i => (
          <ResultItem
            key={`${i.blockId}_${i.resultString}`}
            blockId={i.blockId}
            query={searchInput}
            searchString={i.resultString}
            instance={instance}
          />
        )}
      ></VirtualList>
    </Content>
  )
}

const ResultItem = ({
  blockId,
  searchString,
  query,
  instance
}: {
  blockId: number
  searchString: string
  query: string
  instance?: IEditorInstance
}) => {
  const replacedHTML = useMemo(() => {
    const idx = searchString.indexOf(query)
    let str = searchString.slice(Math.max(idx - 50, 0), Math.min(searchString.length, idx + 50))
    if (idx + 50 < searchString.length) {
      str += '...'
    }
    str = str.replaceAll(new RegExp(query, 'gi'), `<emphasis>${query}</emphasis>`)
    return str
  }, [query, searchString])
  return (
    <div className={ClassName.flatButton()} onClick={() => instance?.scrollToBlock?.({ blockId })}>
      <div
        className={css({
          emphasis: {
            color: Colors.Common.SelectColor
          }
        })}
        dangerouslySetInnerHTML={{ __html: replacedHTML }}
      ></div>
    </div>
  )
}
export default EditorSearchPanel
