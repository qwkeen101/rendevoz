import { Noop } from '@/common/types'

export interface IForm<T> {
  onBack?: Noop
  onSubmit?: (obj: Partial<T>) => void
  initialObject?: Partial<T>
}

export interface FormState {
  mainVisible?: boolean
  colorPickerVisible?: boolean
  iconPickerVisible?: boolean
  tagPickerVisible?: boolean
}
