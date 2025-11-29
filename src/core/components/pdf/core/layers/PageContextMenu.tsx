import { Button, WithBorder } from '@/components'
import { Icons } from '@/consts'
import React from 'react'
import { useTranslation } from 'react-i18next'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'

export default ({ onClose, pageIndex }: { onClose: VoidFunction; pageIndex: number }) => {
  const instance = usePDFInstance()
  const { t } = useTranslation()
  return (
    <WithBorder className={'p-1 min-w-52'}>
      <Button.IconButton
        icon="park-translate"
        text={t('pdf.Translate this page')}
        onClick={e => {
          onClose()
          instance.getTextContent(pageIndex).then(text => {
            Global.commonOps?.translate?.({
              e,
              query: text,
              targetChatId: instance.aiOps?.getActiveChatId(),
              source: {
                type: 'pdf',
                objectId: instance.getId(),
                page: pageIndex,
                selectedText: text,
                wholePage: true
              }
            })
          })
        }}
      />
      <Button.IconButton
        icon={Icons.Explain}
        text={t('pdf.Explain this page')}
        onClick={e => {
          onClose()
          instance.getTextContent(pageIndex).then(text => {
            Global.aiOps?.explain?.({
              e,
              targetChatId: instance.aiOps?.getActiveChatId(),
              query: text,
              source: {
                type: 'pdf',
                objectId: instance.getId(),
                page: pageIndex,
                selectedText: text,
                wholePage: true
              }
            })
          })
        }}
      />
    </WithBorder>
  )
}
