import { useWhiteboardNodes } from '@/core/components/whiteboard/hooks'
import { useEffect, useState } from 'react'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'

const WhiteboardEmptyIndicator = () => {
  const allNodes = useWhiteboardNodes()
  const [showIndicator, setShowIndicator] = useState(false)
  const { t } = useTranslation()
  useEffect(() => {
    if (allNodes.size) {
      setShowIndicator(false)
    } else {
      setShowIndicator(true)
    }
  }, [allNodes.size])

  return (
    <div
      style={{
        zIndex: 100,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        pointerEvents: 'none',
        opacity: showIndicator ? 1 : 0,
        padding: '40px',
        border: `4px solid ${Colors.Background.Border}`,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'opacity 0.3s ease',
        textTransform: 'uppercase',
        fontWeight: 600,
        background: Colors.Background.ButtonHover,
        gap: 10
      }}
    >
      <div>{t('general.whiteboard indicator 1')}</div>
    </div>
  )
}

export default WhiteboardEmptyIndicator
