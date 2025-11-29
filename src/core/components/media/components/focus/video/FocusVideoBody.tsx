import { memo } from 'react'
import FocusVideoPlayer from '@/core/components/media/components/focus/video/FocusVideoPlayer'
import FocusReaderSubtitle from '@/core/components/media/components/focus/subtitle/FocusReaderSubtitle'
import { getOS } from '@/App'
import classnames from 'classnames'
import FocusTheaterSubtitle from '@/core/components/media/components/focus/subtitle/FocusTheaterSubtitle'
import FocusCinemaSubtitle from '@/core/components/media/components/focus/subtitle/FocusCinemaSubtitle'
import useFocusSettings from '../useFocusSettings'

export default memo(() => {
  const os = getOS()
  const layout = useFocusSettings()[0].layout
  if (layout === 'reader') {
    return (
      <div
        style={{
          gridTemplateColumns: '1fr minmax(0, min(660px, 48%)) 1fr'
        }}
        className={'grid w-full h-full flex-1 overflow-hidden'}
      >
        <div className={classnames('p-7 w-full', os === 'macos' && 'pt-12')}>
          <FocusVideoPlayer mode={'reader'} />
        </div>
        <FocusReaderSubtitle
          subtitleClassName={'px-12 mt-6 group relative'}
          className={'pt-8 pb-40 md:text-[18px] xl:text-[20px]'}
          style={{
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        />
      </div>
    )
  }
  if (layout === 'theater') {
    return (
      <div className={'flex flex-col p-12 pb-20 w-full justify-center items-center h-full'}>
        <FocusVideoPlayer mode={layout} />
        <FocusTheaterSubtitle />
      </div>
    )
  }

  if (layout === 'cinema') {
    return (
      <div className={'relative w-full h-full'}>
        <FocusVideoPlayer mode={'cinema'} />
        <FocusCinemaSubtitle />
      </div>
    )
  }
})
