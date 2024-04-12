import * as Parks from '@icon-park/react/es/map'
import { memo, useMemo } from 'react'
import { IconPicker } from '@/components'

const camelToKebabCase = (text: string) => {
  return text.split(/(?=[A-Z])/).map(i => i.toLowerCase()).join('-')
}
export default memo(() => {
  const names = useMemo(() => {
    const keys = Object.keys(Parks)
    console.log(keys)
    return keys.map(i => 'park-' + camelToKebabCase(i))
  }, [])
  console.log(names)
  return <IconPicker icons={names} />
})
