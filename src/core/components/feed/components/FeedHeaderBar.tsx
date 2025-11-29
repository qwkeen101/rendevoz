import { useNorepeatNavigate, useNavigationControls, useDebounceFn } from '@/hooks'
import { Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import { getOS } from '@/App'
import useIsFullscreen from '@/hooks/utils/useIsFullscreen'
import CommonSearchBar from '@/core/components/common/CommonSearchBar'
import FeedConsts from '../FeedConsts'
import useFeedState from '../hooks/useFeedState'
import useFeedInstance from '../hooks/useFeedInstance'
const size = 26
const clazz = 'opacity-60 cursor-pointer hover:opacity-100 transition-opacity'

export default () => {
  const os = getOS()
  const isFullScreen = useIsFullscreen()
  const navigate = useNorepeatNavigate()
  const { canBack, canForward } = useNavigationControls('FEED')
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
      <div className={'flex items-center gap-5'}>
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
            navigate(FeedConsts.Routers.Dashboard)
          }}
          style={{ fontSize: size, appRegion: 'no-drag' }}
          className={classnames('mgc_home_4_line', clazz)}
        ></div>
        <div
          onClick={() => {
            navigate(FeedConsts.Routers.History)
          }}
          style={{ fontSize: size, appRegion: 'no-drag' }}
          className={classnames('mgc_history_line', clazz)}
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
        className={'flex cursor-pointer select-none rounded-3xl gap-2 px-3.5 py-1.5 font-size-12 hover-after-bg-hover'}
      >
        返回应用
      </div>
    </div>
  )
}

const Search = () => {
  const [state, setState] = useFeedState()
  const instance = useFeedInstance()
  const debounceSearch = useDebounceFn(
    () => {
      instance.newsOps?.search()
    },
    { wait: 400 }
  )
  return (
    <CommonSearchBar
      search={state.search}
      onSearchChange={v => {
        setState(s => ({ ...s, search: v }))
        debounceSearch.run()
      }}
      onOptionChange={() => {
        instance.newsOps?.search()
      }}
    />
  )
}
