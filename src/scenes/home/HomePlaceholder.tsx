import { memo } from 'react'

export default memo(() => {
  return <div className={'flex flex-1 gap-6 items-center justify-center'}>{['feed', 'podcast', 'youtube']}</div>
})
