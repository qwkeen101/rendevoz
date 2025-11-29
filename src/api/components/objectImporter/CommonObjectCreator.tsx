import { Icon } from '@/components'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { MetaObject } from '~/typings'
import { Icons, KEY } from '@/consts'
import ObjectCreatorEmptyCard from '@/api/components/objectImporter/ObjectCreatorEmptyCard'

export default memo(
  ({
    onCreate,
    onClose,
    onUpload
  }: {
    onCreate: (type: MetaObject['type']) => void
    onClose: VoidFunction
    onUpload: (type: 'baidu' | 'url' | 'file') => void
  }) => {
    const { t } = useTranslation()
    return (
      <div
        className={'flex select-none p-8 pt-7 justify-center'}
        style={{
          width: 'min(800px, 90vw)'
        }}
      >
        <div className={'flex flex-col relative items-center'} style={{ width: 'min(800px, 90vw)' }}>
          <div className={'w-full text-xl font-medium mb-6'}>{t('general.New file')}</div>
          <Icon name={Icons.Close} size={14} strokeWidth={6} onClick={onClose} className={'absolute hover-active-button top-0 right-0'} />
          <div className={'grid w-full grid-cols-3 gap-5'}>
            <ObjectCreatorEmptyCard.Note onClick={() => onCreate('note')} />
            <ObjectCreatorEmptyCard.Group onClick={() => onCreate('group')} />
            <ObjectCreatorEmptyCard.Whiteboard onClick={() => onCreate('whiteboard')} />
            <ObjectCreatorEmptyCard.Chat onClick={() => onCreate('chat')} />
            <ObjectCreatorEmptyCard.Exam onClick={() => onCreate('exam')} />
          </div>
          <div className={'mt-8 mb-4 transparent-font w-full font-medium'}>{t('general.Others')}</div>
          <div className={'grid w-full grid-cols-3 gap-5'}>
            <ObjectCreatorEmptyCard.FileImporter onClick={() => onUpload('file')} />
            <ObjectCreatorEmptyCard.URLImporter onClick={() => onUpload('url')} />
            <ObjectCreatorEmptyCard.BaiduImporter onClick={() => onUpload('baidu')} />
          </div>
        </div>
      </div>
    )
  }
)
