import { FC, useMemo, memo, useLayoutEffect } from 'react'
import { EditorProps, IParsedWebpage, IWebpageInstance } from '~/typings'
import { createStore, Provider, useSetAtom } from 'jotai'
import { WebpageInstanceAtom } from './hooks/useWebpageInstance'
import { WebpageStateAtom } from './hooks/useWebpageState'
import WebpageContentRenderer from '@/core/components/webpage/WebpageContentRenderer'
import { Descendant } from 'slate'
import { GlobalSetting } from '@/core'

/**
 * Webpage can be a controlled or uncontrolled component
 * uncontrolled: only pass url / webpage id
 * controlled: pass content, title, author...
 */
export type IWebpageProps = {
  onInstanceInitialized?: (instance: IWebpageInstance) => void
  onWebpageParsed?: (webpage: IParsedWebpage) => void
  onShowOriginal?: (value: boolean) => void
  showOriginal?: boolean
  initialHeight?: number
  switcherHeader?: boolean
  onStartLoad?: VoidFunction
  onEndLoad?: VoidFunction
  editorOptions?: Omit<EditorProps, 'id'> & { noteId?: number }
  url: string
  name?: string
  value?: Descendant[]
  metaId?: number
  feedCollectionId?: number
  onFailLoad?: VoidFunction
  favicon?: string
}

const WebpageInner = ({
  initialHeight,
  onWebpageParsed,
  switcherHeader,
  url,
  name = '',
  value,
  onShowOriginal,
  showOriginal,
  onInstanceInitialized,
  editorOptions,
  onEndLoad,
  onStartLoad,
  onFailLoad,
  metaId,
  favicon,
  feedCollectionId
}: IWebpageProps) => {
  const setWebpageState = useSetAtom(WebpageStateAtom)
  useLayoutEffect(() => {
    setWebpageState(s => ({
      ...s,
      name,
      url,
      content: value,
      favicon,
      feedCollectionId,
      metaId,
      showOriginal,
      noteId: editorOptions?.noteId
    }))
  }, [url, name, value, feedCollectionId, metaId, favicon, showOriginal, editorOptions?.noteId])
  return (
    <>
      <WebpageContentRenderer
        initialHeight={initialHeight}
        onInstanceInitialized={onInstanceInitialized}
        editorOptions={editorOptions}
        onWebpageParsed={onWebpageParsed}
        onShowOriginal={onShowOriginal}
        switcherHeader={switcherHeader}
        onStartLoad={onStartLoad}
        onEndLoad={onEndLoad}
        onFailLoad={onFailLoad}
      />
    </>
  )
}
const Webpage: FC<IWebpageProps> = props => {
  const store = useMemo(() => {
    const store = createStore()
    store.set(WebpageInstanceAtom, {})
    const noteId = props.editorOptions?.noteId
    store.set(WebpageStateAtom, {
      ...store.get(WebpageStateAtom),
      showOriginal: !GlobalSetting.getSetting().webpage.defaultCleanMode,
      isLoading: props.value || noteId ? false : true,
      loaded: props.value || noteId ? true : false,
      content: props.value,
      noteId
    })
    return store
  }, [])
  return (
    <Provider store={store}>
      <WebpageInner {...props}></WebpageInner>
    </Provider>
  )
}
export default memo(Webpage)
