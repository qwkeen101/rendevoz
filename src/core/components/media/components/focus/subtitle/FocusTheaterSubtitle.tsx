import useMediaSubtitle from '@/core/components/media/components/focus/subtitle/useMediaSubtitle'
import { Icon } from '@/components'
import useFocusSettings from '../useFocusSettings'

export default () => {
  const { currentSubtitle } = useMediaSubtitle()
  const mode = useFocusSettings()[0].subtitleMode
  if (!currentSubtitle) return null
  if (mode === 'none') {
    return (
      <div className='theater-subtitle flex items-center justify-center'>
        <Icon size={32} name='custom-CCDisabled' className='text-red-500 opacity-80' />
      </div>
    )
  }
  if (mode === 'translated') {
    return <div className='theater-subtitle'>{currentSubtitle.translation}</div>
  }
  if (mode === 'original') {
    return <div className='theater-subtitle subtitle-common' dangerouslySetInnerHTML={{ __html: currentSubtitle.text }}></div>
  }
  if (mode === 'both') {
    return (
      <div className='theater-subtitle both subtitle-common'>
        <div dangerouslySetInnerHTML={{ __html: currentSubtitle.text }}></div>
        <div
          style={{
            fontSize: '0.87em',
            opacity: 0.7,
            marginTop: 4
          }}
        >
          {currentSubtitle.translation}
        </div>
      </div>
    )
  }
}
