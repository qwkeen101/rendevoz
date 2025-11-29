import { CollectionStore, MetaStore, ObjectStore } from '@/api/stores'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { AnimatePopover, WithBorder, Button, Icon } from '@/components'
import NoResult from '@/core/components/common/NoResult'
import Tag from '@/core/object/ObjectTag'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import { useMeasure } from 'react-use'
import { Icons } from '@/consts'
import { DateFormat } from '@/utils'
import useRenderSidebarAttachments from '@/core/object/renderer/useRenderSidebarAttachments'
import { InlineObject } from '@/core'

export default memo(({ id }: { id: number }) => {
  const meta = MetaStore.useValue(id)
  const { t } = useTranslation()
  const [ref, { width }] = useMeasure()
  const [showAtts, setShowAtts] = useState(false)
  const { renderContainer, selectedMeta, attMetas, selected, setSelected } = useRenderSidebarAttachments(id)
  if (!meta) {
    return (
      <div className={'h-full flex flex-col'}>
        <NoResult />
      </div>
    )
  }
  if (showAtts || selected) {
    return (
      <div className={'flex flex-col w-full h-full'}>
        <div className={'flex items-center font-medium p-2 gap-2'}>
          <Icon
            onClick={() => {
              if (selected) {
                setSelected(undefined)
                return
              }
              setShowAtts(false)
            }}
            size={16}
            name={'park-arrow-left'}
            strokeWidth={4.5}
            className={'square-button transparent-icon'}
          />
          <div className={'line-clamp-1 mr-2'}>{selectedMeta?.name || t('general.Attachments')}</div>
        </div>
        {renderContainer()}
      </div>
    )
  }
  return (
    <div className={'flex flex-col h-full py-4 overflow-y-auto'}>
      <div className={'px-5'}>
        <div className={'menu-sub-title mb-2'}>{t('general.Created at')}</div>
        <div className={'font-size-13'}>
          {DateFormat.format(meta.createdAt, DateFormat.Formats.yearMonthDays)}{' '}
          {DateFormat.format(meta.createdAt, DateFormat.Formats.minute)}
        </div>
        <Properties id={meta.id} objectId={meta.objectId} type={meta.type} />
        <div ref={ref} className={'menu-sub-title mb-1 mt-5'}>
          {t(trans.Tags)}
        </div>
        <AnimatePopover
          align={'start'}
          positions={['bottom', 'top']}
          content={
            <WithBorder width={width}>
              <MetaTagPicker
                style={{ maxWidth: undefined, width: '100%' }}
                alreadyTags={meta.tags}
                onChange={v => MetaStore.updateMetaObject({ id, tags: v })}
              />
            </WithBorder>
          }
        >
          <div
            style={{
              '--placeholder': `"${t('general.Select tags')}"`
            }}
            className={
              'flex w-full font-size-13 gap-2 cursor-pointer items-center p-2 empty-placeholder transition-colors -ml-2 light-hover rounded-lg flex-wrap'
            }
          >
            {meta.tags?.map(i => <Tag tag={i} key={i} square small />)}
          </div>
        </AnimatePopover>
        {attMetas?.length ? (
          <>
            <div onClick={() => setShowAtts(true)} className={'menu-sub-title mb-2 mt-5 cursor-pointer'}>
              {t('general.Attachments')}
            </div>
            <div className={'flex flex-col gap-2'}>
              {attMetas.map(i => (
                <InlineObject
                  onClick={() => {
                    setSelected(i.id)
                  }}
                  id={i.id}
                  key={i.id}
                />
              ))}
            </div>
          </>
        ) : null}
        {meta.description && (
          <>
            <div className={'menu-sub-title mb-2 mt-5'}>{t(trans.Description)}</div>
            <div className={'font-size-13 whitespace-pre-wrap'}>{meta.description}</div>
          </>
        )}
        <div className={'menu-sub-title mb-2 mt-5'}>{t('general.Actions')}</div>
        <div className={'-ml-2.5'}>
          <Button.IconButton onClick={() => Global.metaOps.openDetails?.(id)} text={t(trans.Meta.ViewDetails)} icon={Icons.Info} />
          <Button.IconButton onClick={() => Global.metaOps.edit?.(id)} text={t(trans.Edit)} icon={Icons.Edit} />
          <Button.IconButton onClick={() => setShowAtts(true)} text={t('general.Manage attachments')} icon={'park-file-editing-one'} />
          <Button.IconButton onClick={() => Global.metaOps.quickAdd?.(id)} text={t(trans.Meta.MoveTo)} icon={Icons.MoveTo} />
          <Button.IconButton onClick={() => Global.metaOps.copyLink(id)} text={t(trans.CopyLink)} icon={Icons.Link} />
          <Button.IconButton
            onClick={() => MetaStore.deleteMetaObject(id)}
            className={'text-red-500'}
            text={t(trans.Delete)}
            icon={Icons.Delete}
          />
        </div>
      </div>
    </div>
  )
})

const Properties = ({ id, objectId, type }: { id: number; type: string; objectId?: number }) => {
  return (
    <>
      {objectId && <URLRenderer id={objectId} type={type} />}
      <FolderPathRenderer id={id} />
    </>
  )
}
const URLRenderer = ({ type, id }: { type: string; id: number }) => {
  const object = ObjectStore(type).useValue(id)
  if (object && 'url' in object && object.url) {
    return (
      <>
        <div className={'menu-sub-title mt-5 mb-2'}>URL</div>
        <div
          onClick={() => {
            Global.utils.openSpecificURL(object.url)
          }}
          className={'line-clamp-2 break-all font-size-13 cursor-pointer hover:underline'}
        >
          {Global.utils.formatURL(object.url)}
        </div>
      </>
    )
  }
}

const FolderPathRenderer = ({ id }: { id: number }) => {
  const collections = CollectionStore.useAll()
  const { t } = useTranslation()
  const path = useMemo(() => {
    const parents = CollectionStore.getParentCollections(id)
    if (parents.length) {
      return parents.map(i => ({
        path: CollectionStore.buildPath(i),
        key: i
      }))
    }
  }, [collections, id])
  if (path?.length) {
    return (
      <>
        <div className={'menu-sub-title mt-5 mb-2'}>{t('general.Location')}</div>
        {path.map(i => (
          <Button.IconButton
            text={i.path}
            icon={Icons.Folder}
            className={'-ml-2.5'}
            onClick={() => {
              CollectionStore.openCollection(i.key)
            }}
            key={i.key}
          ></Button.IconButton>
        ))}
      </>
    )
  }
}
