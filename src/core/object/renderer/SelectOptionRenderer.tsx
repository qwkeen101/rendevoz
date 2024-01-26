import { CSSProperties, memo } from 'react'
import { ObjectStore } from '@/api/stores'
import { Colors } from '@/consts'
import { css } from '@emotion/css'
import classNames from 'classnames'

const clazz = css({
  padding: '0px 6px',
  fontSize: 14,
  borderRadius: 3,
  lineHeight: '20px',
  width: 'fit-content',
  height: 'fit-content',
  whiteSpace: 'pre-wrap'
})
export default memo(({ id, style, className }: { id: number; style?: CSSProperties; className?: string }) => {
  const option = ObjectStore('metaPropSelectOption').useValue(id)
  if (!option) return null
  return (
    <div
      className={classNames(clazz, className)}
      style={{
        color: Colors.getAdaptFontColor(option.color),
        background: Colors.getAdaptColor(option.color) || Colors.Background.ButtonHover,
        ...style
      }}
    >
      {option.name}
    </div>
  )
})
