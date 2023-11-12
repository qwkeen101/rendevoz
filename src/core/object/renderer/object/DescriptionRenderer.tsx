import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import { CSSProperties } from 'react'

export type DescriptionRendererProps = {
  descriptionClassName?: string
  style?: CSSProperties
  ellipsisLine?: number
}
export default ({
  ellipsisLine = 4,
  descriptionClassName = css([ClassName.description('13px'), ellipsisLine ? ClassName.ellipsisFont(ellipsisLine) : undefined]),
  style,
  description
}: DescriptionRendererProps & {
  description?: string
}) => {
  if (description) {
    return (
      <div className={descriptionClassName} style={{ ...style, textTransform: 'none' }}>
        {description}
      </div>
    )
  }
  return null
}
