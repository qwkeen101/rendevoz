import { useTheme } from '@/hooks'

const useCardBorder = (borderColor: 'grey' | 'cream') => {
  const { defaultBorderColorCream, defaultBorderColorGrey } = useTheme('defaultBorderColorCream', 'defaultBorderColorGrey')
  let border
  switch (borderColor) {
    case 'grey':
      border = defaultBorderColorGrey
      break
    case 'cream':
      border = defaultBorderColorCream
      break
  }
  return border
}
export default useCardBorder
