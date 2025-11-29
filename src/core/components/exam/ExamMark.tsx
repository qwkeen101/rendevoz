import { CSSProperties } from 'react'

export default ({ mark, size = 32, style }: { mark: number | string; size: number; style?: CSSProperties }) => {
  return (
    <div className={'text-red-500 select-none flex flex-col'} style={{ fontFamily: 'Caveat', fontWeight: 600, height: size, fontSize: size, ...style }}>
      <div style={{ lineHeight: 0.8 }}>{mark}</div>
      <div className={'mark-slash-one'}>/</div>
      <div className={'mark-slash-two'}>/</div>
    </div>
  )
}
