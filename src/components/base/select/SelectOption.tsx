import { FC, ReactElement } from 'react'

export type SelectOptionProps =
  | {
      children: string
      value: string | number
      icon?: string
      image?: string
      suffix?: string
    }
  | boolean

const SelectOption: FC<SelectOptionProps> = () => {
  return null
}
export default SelectOption
