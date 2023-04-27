import { useGlobalAtom, useGlobalAtomValue, useToggle } from '@/hooks'
import { GlobalScreenShotOcrResult } from '.'
import { Button, Content, Icon } from '@/components'
import Colors from '@/consts/colors'
import { atom } from 'jotai'
import { useEffect } from 'react'
import TranslateService from '@/services/translate.service'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'

const ScreenShotTranslateResult = atom<string | undefined>(undefined)
const ScreenShotOcr = ({ draggable, onToggleDraggable }: { draggable: boolean; onToggleDraggable: VoidFunction }) => {
  const ocrResult = useGlobalAtomValue(GlobalScreenShotOcrResult)
  const [translateResult, setTranslateResult] = useGlobalAtom(ScreenShotTranslateResult)
  const [showTranslate, toggleShowResult] = useToggle(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (!ocrResult) {
      setTranslateResult(undefined)
    }
  }, [ocrResult])
  const renderContent = () => {
    if (showTranslate) {
      return translateResult
    }
    if (ocrResult === 'loading') {
      return (
        <>
          <Icon name="park-loading-four" spin size={18} />
          <div>Loading...</div>
        </>
      )
    }

    if (ocrResult === undefined) {
      return <div>No Image</div>
    }
    return ocrResult
  }
  return (
    <Content
      flex
      centered
      column
      gap={6}
      style={{
        padding: '4px 12px',
        borderRadius: 8,
        width: 'max-content',
        maxWidth: 500,
        userSelect: draggable ? 'none' : 'text',
        textTransform: 'none',
        background: Colors.Background.ButtonHover
      }}
    >
      {ocrResult && ocrResult !== 'loading' && (
        <Content flex column fullWidth gap={6}>
          <div className={ClassName.title('1rem')}>Ocr Result</div>
          <Content fullWidth flex gap={6}>
            <Button.IconButton icon="park-move-one" selected={draggable} onClick={onToggleDraggable} text={t('general.move')} />
            {ocrResult && (
              <Button.IconButton
                onClick={async () => {
                  toggleShowResult()
                  if (!translateResult) {
                    const result = await TranslateService.translate(ocrResult, 'zh')
                    setTranslateResult(result.result.join(''))
                  }
                }}
                icon={showTranslate ? 'park-return' : 'park-translate'}
                text={showTranslate ? t('general.return') : t('general.translate')}
              />
            )}
            <Button.IconButton
              icon="park-copy"
              text={t('general.copy')}
              onClick={() => {
                if (showTranslate) {
                  translateResult && navigator.clipboard.writeText(translateResult)
                } else {
                  ocrResult && navigator.clipboard.writeText(ocrResult)
                }
              }}
            />
          </Content>
        </Content>
      )}
      {renderContent()}
    </Content>
  )
}

export default ScreenShotOcr
