import { AnimatePopover, Content, Icon, Menu, Tooltip } from '@/components'
import { KEY, Zindexes } from '@/consts'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import ClassName from '@/styles/classNames'
import { Regexp } from '@/utils'
import { css } from '@emotion/css'
import isHotkey from 'is-hotkey'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSetting } from '../setting'
import { searchToUrl } from './utils'
import { TypeToTypeName } from '../object'
import { useLatest } from 'react-use'

export type NavigationEvent =
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
  }
  style?: CSSProperties
}) => {
  const { loaded, displayUrl, canSave, readerMode } = navigationState
  const [currentUrl, setCurrentUrl] = useState<string>()
  const { t } = useTranslation()
  const [setting] = useSetting()
  const [allSuggestResults, setAutoSuggestResults] = useState<string[]>()
  const latestCurrentUrl = useLatest(currentUrl)
  const containerRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigationRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (inputRef.current === document.activeElement && isHotkey(KEY.Enter, e)) {
        on({ action: 'loadUrl', url: currentUrl })
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    if (currentUrl && currentUrl !== displayUrl && setting.webpage.enableSearchAutoSuggestion) {
      // if not url, auto suggest
      if (!Regexp.isValidWebUrl(currentUrl)) {
        if (
          (setting.general.language === 'zh-CN' || setting.general.defaultSearchEngine === 'baidu') &&
          setting.general.defaultSearchEngine !== 'google'
        ) {
          const autoSuggest = `https://www.baidu.com/sugrec?pre=1&p=3&ie=utf-8&json=1&prod=pc&from=pc_web&wd=${currentUrl}&csor=13&pwd=${currentUrl}`
          fetch(autoSuggest, {
            method: 'GET',
            referrer: ''
          })
            .then(res => res.json())
            .then(res => {
              if (res.g?.length) {
                if (latestCurrentUrl.current === currentUrl) {
                  setAutoSuggestResults(res.g.map(i => i.q))
                }
              }
            })
        }
        if (setting.general.language === 'en-US' || setting.general.defaultSearchEngine === 'google') {
          const autoSuggest = `
          https://www.google.com/complete/search?q=${currentUrl}&cp=20&client=gws-wiz-serp&xssi=t&gs_pcrt=undefined&authuser=0`
          fetch(autoSuggest, {
            method: 'GET',
            referrer: ''
          })
            .then(res => res.text())
            .then(text => {
              try {
                const parser = new DOMParser()
                const arr = JSON.parse(text.slice(4))
                if (arr && latestCurrentUrl.current === currentUrl) {
                  setAutoSuggestResults(arr[0]?.map(i => parser.parseFromString(i[0], 'text/html').body.textContent))
                }
              } catch (e) {}
            })
        }
      } else {
        setAutoSuggestResults([])
      }
    } else {
      setAutoSuggestResults([])
    }
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [currentUrl])
  useEffect(() => {
    setCurrentUrl(displayUrl)
  }, [displayUrl])

  return (
    <Content
      ref={navigationRef}
      flex
      gap={6}
      alignItems="center"
      style={{
        fontSize: FontSize['13px'],
        padding: '6px 6px',
        flexShrink: 0,
        background: Colors.Background.Secondary,
        ...style
      }}
    >
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
      <AnimatePopover
        positions={['bottom']}
        disableIntersection
        padding={10}
        align="start"
        innerRef={containerRef}
        parentElement={navigationRef.current}
        onClickOutside={() => setAutoSuggestResults([])}
        visible={!!allSuggestResults?.length && setting.webpage.enableSearchAutoSuggestion}
        containerStyle={{ zIndex: String(Zindexes.SearchPanel + 1) }}
        content={
          <Menu.NavigationMenu
            style={{
              width: containerRef.current?.getBoundingClientRect().width,
              padding: allSuggestResults?.length ? 10 : 0
            }}
            layout={allSuggestResults?.map(i => ({
              type: 'item',
              text: i,
              name: i
            }))}
            onClick={i => {
              setAutoSuggestResults([])
              on({
                action: 'loadUrl',
                url: searchToUrl(i)
              })
            }}
          ></Menu.NavigationMenu>
        }
      >
        <Content
          flex
          alignItems="center"
          justifyContent="space-between"
          auto
          className={css({
            padding: '2px 8px',
            borderRadius: '999px',
            maxWidth: '100%',
            background: Colors.Background.ButtonHover
          })}
        >
          <input
            ref={inputRef}
            value={currentUrl}
            onChange={e => {
              setCurrentUrl(e.target.value)
            }}
            style={{
              border: 'none',
              flex: 1,
              lineHeight: 1,
              width: '100%',
              background: 'transparent',
              height: '1.5rem'
            }}
            className={css({
              outline: 'none'
            })}
            placeholder={t('general.search in default engine or input url')}
          ></input>

          {canSave && (
            <Tooltip
              content={t('general.save as object', {
                type: t(`general.${TypeToTypeName['webpage']}`)
              })}
            >
              <Icon
                name="park-share-one"
                containerStyle={{ marginLeft: '6px' }}
                className={ClassName.circleButton(3)}
                onClick={() => on({ action: 'saveAsMetaObject' })}
                size={14}
              />
            </Tooltip>
          )}
        </Content>
      </AnimatePopover>
    </Content>
  )
}

export default WebpageNavigation
