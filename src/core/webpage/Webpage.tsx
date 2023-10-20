import { Content, Icon } from '@/components'
import { FC, useEffect, useMemo } from 'react'
import { EditorProps, IWebpageInstance, MetaObject } from '~/typings'
import { createStore, Provider } from 'jotai'
import { useAssignWebpageInstance, WebpageInstanceAtom } from './hooks/useWebpageInstance'
import useWebpageState, { IWebpageState } from './hooks/useWebpageState'
import useWebpageContent from '@/core/webpage/hooks/useWebpageContent'
import WebpageContentRenderer from '@/core/webpage/WebpageContentRenderer'
import { TabTitle } from '@/core/rendevoz/components'

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
  editorOptions?: Omit<EditorProps, 'id'>
}

const WebpageInner = ({
  initialWebpageId,
  disableTabTitle,
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

  return (
    <Content flex column fullHeight fullWidth>
      {!disableTabTitle && (
        <TabTitle
          icon={<Icon size={16} name={'park-web-page'} />}
          title={webpageState.currentWebpage?.title || webpageState.externalState?.title}
        />
      )}
      <div style={{ height: 0, flex: 1, width: '100%' }}>
        <WebpageContentRenderer onInstanceInitialized={onInstanceInitialized} editorOptions={editorOptions} />
      </div>
    </Content>
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
export default Webpage
