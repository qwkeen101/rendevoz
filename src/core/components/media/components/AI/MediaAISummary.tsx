import useMediaState from '@/core/components/media/hooks/useMediaState'

export default () => {
  const [mediaState, setMediaState] = useMediaState()
  if (mediaState.aiSummary) {
  }
}
