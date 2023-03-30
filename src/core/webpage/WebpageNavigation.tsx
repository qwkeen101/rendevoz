import { Content, Icon, Tooltip } from '@/components'
import { KEY } from '@/consts'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import isHotkey from 'is-hotkey'
import { useEffect, useState } from 'react'

type NavigationEvent =
  | {
      action: 'back' | 'forward' | 'refresh' | 'stop' | 'showOriginPage' | 'showReaderPage' | 'saveAsMetaObject'
    }
  | {
      action: 'loadUrl'
      url: string
    }
const WebpageNavigation = ({
  on,
  navigationState
}: {
  on: (event: NavigationEvent) => void
  navigationState: {
    loaded: boolean
    canSave: boolean
    displayUrl?: string
    readerMode?: boolean
  }
}) => {
  const { loaded, displayUrl, canSave, readerMode } = navigationState
  const [currentUrl, setCurrentUrl] = useState<string>()
  useEffect(() => {
    setCurrentUrl(displayUrl)
  }, [displayUrl])
  return (
    <Content flex gap={8} alignItems="center" style={{ fontSize: 18, color: '#8590ae', padding: '6px 16px', paddingTop: '2px' }}>
      <Icon className={ClassName.circleButton()} name="park-left" onClick={() => on({ action: 'back' })} />
      <Icon className={ClassName.circleButton()} name="park-right" onClick={() => on({ action: 'forward' })} />
      <Icon
        className={ClassName.circleButton()}
        name={loaded ? 'park-refresh' : 'park-close'}
        onClick={() => {
          if (loaded) {
            on({ action: 'refresh' })
          } else {
            on({ action: 'stop' })
          }
        }}
      />
      <Content
        flex
        alignItems="center"
        justifyContent="space-between"
        auto
        className={css({
          padding: '4px 12px',
          borderRadius: '999px',
          background: 'rgba(0,0,0,0.06)',
          ':focus-within': {
            outline: '1px solid #8590ae'
          }
        })}
      >
        <input
          value={currentUrl}
          onChange={e => {
            setCurrentUrl(e.target.value)
          }}
          style={{
            border: 'none',
            flex: 1,
            lineHeight: 1,
            background: 'transparent'
          }}
          className={css({
            outline: 'none'
          })}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              if (currentUrl?.startsWith('https://') || currentUrl?.startsWith('http://')) {
                on({ action: 'loadUrl', url: currentUrl })
              } else {
                on({ action: 'loadUrl', url: 'https://' + currentUrl })
              }
            }
          }}
        ></input>
        {canSave && (
          <Tooltip content="Save as object">
            <Icon
              name="park-save"
              containerStyle={{ marginLeft: '20px' }}
              className={ClassName.circleButton()}
              size={16}
              onClick={() => on({ action: 'saveAsMetaObject' })}
            />
          </Tooltip>
        )}
        {loaded &&
          (readerMode ? (
            <Tooltip content="Show Original Web Page">
              <Icon
                name="park-web-page"
                containerStyle={{ marginLeft: '12px' }}
                className={ClassName.circleButton()}
                size={16}
                onClick={() => on({ action: 'showOriginPage' })}
              />
            </Tooltip>
          ) : (
            <Tooltip content="Reader Mode">
              <Icon
                containerStyle={{ marginLeft: '12px' }}
                name="park-book-open"
                className={ClassName.circleButton()}
                size={16}
                onClick={() => on({ action: 'showReaderPage' })}
              />
            </Tooltip>
          ))}
      </Content>
    </Content>
  )
}

export default WebpageNavigation
