import { ObjectStore } from '@/api/stores'
import { Content, Footer, Modal } from '@/components'
import { memo, useEffect, useState } from 'react'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { assignProperties } from '@/utils'
import { useTranslation } from 'react-i18next'
import BorderInput from '@/components/base/BorderInput'
import { IFeedCollection } from '~/typings'

export default memo(() => {
  const [id, setId] = useState<number>()
  const [innerCollection, setInnerCollection] = useState<IFeedCollection>()
  const [visible, setVisible] = useState(false)
  const instance = useFeedInstance()
  const { t } = useTranslation()
  useEffect(() => {
    if (id) {
      ObjectStore('feedCollection')
        .getOneById(id)
        .then(res => {
          setInnerCollection(res)
        })
    }
  }, [id])
  assignProperties(instance, {
    editFeed: id => {
      setVisible(true)
      setId(id)
    }
  })
  return (
    <Modal visible={!!(visible && innerCollection)} onClose={() => setVisible(false)}>
      <div className={'p-6 flex flex-col gap-6 max-w-lg w-[90vw]'}>
        <div className={'font-bold text-xl'}>{t('feed.Edit feed details')}</div>
        <BorderInput
          placeholder={t('general.name')}
          style={{ padding: '8px 12px' }}
          value={innerCollection?.name}
          className={'font-size-13'}
          onChange={v => {
            setInnerCollection(s => ({ ...s, name: v }))
          }}
        />
        <BorderInput
          placeholder={'URL'}
          style={{ padding: '8px 12px' }}
          value={innerCollection?.feedUrl}
          className={'font-size-13'}
          onChange={v => {
            setInnerCollection(s => ({ ...s, feedUrl: v }))
          }}
        />
        <Footer
          onSubmit={() => {
            id && ObjectStore('feedCollection').updateOne({ id, ...innerCollection })
            setVisible(false)
          }}
          onBack={() => {
            setVisible(false)
          }}
        />
      </div>
    </Modal>
  )
})
