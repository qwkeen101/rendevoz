import { useSelectAtomValue } from '@/hooks'
import { MediaStateAtom } from '@/core/components/media/hooks/useMediaState'

export default () => {
  const url = useSelectAtomValue(MediaStateAtom, s => s.url)
  return url
}
