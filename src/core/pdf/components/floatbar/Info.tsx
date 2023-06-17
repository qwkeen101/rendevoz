import { Content, Icon } from '@/components'
import { AttachmentWrapper, GlobalGraphInstance } from '@/core'
import { relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import { globalStore, MetaStore } from '@/stores'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import { useAtomValue } from 'jotai/react'
import { memo } from 'react'
import FontSize from '@/consts/font'
import { useTranslation } from 'react-i18next'
import usePdfState from '../../hooks/usePdfState'

const PdfInfo = () => {
  const { t } = useTranslation()
  const [pdfState] = usePdfState()
  const { document } = pdfState
  const pdfMeta = MetaStore.useObjectToMetaValue(pdfState.pdfId || 0)

  return (
    <div style={{ width: 300, padding: 7, fontFamily: 'Muli', fontSize: FontSize['13px'] }}>
      <div style={{ marginBottom: 16 }} className={ClassName.title()}>
        {t('general.pdf info')}
      </div>
      <div>
        <div style={{ flex: '0 0 100px' }}>{t('general.title')}</div>
        <div>{document?.metadata?.title || 'Untitled'}</div>
      </div>
      <Content>
        <div style={{ flex: '0 0 100px' }}>{t('general.author')}</div>
        <div>{document?.metadata?.author || 'Unknown'}</div>
      </Content>
      <AttachmentWrapper style={{ marginTop: 20 }} visible maxVisibleAttachments={6} metaId={pdfMeta?.id}></AttachmentWrapper>
    </div>
  )
}

export default memo(PdfInfo)
