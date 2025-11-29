import { Noop } from '@/common/types'
import { PartialWithId } from '@/types'

export interface IForm<T> {
  onBack?: Noop
  onSubmit?: (obj: PartialWithId<T>) => void
  initialObject?: Partial<T>
}

export interface FormState {
  mainVisible?: boolean
  colorPickerVisible?: boolean
  iconPickerVisible?: boolean
  tagPickerVisible?: boolean
}
