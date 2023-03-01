import { memo } from 'react'

const SvgFilters = {
  pathDropShadow: 'pathDropShadow'
}

export const getSvgFilter = (filter: keyof typeof SvgFilters) => {
  return SvgFilters[filter]
}
const SvgFilter = () => {
  return (
    <>
      <filter id={getSvgFilter('pathDropShadow')} x="-2" y="-2" width={200} height={200}>
        <feGaussianBlur stdDeviation={1} />
      </filter>
    </>
  )
}

export default memo(SvgFilter)
