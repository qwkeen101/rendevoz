import useMediaSubtitle from '@/core/components/media/components/focus/subtitle/useMediaSubtitle'

export default () => {
  const { currentSubtitle } = useMediaSubtitle()

  if (currentSubtitle) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: currentSubtitle.text
        }}
        className={'cinema-subtitle subtitle-common'}
        style={{
          position: 'absolute',
          bottom: 90,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: 12
        }}
      ></div>
    )
  }
}
