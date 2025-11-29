import { useMemo, useRef, useState, memo } from 'react'
import useWebpageState from '@/core/components/webpage/hooks/useWebpageState'
import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'
import { Icon } from '@/components'
import { Icons } from '@/consts'
import { IEditorInstance, IParsedWebpage } from '~/typings'
import { ObjectStore } from '@/api/stores'
import useWebpageInstance from '@/core/components/webpage/hooks/useWebpageInstance'
import { IWebpageProps } from '@/core/components/webpage/Webpage'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import toast from 'react-hot-toast'
import gN from '@/assets/images/google-news.png?url'
import InPageTagRenderer from '@/core/components/common/InPageTagRenderer'
import classnames from 'classnames'
import useWebpageContent from '@/core/components/webpage/hooks/useWebpageContent'
import WebpageLoadingPage from '@/core/components/webpage/WebpageLoadingPage'
import { EditorTitleClassName } from '@/core/components/editor/components/EditorTitle'

const getDomain = (url: string) => {
  try {
    const domain = new URL(url).hostname
    // 提取顶级域名（假设是 ".com" 顶级域）
    const domainParts = domain.split('.')
    const topLevelDomain = domainParts.slice(domainParts.length - 2).join('.')
    return topLevelDomain
  } catch (e) {
    return ''
  }
}

const WebpageTitle = ({
  title,
  favicon,
  url,
  metaId,
  feedCollectionId
}: {
  title: string
  favicon?: string
  url: string
  feedCollectionId?: number
  metaId?: number
}) => {
  const feedCollection = ObjectStore('feedCollection').useValue(feedCollectionId)
  const image = (feedCollection?.icon === 'gNews' ? gN : feedCollection?.icon) ?? favicon
  const domain = useMemo(() => getDomain(url), [url])
  const source = feedCollection?.name ?? domain
  const { t } = useTranslation()
  return (
    <div
      style={{
        gap: '0.6em'
      }}
      className={'flex flex-col @container'}
    >
      <div className={EditorTitleClassName}>{title || t(trans.Untitled)}</div>
      <div className={'em:text-sm gap-2 flex items-center flex-wrap transparent-font uppercase'}>
        {image && <img crossOrigin={'anonymous'} src={image} className={'em:w-5 em:h-5 rounded-sm object-cover'} />}
        {source && (
          <div
            onClick={() => {
              if (feedCollection) {
                Global.layoutOps?.openPage('feed').then(ins => {
                  ins.feedOps?.navigate(`/feed/collection/${feedCollection.id}`)
                })
              } else {
                url && window.open(url, '_blank')
              }
            }}
            className={'line-clamp-1 mr-3 cursor-pointer'}
          >
            {source}
          </div>
        )}
        {metaId ? <InPageTagRenderer metaId={metaId} /> : null}
      </div>
    </div>
  )
}

const ModeSwitcher = ({ onChange, mode }: { onChange: (mode: 'original' | 'clean') => void; mode: 'clean' | 'original' }) => {
  const { t } = useTranslation()
  return (
    <div className={'flex shrink-0 rounded-full font-size-12 transparent-font font-semibold'}>
      <div
        onClick={() => onChange('original')}
        className={classnames('button !px-2.5 !py-1 !rounded-full', mode === 'original' && 'bg-hover primary-font')}
      >
        {t('general.Original mode')}
      </div>
      <div
        onClick={() => onChange('clean')}
        className={classnames('button !px-2.5 !py-1 !rounded-full', mode === 'clean' && 'bg-hover primary-font')}
      >
        {t('general.Clean mode')}
      </div>
    </div>
  )
}

const WebpageContentRenderer = ({
  editorOptions,
  onInstanceInitialized,
  initialHeight,
  onWebpageParsed,
  onShowOriginal,
  switcherHeader,
  onEndLoad,
  onFailLoad,
  onStartLoad
}: {
  editorOptions?: IWebpageProps['editorOptions']
  initialHeight?: number
  onShowOriginal?: (value: boolean) => void
  onInstanceInitialized: IWebpageProps['onInstanceInitialized']
  switcherHeader?: boolean
  onWebpageParsed?: (webpage: IParsedWebpage) => void
  onStartLoad?: VoidFunction
  onEndLoad?: VoidFunction
  onFailLoad?: VoidFunction
}) => {
  const [{ isLoading, url, showOriginal, name, isFailed, content, metaId, feedCollectionId, favicon }] = useWebpageState()
  const [isReadOnly, setIsReadOnly] = useState(true)
  const editorInstanceRef = useRef<IEditorInstance>()
  const webpageInstance = useWebpageInstance()
  const webviewRef = useRef<HTMLWebViewElement>(null)
  const getHTMLfromWebview = async () => {
    if (cachedHTML.current) {
      return cachedHTML.current
    }
    const webview = webviewRef.current
    if (webview) {
      try {
        webview.stop()
        const res = await webview.executeJavaScript(`document.documentElement.outerHTML`, true)
        return res
      } catch (e) {
        console.error(e)
      }
    }
  }
  const loadWebpage = useWebpageContent({
    onParsed: onWebpageParsed,
    enabled: !showOriginal,
    onStartLoad,
    onEndLoad,
    onFailLoad,
    onGetHTML: async () => {
      return await getHTMLfromWebview()
    }
  })
  const { t } = useTranslation()
  const cachedHTML = useRef<string>()
  const changeMode = async (mode: 'original' | 'clean') => {
    if (mode === 'clean') {
      const html = await getHTMLfromWebview()
      cachedHTML.current = html
    }
    onShowOriginal?.(mode === 'original' ? true : false)
  }
  const copyLink = () => {
    navigator.clipboard.writeText(url)
    toast.success(t(trans.Copied))
  }
  const renderer = () => {
    return (
      <>
        {switcherHeader && (
          <div className={'flex items-center justify-center w-full py-1.5'}>
            <ModeSwitcher onChange={v => changeMode(v)} mode={'clean'} />
          </div>
        )}
        <NoteEditor
          {...editorOptions}
          initialHeight={initialHeight}
          labelType={'webpageLabel'}
          styles={{
            ...editorOptions?.styles,
            containerStyle: {
              ...editorOptions?.styles?.containerStyle,
              opacity: isLoading || isFailed ? 0 : 1
            }
          }}
          onInstanceInitialized={i => {
            editorInstanceRef.current = i
            webpageInstance.editorInstance = i
            onInstanceInitialized?.(webpageInstance)
          }}
          defaultValue={content}
          header={{
            ...editorOptions?.header,
            display: {
              ...editorOptions?.header?.display,
              modeSwitcher: false
            },
            rightExtra: (
              <>
                <ModeSwitcher onChange={v => changeMode(v)} mode={'clean'} />
                {editorOptions?.header?.rightExtra}
              </>
            )
          }}
          layout={{
            showLastSave: false,
            ...editorOptions?.layout,
            settings: onClose => [
              ...(editorOptions?.layout?.settings?.(onClose) || []),
              {
                type: 'item',
                key: 'import-html',
                text: t('general.Import HTML'),
                icon: 'park-download',
                onSelect: () => {
                  onClose?.()
                  Global.commonOps?.upload().then(async f => {
                    if (f instanceof File) {
                      try {
                        const str = await f.text()
                        const isHTML = str => {
                          const temp = document.createElement('template')
                          temp.innerHTML = str
                          return !!temp.content.childElementCount
                        }
                        if (isHTML(str)) {
                          loadWebpage(str, true)
                        } else {
                          throw ''
                        }
                      } catch (e) {
                        toast.error('Invalid HTML!')
                      }
                      return
                    }
                    toast.error('Invalid HTML!')
                  })
                }
              },
              {
                type: 'item',
                key: 'view-original',
                text: t(trans.ViewOriginal),
                icon: Icons.Efferent,
                onSelect: () => {
                  onClose?.()
                  window.open(url, '_blank')
                }
              },
              {
                type: 'item',
                key: 'copy-link',
                text: t(trans.CopyLink),
                icon: Icons.Copy,
                onSelect: () => {
                  onClose?.()
                  copyLink()
                }
              },
              {
                type: 'separator'
              }
            ]
          }}
          stringTitle={name}
          readOnly={isReadOnly}
          onReadOnlyChange={v => setIsReadOnly(v)}
          title={{
            customTitleRenderer: () => (
              <WebpageTitle favicon={favicon} url={url} metaId={metaId} feedCollectionId={feedCollectionId} title={name} />
            ),
            ...editorOptions?.title
          }}
        />
        {(isLoading || isFailed) && (
          <WebpageLoadingPage
            name={name}
            onUpload={h => {
              loadWebpage(h, true)
            }}
            onViewOriginal={() => onShowOriginal?.(true)}
            url={url}
            isFailed={!!isFailed}
          />
        )}
      </>
    )
  }
  return (
    <>
      {showOriginal ? (
        <div
          className={'w-full h-full flex flex-col'}
          style={{
            ...editorOptions?.styles?.containerStyle
          }}
        >
          {switcherHeader ? (
            <div className={'flex items-center justify-center w-full py-1.5'}>
              <ModeSwitcher onChange={v => changeMode(v)} mode={'original'} />
            </div>
          ) : (
            <div className={'w-full @container flex items-center justify-between px-3'}>
              <div className={'grow flex gap-3 max-w-[60%] items-center'}>
                {editorOptions?.header?.leftExtra}
                <div className={'hidden @2xl:line-clamp-1'}>{name || t(trans.Untitled)}</div>
              </div>
              <div className={'flex items-center py-2 gap-3'}>
                <ModeSwitcher onChange={v => changeMode(v)} mode={'original'} />
                <Icon
                  onClick={() => {
                    loadWebpage(undefined, true).then(() => {
                      toast.success(t(trans.Success.ImportedSuccessfully))
                    })
                  }}
                  name={'park-download'}
                  tooltip={t('general.Import HTML')}
                  size={16}
                  className={'square-button'}
                />
                <Icon
                  tooltip={t(trans.ViewOriginal)}
                  size={16}
                  name={Icons.Efferent}
                  onClick={() => {
                    window.open(url, '_blank')
                  }}
                  className={'square-button'}
                />
                {editorOptions?.header?.rightExtra}
              </div>
            </div>
          )}
          <webview
            httpreferrer={'https://www.google.com'}
            disablewebsecurity
            allowpopups={'true'}
            ref={n => {
              if (n) {
                n.allowpupups = true
                n.disablewebsecurity = true
                webviewRef.current = n
              }
            }}
            useragent={
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
            }
            src={url}
            style={{ width: '100%', flex: 1, background: 'white', overflow: 'hidden' }}
          />
        </div>
      ) : (
        renderer()
      )}
    </>
  )
}

export default memo(WebpageContentRenderer)
