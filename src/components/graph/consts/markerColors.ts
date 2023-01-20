import { Colors } from '@/components/picker/colorPicker'

const ColorPickerColors = Colors.map(i => i[3])

export const MarkerColor = {
  EMPHASIS: '#7743DB',
  NORMAL: '#8590ae',
  HIDEN: '#99999912',
  ...ColorPickerColors
}
