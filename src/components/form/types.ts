import { Noop } from '@/common/types'

export interface IForm<T> {
  onBack?: Noop
  onSubmit?: (obj: Partial<T>) => void
  initialObject?: Partial<T>
}
