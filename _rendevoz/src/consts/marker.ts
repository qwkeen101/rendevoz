import { Colors } from "@/components/picker";

const ColorPickerColors = Colors.map((i) => i[4]);

export const MarkerColor = {
  EMPHASIS: '#FFD95A',
  NORMAL: '#8590ae',
  LIGHTGREY: '#c9c9c9',
  HIDEN: '#99999912',
  ...ColorPickerColors
}
