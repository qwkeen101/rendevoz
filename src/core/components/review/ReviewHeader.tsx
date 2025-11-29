import { Icon } from '@/components'
import { memo } from 'react'
import { useLocation } from 'react-router-dom'
import { useNorepeatNavigate } from '@/hooks'
import { Icons } from '@/consts'
import useReviewState from '@/core/components/review/useReviewState'

export default memo(({ onBackGroup }: { onBackGroup?: VoidFunction }) => {
  const currentLocation = useLocation()
  const navigate = useNorepeatNavigate()
  const inViewer = currentLocation.pathname.startsWith('/viewer')
  let name = ''
  switch (currentLocation.pathname) {
    case '/cards':
      name = ''
      break
    case '/dashboard':
      name = ''
      break
  }
  if (inViewer) return null
  return (
    <div className={'flex w-full justify-between p-2 items-center'}>
      <div className={'flex items-center'}>
        {currentLocation.pathname !== '/dashboard' && currentLocation.key !== 'default' && (
          <Icon
            onClick={() => {
              navigate(-1)
            }}
            size={16}
            name={'park-left'}
            className={'square-button'}
          />
        )}
        {name && <div className={'text-base sm:text-lg line-clamp-1 break-all ml-2'}>{name}</div>}
      </div>
      <div className={'gap-2 flex pr-2 items-center'}>
        <Icon
          name={'park-system'}
          size={16}
          className={'square-button'}
          onClick={() => {
            navigate('/dashboard')
          }}
        />
        <Icon
          name={'custom-review-card'}
          size={16}
          className={'square-button'}
          onClick={() => {
            navigate('/cards')
          }}
        />
        <Icon
          name={Icons.History}
          size={16}
          className={'square-button'}
          onClick={() => {
            navigate('/history')
          }}
        />
        <Icon name={'park-close'} size={16} className={'square-button'} onClick={onBackGroup} />
      </div>
    </div>
  )
})
