import { Button, Content, Icon, IconWithPopover, Tooltip, WithBorder } from '@/components'
import { KEY } from '@/consts'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import isHotkey from 'is-hotkey'
import { CSSProperties, useEffect, useState } from 'react'

type NavigationEvent =
  | {
      action: 'back' | 'forward' | 'refresh' | 'stop' | 'showOriginPage' | 'showReaderPage' | 'saveAsMetaObject' | 'zoom in' | 'zoom out'
    }
  | {
      action: 'loadUrl'
      url: string
    }
const WebpageNavigation = ({
  on,
  navigationState,
  style
}: {
  on: (event: NavigationEvent) => void
  navigationState: {
    loaded: boolean
    canSave: boolean
    displayUrl?: string
    readerMode?: boolean
  }
  style?: CSSProperties
}) => {
  const { loaded, displayUrl, canSave, readerMode } = navigationState
  const [currentUrl, setCurrentUrl] = useState<string>()
  useEffect(() => {
    setCurrentUrl(displayUrl)
  }, [displayUrl])
  return (
    <Content flex gap={8} alignItems="center" style={{ fontSize: FontSize['18px'], padding: '2px 16px 6px', ...style }}>
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
            outline: `1px solid ${Colors.Font.Tertiary}`
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
              name="park-add-web"
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
        {/* {!readerMode && (
          <IconWithPopover
            containerStyle={{ marginLeft: '12px' }}
            className={ClassName.circleButton()}
            placement={['bottom', 'top']}
            content={
              <WithBorder padding={12}>
                <Button.IconButton text="Zoom In" onClick={() => on({ action: 'zoom in' })} />
                <Button.IconButton text="Zoom Out" onClick={() => on({ action: 'zoom out' })} />
              </WithBorder>
            }
            name="park-more"
          ></IconWithPopover>
        )} */}
      </Content>
    </Content>
  )
}

export default WebpageNavigation
