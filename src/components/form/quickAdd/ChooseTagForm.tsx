import MetaTagPicker from '@/core/object/MetaTagPicker'
import { memo, useEffect, useState } from 'react'
import { FormFooter } from '@/components'
import { MetaStore } from '@/api/stores'

export default memo(({ onChange, onClose, metaId }: { onChange: (ids: number[]) => void; onClose: VoidFunction; metaId?: number }) => {
  const [tags, setTags] = useState<number[]>([])
  useEffect(() => {
    if (metaId) {
      setTags(MetaStore.getCachedMetaObject(metaId)?.tags || [])
    }
  }, [metaId])
  return (
    <>
      <MetaTagPicker
        style={{
          minHeight: 'min(340px, 90vh)',
          maxHeight: '80vh',
          width: '100%'
        }}
        inputClassName={'bg-third !py-2'}
        alreadyTags={tags || []}
        onChange={v => {
          setTags(v)
        }}
      />
      <FormFooter
        onConfirm={() => {
          onChange(tags)
        }}
        className={'p-4 border-top'}
        canConfirm={metaId ? true : tags.length > 0}
        onCancel={onClose}
      />
    </>
  )
})
