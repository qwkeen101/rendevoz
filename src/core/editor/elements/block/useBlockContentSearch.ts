import useEditorInstance from '@/core/editor/hooks/useEditorInstance'
import { useAtomValue } from 'jotai/index'
import { EditorSearchAtom, SearchOccurrence } from '@/core/editor/hooks/useEditorSearch'
import { Node, Path } from 'slate'
import { useEffect } from 'react'
import { ReactEditor } from '@/core'
import { usePrevious } from '@/hooks'
import { CustomElement, IEditorInstance } from '~/typings'
import { CustomText } from '~/typings/components/editor/baseTypes'

const PrimaryHighlight = 'primary-highlight'
const SecondaryHighlight = 'secondary-highlight'

const useBlockContentSearch = (element: CustomElement, instance: IEditorInstance) => {
  const editorSearch = useAtomValue(EditorSearchAtom)
  const editor = instance.getSlateEditor?.()
  const blockId = element.id
  const previousElement = usePrevious(element)
  const getSearchEntries = (): SearchOccurrence[] | undefined => {
    if (editorSearch.entryCache?.[blockId] && previousElement === element) return editorSearch.entryCache[blockId]
    const query = editorSearch.query
    if (!query) return
    if (!editorSearch.entryCache) editorSearch.entryCache = {}
    const textEntries = Array.from(Node.texts(element))
    const withLengthEntries: {
      text: CustomText
      path: Path
      totalLength: number
      startLength: number
    }[] = []
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
    const text = Node.string(element)
    const indexes = [...text.matchAll(new RegExp(query, 'gi'))].map(i => i.index).filter(i => i !== undefined) as number[]
    const entries = indexes
      .map(i => {
        const startIndex = i
        const endIndex = i + query.length
        const startEntry = withLengthEntries.findLast(i => i.startLength <= startIndex)
        const endEntry = withLengthEntries.findLast(i => i.startLength <= endIndex)
        if (!startEntry || !endEntry) return
        const startOffset = startIndex - startEntry.startLength
        const endOffset = endIndex - endEntry.startLength
        return {
          startEntry,
          endEntry,
          startOffset,
          endOffset
        }
      })
      .filter(i => i) as SearchOccurrence[]
    editorSearch.entryCache[blockId] = entries
    return entries
  }
  useEffect(() => {
    if (editorSearch.results?.[blockId] && editorSearch.query && editorSearch.isSearching !== false) {
      const entries = getSearchEntries()
      if (entries) {
        const currentOccur = editorSearch.currentOccurrence
        const currentBlockPath = ReactEditor.findPath(editor, element)
        const secondaryHighlightArr = Array.from(CSS.highlights.get(SecondaryHighlight)?.values() || [])
        entries.forEach((entry, idx) => {
          const range = ReactEditor.toDOMRange(editor, {
            anchor: {
              offset: entry.startOffset,
              path: [...currentBlockPath, ...entry.startEntry.path]
            },
            focus: {
              path: [...currentBlockPath, ...entry.endEntry.path],
              offset: entry.endOffset
            }
          })
          Object.assign(range, {
            index: idx,
            blockId
          })
          const alreadyExistSecondaryHighlightRange = secondaryHighlightArr.find(i => i.index === idx && i.blockId === blockId)
          if (currentOccur?.blockId === blockId) {
            if (currentOccur.idx === idx) {
              const highlight = new Highlight()
              highlight.add(range)
              CSS.highlights.set(PrimaryHighlight, highlight)
              if (alreadyExistSecondaryHighlightRange) {
                console.log(alreadyExistSecondaryHighlightRange)
                const set = CSS.highlights.get(SecondaryHighlight)
                set?.delete(alreadyExistSecondaryHighlightRange)
                CSS.highlights.set(SecondaryHighlight, set)
              }
              return
            }
          }
          if (!alreadyExistSecondaryHighlightRange) {
            const highlight = CSS.highlights.get(SecondaryHighlight) || new Highlight()
            highlight.add(range)
            CSS.highlights.set(SecondaryHighlight, highlight)
          }
        })
      }
    }
    return () => {
      const primary = CSS.highlights.get(PrimaryHighlight)
      primary?.forEach(i => {
        if (i.blockId === blockId) {
          primary.delete(i)
        }
      })
      const set = CSS.highlights.get(SecondaryHighlight)
      set?.forEach(i => {
        if (i.blockId === blockId) {
          set?.delete(i)
        }
      })
    }
  }, [editorSearch, element])
}

export default useBlockContentSearch
