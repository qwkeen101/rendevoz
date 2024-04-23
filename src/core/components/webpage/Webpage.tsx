import { Content, Icon } from '@/components'
import { FC, useEffect, useMemo, memo } from 'react'
import { EditorProps, IWebpageInstance, MetaObject } from '~/typings'
import { createStore, Provider } from 'jotai'
import { useAssignWebpageInstance, WebpageInstanceAtom } from './hooks/useWebpageInstance'
import useWebpageState, { IWebpageState } from './hooks/useWebpageState'
import useWebpageContent from '@/core/components/webpage/hooks/useWebpageContent'
import WebpageContentRenderer from '@/core/components/webpage/WebpageContentRenderer'
import { TabTitle } from '@/core/rendevoz/components'
import { MetaStore } from '@/api/stores'

/**
 * Webpage can be a controlled or uncontrolled component
 * uncontrolled: only pass url / webpage id
 * controlled: pass content, title, author...
 */
export type IWebpageProps = {
  initialUrl?: string
  initialWebpageId?: number
  onInstanceInitialized?: (instance: IWebpageInstance) => void
  webpageFrom?: MetaObject['fromObject']
  disableTabTitle?: boolean
  onWebpageParsed?: (webpage: IWebpageState['externalState']) => void
  state?: IWebpageState['externalState']
  onStartLoad?: VoidFunction
  onEndLoad?: VoidFunction
  onFailLoad?: VoidFunction
  initialHeight?: number
  editorOptions?: Omit<EditorProps, 'id'>
}

const WebpageInner = ({
  initialWebpageId,
  disableTabTitle,
  initialHeight,
  onWebpageParsed,
  initialUrl: externalInitialUrl,
  webpageFrom,
  onInstanceInitialized,
  onEndLoad,
  onStartLoad,
  state,
  editorOptions,
  onFailLoad
}: IWebpageProps) => {
  const [webpageState, setWebpageState] = useWebpageState()
  useWebpageContent({
    onParsed: onWebpageParsed,
    onStartLoad,
    onEndLoad,
    onFailLoad
  })
  useEffect(() => {
    setWebpageState(s => ({ ...s, currentWebpageId: initialWebpageId, currentUrl: externalInitialUrl }))
  }, [initialWebpageId, externalInitialUrl])
  useEffect(() => {
    setWebpageState(s => ({ ...s, webpageFrom }))
  }, [webpageFrom])
  useEffect(() => {
    setWebpageState(s => ({ ...s, externalState: state }))
  }, [state])
  const webpageMeta = MetaStore.useObjectToMetaValue(webpageState.currentWebpageId)
  return (
    <>
      {!disableTabTitle && (
        <TabTitle
          icon={<Icon size={16} name={'park-web-page'} />}
          title={webpageMeta?.name || webpageState.externalState?.title || webpageState.currentWebpage?.title}
        />
      )}
      <WebpageContentRenderer initialHeight={initialHeight} onInstanceInitialized={onInstanceInitialized} editorOptions={editorOptions} />
    </>
  )
}
const Webpage: FC<IWebpageProps> = props => {
  const store = useMemo(() => {
    const store = createStore()
    store.set(WebpageInstanceAtom, {})
    return store
  }, [])
  return (
    <Provider store={store}>
      <WebpageInner {...props}></WebpageInner>
    </Provider>
  )
}
export default memo(Webpage)
