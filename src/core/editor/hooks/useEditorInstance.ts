import { assignProperties } from '@/utils'
import { atom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { CustomEditor, IEditorInstance } from '~/typings'
import { goToBlock, goToTextHighlight, selectBlock, waitForEditorContentInitialized } from '../utils'
import { Editor, Node, Transforms } from 'slate'
import { useEventHandler, useScopedEventEmitter } from '@/events'
import { useDebounceFn } from '@/hooks'
import { EditorSearchAtom, SearchEntry, SearchOccurrence } from './useEditorSearch'
import { Text } from 'slate'
import { ID_TO_PATH_MAP } from '../weakMaps'
import useEditorBarState from './useEditorBarState'

export const EditorInstanceAtom = atom<IEditorInstance>({})

const useEditorInstance = () => useAtomValue(EditorInstanceAtom)

export const useAssignEditorInstance = (editor: CustomEditor) => {
  const instance = useEditorInstance()
  const scopedEmitter = useScopedEventEmitter()
  const handler = useEventHandler('editor')
  const setEditorSearch = useSetAtom(EditorSearchAtom)
  const editorSearch = useAtomValue(EditorSearchAtom)
  const [barState, setEditorBarState] = useEditorBarState()
  useEffect(() => {
    scopedEmitter.addListener('editor', handler)
    return () => scopedEmitter.removeListener('editor', handler)
  })
  // block id => block string map
  const cachedBlockStringRef = useRef<Record<number, string>>({})
  handler.on('valueChange', () => {
    debouncedCacheString.run()
  })
  const getCache = () => {
    const value = editor.children
    const cache: Record<number, string> = {}
    value.forEach(i => {
      if ('id' in i && i.id) {
        cache[i.id] = Node.string(i)
      }
    })
    cachedBlockStringRef.current = cache
  }
  const debouncedCacheString = useDebounceFn(
    () => {
      getCache()
    },
    { wait: 500 }
  )

  useEffect(() => {
    assignProperties(instance, {
      scrollToBlock: async opts => {
        if (opts.blockId !== undefined) {
          await goToBlock(opts.blockId, editor)
        }
      },
      openSearch: () => setEditorBarState(s => ({ ...s, showSearch: true })),
      closeSearch: () => setEditorBarState(s => ({ ...s, showSearch: false })),
      toggleSearch: () => setEditorBarState(s => ({ ...s, showSearch: !s.showSearch })),
      selectBlock: async opts => {
        if (opts.blockId !== undefined) {
          await selectBlock(opts.blockId, editor)
        }
      },
      scrollToHighlight: async opts => {
        await waitForEditorContentInitialized(editor)
        goToTextHighlight(opts.highlightId, editor)
      },
      getSlateEditor: () => editor,
      changeOccurrence: direction => {
        const currentOccur = editorSearch.currentOccurrence
        const loop = true
        if (!editorSearch.occurrences) return
        const occurrences = editorSearch.occurrences
        if (!currentOccur) {
          const firstOccur = Object.entries(editorSearch.occurrences || {})[0]
          setEditorSearch(s => ({
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
              nextOccur = { blockId: currentOccur.blockId, idx: currentOccur.idx + 1 }
            }
            setEditorSearch(s => ({ ...s, currentOccurrence: nextOccur }))
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
            setEditorSearch(s => ({ ...s, currentOccurrence: prevOccur }))
          }
        }
      },
      search: (query, reset = true) => {
        const searchString = cachedBlockStringRef.current
        const regexp = new RegExp(query, 'gi')
        const result = Object.entries(searchString)
          .map(entry => {
            const length = entry[1].match(regexp)?.length
            if (length) {
              return [Number(entry[0]), entry[1], length]
            } else {
              return undefined
            }
          })
          .filter(i => i) as [number, string, number][]
        const resultRecord: Record<number, string> = {}
        const occurrencesRecord: Record<number, number> = {}
        result.forEach(i => {
          resultRecord[i[0]] = i[1]
          occurrencesRecord[i[0]] = i[2]
        })

        if (reset) {
          CSS.highlights.clear()
        }
        const firstOccurrence = Object.entries(occurrencesRecord)[0]
        setEditorSearch({
          query,
          occurrences: occurrencesRecord,
          results: resultRecord,
          entryCache: {},
          currentOccurrence: reset
            ? firstOccurrence
              ? {
                  blockId: Number(firstOccurrence[0]),
                  idx: 0
                }
              : undefined
            : editorSearch.currentOccurrence
        })
        return result.map(i => [i[0], i[1]])
      },
      replace: (source, target, replaceCurrent) => {
        if (replaceCurrent) {
          const currentOccurrence = editorSearch.currentOccurrence
          if (!currentOccurrence) return
          const { blockId, idx } = currentOccurrence
          const block = editor.children.find(i => 'id' in i && i.id === blockId)
          const path = ID_TO_PATH_MAP.get(editor)?.get(blockId)
          if (!block || !path) return
          const textEntries = Array.from(Node.texts(block))
          const withLengthEntries: SearchEntry[] = []
          textEntries.forEach((e, idx, arr) => {
            if (idx === 0) {
              withLengthEntries.push({
                text: e[0],
                path: e[1],
                totalLength: e[0].text.length,
                startLength: 0
              })
            } else {
              const prev = withLengthEntries[idx - 1]
              withLengthEntries.push({
                text: e[0],
                path: e[1],
                totalLength: e[0].text.length,
                startLength: prev.startLength + prev.totalLength
              })
            }
          })
          const text = Node.string(block)
          const indexes = [...text.matchAll(new RegExp(source, 'gi'))].map(i => i.index).filter(i => i !== undefined) as number[]
          const entries = indexes
            .map(i => {
              const startIndex = i
              const startEntry = withLengthEntries.findLast(i => i.startLength <= startIndex)
              if (!startEntry) return
              const startOffset = startIndex - startEntry.startLength
              return {
                startEntry,
                startOffset
              }
            })
            .filter(i => i) as SearchOccurrence[]
          const entry = entries[idx]
          Transforms.delete(editor, {
            at: {
              path: [path[0], ...entry.startEntry.path],
              offset: entry.startOffset
            },
            distance: source.length,
            unit: 'character',
            hanging: true
          })
          Transforms.insertText(editor, target, {
            at: {
              path: [path[0], ...entry.startEntry.path],
              offset: entry.startOffset
            }
          })
          const totalCurrentBlockOccurs = editorSearch.occurrences?.[blockId] || 0
          const currentBlock = Editor.node(editor, path)!
          cachedBlockStringRef.current[blockId] = Node.string(currentBlock[0])
          if (currentOccurrence.idx >= totalCurrentBlockOccurs - 1) {
            instance.changeOccurrence?.('down')
          }
          return
        }
        const searchString = cachedBlockStringRef.current
        const regexp = new RegExp(source, 'gi')
        Object.entries(searchString).forEach((entry, idx) => {
          const length = entry[1].match(regexp)?.length
          if (length) {
            const path = ID_TO_PATH_MAP.get(editor)?.get(Number(entry[0]))
            if (path) {
              const block = editor.children[path[0]]
              const textEntries = Array.from(Node.texts(block))
              const withLengthEntries: SearchEntry[] = []
              textEntries.forEach((e, idx, arr) => {
                if (idx === 0) {
                  withLengthEntries.push({
                    text: e[0],
                    path: e[1],
                    totalLength: e[0].text.length,
                    startLength: 0
                  })
                } else {
                  const prev = withLengthEntries[idx - 1]
                  withLengthEntries.push({
                    text: e[0],
                    path: e[1],
                    totalLength: e[0].text.length,
                    startLength: prev.startLength + prev.totalLength
                  })
                }
              })
              const text = Node.string(block)
              const indexes = [...text.matchAll(new RegExp(source, 'gi'))].map(i => i.index).filter(i => i !== undefined) as number[]
              const entries = indexes
                .map(i => {
                  const startIndex = i
                  const startEntry = withLengthEntries.findLast(i => i.startLength <= startIndex)
                  if (!startEntry) return
                  const startOffset = startIndex - startEntry.startLength
                  return {
                    startEntry,
                    startOffset
                  }
                })
                .filter(i => i) as SearchOccurrence[]
              entries.forEach(entry => {
                Transforms.delete(editor, {
                  at: {
                    path: [path[0], ...entry.startEntry.path],
                    offset: entry.startOffset
                  },
                  distance: source.length,
                  unit: 'character',
                  hanging: true
                })
                Transforms.insertText(editor, target, {
                  at: {
                    path: [path[0], ...entry.startEntry.path],
                    offset: entry.startOffset
                  }
                })
              })
            }
          }
        })
        getCache()
      },
      pureSearch: (query, reset = true) => {
        const searchString = cachedBlockStringRef.current
        const regexp = new RegExp(query, 'gi')
        const result = Object.entries(searchString)
          .map(entry => {
            const length = entry[1].match(regexp)?.length
            if (length) {
              return [Number(entry[0]), entry[1], length]
            } else {
              return undefined
            }
          })
          .filter(i => i) as [number, string, number][]
        const resultRecord: Record<number, string> = {}
        const occurrencesRecord: Record<number, number> = {}
        result.forEach(i => {
          resultRecord[i[0]] = i[1]
          occurrencesRecord[i[0]] = i[2]
        })

        return result.map(i => [i[0], i[1]])
      },
      getOccurrences: query => {
        const searchString = cachedBlockStringRef.current
        const regexp = new RegExp(query, 'gi')
        const result = Object.entries(searchString)
          .map(entry => {
            const length = entry[1].match(regexp)?.length
            if (length) {
              return [Number(entry[0]), entry[1], length]
            } else {
              return undefined
            }
          })
          .filter(i => i) as [number, string, number][]
        const occurrencesRecord: Record<number, number> = {}
        result.forEach(i => {
          occurrencesRecord[i[0]] = i[2]
        })
        const total = Object.values(occurrencesRecord).reduce((prev, curr) => prev + curr, 0)
        return total
      }
    })
  })
}

export default useEditorInstance
