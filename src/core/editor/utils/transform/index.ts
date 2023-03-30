import { BlockTransform } from './block'
import { SelectionTransform } from './selection'

export const CustomTransforms = {
  ...BlockTransform,
  ...SelectionTransform
}
