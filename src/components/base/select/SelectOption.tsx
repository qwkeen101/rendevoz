import { FC } from 'react'

export type SelectOptionProps =
  | {
      children: string
      value: string
      icon?: string
    }
  | boolean

const SelectOption: FC<SelectOptionProps> = () => {
  return null
}
export default SelectOption
