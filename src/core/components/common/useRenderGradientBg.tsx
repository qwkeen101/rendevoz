import { Colors } from '@/consts'

export default (color: string) => {
  const adaptColor = Colors.getAdaptColor(color)
  const renderMain = () => {
    if (!color) return null
    return (
      <div
        className={'light:hidden'}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          display: 'block',
          backgroundColor: adaptColor,
          backgroundImage: 'linear-gradient(transparent 0,rgba(0,0,0,.5) 100%)'
        }}
      ></div>
    )
  }
  const renderSub = () => {
    if (!color) return null
    return (
      <div
        style={{
          width: '100%',
          height: 240,
          top: 0,
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          background: `linear-gradient(color-mix(in hsl, ${adaptColor}, black 55%), transparent)`
        }}
      ></div>
    )
  }

  return {
    renderMain,
    renderSub,
    mainHeight: 'clamp(186px,186px + (100cqw - 600px)/424*90,276px)'
  }
}
