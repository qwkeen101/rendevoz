import { Icon } from '@/components'
import React, { memo } from 'react'
import { useDebounceFn, useGlobalAtom, useNavigationControls, useNorepeatNavigate } from '@/hooks'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import { GlobalSetting } from '@/core'
import { getOS } from '@/App'
import useIsFullscreen from '@/hooks/utils/useIsFullscreen'
import usePodcastSearch from '@/core/components/podcast/hooks/usePodcastSearch'
import CommonSearchBar from '@/core/components/common/CommonSearchBar'
import usePodcastInstance from '../hooks/usePodcastInstance'
import PodcastConsts from '../PodcastConsts'
import { Icons } from '@/consts'

const size = 26
const clazz = 'opacity-60 cursor-pointer hover:opacity-100 transition-opacity'

export default memo(() => {
  const os = getOS()
  const isFullScreen = useIsFullscreen()
  const navigate = useNorepeatNavigate()
  const darkMode = GlobalSetting.useSelectSettingAtom('darkMode')
  const { canBack, canForward } = useNavigationControls('YOUTUBE')
  const { t } = useTranslation()
  return (
    <div
      style={{
        height: 54,
        appRegion: 'drag',
        paddingLeft: os === 'macos' && !isFullScreen ? '90px' : undefined
      }}
      className={'w-full px-2 flex items-center justify-between relative gap-2'}
    >
      <div className={'flex gap-5 items-center'}>
        <Icon
          onClick={() => {
            canBack && navigate(-1)
          }}
          style={{
            appRegion: 'no-drag'
          }}
          className={classnames(clazz, canBack ? '' : '!cursor-not-allowed !opacity-20')}
          size={size}
          strokeWidth={5}
          name={'park-left'}
        />
        <Icon
          onClick={() => {
            canForward && navigate(1)
          }}
          style={{
            appRegion: 'no-drag'
          }}
          className={classnames(clazz, canForward ? '' : '!cursor-not-allowed !opacity-20')}
          size={size}
          strokeWidth={5}
          name={'park-right'}
        />
        <div
          onClick={() => {
            navigate(PodcastConsts.Routers.Dashboard)
          }}
          style={{ fontSize: size, appRegion: 'no-drag' }}
          className={classnames('mgc_home_4_line', clazz)}
        ></div>
      </div>
      <Search />
      <div
        style={{
          appRegion: 'no-drag',
          background: 'var(--background-base)'
        }}
        onClick={() => {
          Global.layoutOps?.closeExtraPage()
        }}
        className={'flex cursor-pointer select-none gap-2 px-3.5 py-1.5 rounded-3xl font-size-11 mr-1 hover-after-bg-hover'}
      >
        返回应用
      </div>
    </div>
  )
})

const Search = () => {
  const instance = usePodcastInstance()
  const [state, setState] = useGlobalAtom(instance.searchAtom)
  const { onOptionChange, globalSearch, handleChange, options } = usePodcastSearch()
  const debounceChange = useDebounceFn(
    () => {
      instance.search?.({ limit: 20 })
    },
    { wait: 200 }
  )
  return (
    <CommonSearchBar
      search={state.query}
      onSearchChange={v => {
        setState(s => ({ ...s, query: v }))
        debounceChange.run()
      }}
    />
  )
}
