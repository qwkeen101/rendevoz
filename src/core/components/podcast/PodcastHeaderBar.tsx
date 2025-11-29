import usePodcastState, { IPodcastState } from '@/core/components/feed/components/podcast/usePodcastState'
import { ObjectStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePrevious } from '@/hooks'
import { useLocation, useNavigate, useActionData, useNavigation } from 'react-router-dom'
import useNorepeatNavigate from '@/core/components/feed/components/podcast/useNorepeatNavigate'
const getTitle = (path: string) => {
  console.log(path)
  switch (path) {
    case 'episodes':
    case 'hot':
    case '/':
      return 'Trending'
    case '/library/podcast':
    case '/library/episode':
    case '/library':
      return 'Library'
    case '/search':
      return 'Search'
    default:
      return ''
  }
}
export default () => {
  const [state, setState] = usePodcastState()
  const [name, setName] = useState('')
  const navigate = useNorepeatNavigate()
  const location = useLocation()
  const canGoBack = location.key !== 'default' && location.pathname !== '/'
  useLayoutEffect(() => {
    setName(getTitle(location.pathname))
  }, [location.key])
  return (
    <Content className={'w-full flex gap-3 items-center px-6 py-2 border-bottom'}>
      <div className={'w-fit flex items-center gap-1.5'}>
        {canGoBack && (
          <Icon
            onClick={() => {
              canGoBack && navigate(-1)
            }}
            size={16}
            strokeWidth={4}
            name={'park-left'}
            className={'icon-18 !p-1.5 button -ml-3.5'}
          />
        )}
        <div className={'text-base sm:text-lg leading-loose whitespace-nowrap overflow-hidden'}>{name}</div>
      </div>
      <div className={'flex items-center ml-auto gap-2'}>
        <Icon name={'park-fire'} onClick={() => navigate('/')} className={'icon-18 !p-1.5 button'} />
        <Icon name={'park-document-folder'} onClick={() => navigate('/library')} className={'icon-18 !p-1.5 button'} />
        <Icon name={'park-search'} onClick={() => navigate('/search')} className={'icon-18 !p-1.5 button'} />
      </div>
    </Content>
  )
}
