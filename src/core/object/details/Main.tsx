import { CollectionStore, MetaStore, ObjectStore } from '@/api/stores'
import { AnimatePopover, Button, Content, IconWithPopover, TabPane, Tabs, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { AttachmentWrapper, InlineObject, ObjectActionMenu } from '@/core'
import { RelatedPanel } from '@/core/object/details/Related'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import Tag from '@/core/object/ObjectTag'
import LabelDetailsRenderer from '@/core/object/renderer/LabelDetailsRenderer'
import MetaPropDisplayer from '@/core/object/renderer/properties/MetaPropDisplayer'
import ParentItems from '@/core/object/details/ParentItems'
import Backlinks from '@/core/object/details/Backlinks'
import classnames from 'classnames'
import { useDebounceEffect } from '@/hooks'
import { DateFormat } from '@/utils'
import { Tab } from '@/components/base/tabs'
import { Colors } from '@/consts'
import trans from '@/consts/trans'
import { useEffect, useLayoutEffect, useState } from 'react'
import calculateContains from '@/core/object/objectList/calculateContains'
import gotoContainedObject from '@/core/object/gotoContainedObject'
import Flashcard from '@/core/object/details/Flashcard'
import { ICollection } from '~/typings'
import useHomeConfig from '@/scenes/home/useHomeConfig'
const SectionClass = 'mb-2 select-none transparent-font font-size-12 flex items-center'
const MetaMainDetails = ({ metaId, visible }: { metaId: number; visible?: boolean }) => {
  const object = MetaStore.useValue(metaId)
  const metaObject = object
  const target = ObjectStore(object?.type).useValue(object?.objectId)
  const url = target && 'url' in target ? target.url : ''
  const metas = MetaStore.useMetaObjectsMap()
  const [contains, setContains] = useState<number[]>([])
  const [related, setRelated] = useState<number>()
  const [atts, setAtts] = useState<number>()
  const [appearIns, setAppearIns] = useState<number>()
  const flashcard = ObjectStore('reviewCard').useValue(object?.review)
  const calculateContain = () => {
    const m = MetaStore.getCachedMetaObject(metaId)
    if (m && visible) {
      setAtts(m.attachments?.map(i => MetaStore.getCachedMetaObject(i.id))?.filter(i => i && !i.deleted)?.length)
      calculateContains(m).then(res => {
        if (res) {
          setContains(res.map(i => i.id))
        } else {
          setContains([])
        }
      })
    }
  }
  useEffect(() => {
    calculateContain()
  }, [metaId, visible])
  useDebounceEffect(
    () => {
      calculateContain()
    },
    [metas.size],
    { wait: 1000 }
  )
  const { t } = useTranslation()
  const [active, setActive] = useState('details')
  useLayoutEffect(() => {
    if (active === 'flashcard' && !flashcard) {
      setActive('details')
    }
  }, [flashcard])
  if (!object)
    return (
      <div className={'min-h-80 w-full transparent-font font-semibold flex items-center justify-center'}>
        <div>{t('general.Object not exist')}</div>
      </div>
    )

  return (
    <Content flex column fullHeight>
      <div className={'flex items-center gap-2 relative'}>
        {object?.coverImgSrc && (
          <>
            <div className={'w-40 shrink-0 h-40'}>
              <img
                src={object.coverImgSrc}
                onClick={() => {
                  Global.commonOps?.previewImage?.(object!.coverImgSrc!)
                }}
                style={{
                  borderColor: Colors.Background.Popover
                }}
                className={'rounded-full cursor-pointer z-20 absolute left-6 top-2 w-36 shadow-lg border-4 border-solid h-36 object-cover'}
              />
            </div>
          </>
        )}
        <Content className={'px-6 pt-3'} flex column auto gap={5} justifyContent={'center'}>
          {metaObject?.type?.includes('Label') ? (
            <div className={'w-full mb-2'}>
              <LabelDetailsRenderer
                disableSidebar
                showImage={false}
                showVideo={false}
                showAudio={false}
                showQuestion={false}
                metaId={metaId}
                style={{
                  border: '1px solid var(--border-background)',
                  borderRadius: 8
                }}
              />
            </div>
          ) : (
            <div>
              <div className={classnames('font-semibold line-clamp-2 text-xl', !metaObject?.name && 'super-transparent-font')}>
                {metaObject?.name || t('general.Unnamed')}
              </div>
              {metaObject?.description && <div className={'line-clamp-2 font-size-13 mt-1'}>{metaObject.description}</div>}
            </div>
          )}
          {metaObject && (
            <div className={'transparent-font font-size-13'}>
              {Global.utils.getTypeName(metaObject.type)} · {t('general.Created at')}{' '}
              {DateFormat.format(metaObject.createdAt, DateFormat.Formats.yearMonthDays)}
            </div>
          )}
        </Content>
      </div>
      <div className={'w-full grow px-6'}>
        <Tabs
          tabNavMode={'underline'}
          tabNavClassname={'shrink-0 !px-4 !pb-2 !pt-2'}
          activeKey={active}
          onTabClick={k => setActive(k)}
          tabNavLeftClassName={'!flex-nowrap'}
          tabNavContainerClassname={
            'no-scrollbar w-full shrink-0 overflow-x-auto capitalize font-medium !justify-normal z-10 border-bottom mt-3'
          }
        >
          <TabPane className={'pt-3 pb-6 flex min-h-60 flex-col gap-4'} tab={<Tab text={t('general.Overview')} />} key={'details'}>
            {url && (
              <div>
                <div className={SectionClass}>{t(trans.URL)}</div>
                <div
                  onClick={() => {
                    Global.utils.openSpecificURL(url)
                  }}
                  className={'break-all hover:underline cursor-pointer line-clamp-1'}
                >
                  {Global.utils.formatURL(url)}
                </div>
              </div>
            )}
            <ParentFolder id={metaId} />
            <ParentItems metaId={metaId} className={SectionClass} />
            <div>
              <div className={SectionClass}>{t('general.Tags')}</div>
              <AnimatePopover
                positions={['bottom', 'top']}
                align={'start'}
                padding={6}
                withClickCover
                content={
                  <WithBorder>
                    <MetaTagPicker
                      style={{
                        flexShrink: 0,
                        borderRadius: 8
                      }}
                      alreadyTags={object?.tags || []}
                      onChange={tags => {
                        MetaStore.updateMetaObject({ id: metaId, tags })
                      }}
                    />
                  </WithBorder>
                }
              >
                <div className={'gap-1.5 flex flex-wrap cursor-pointer w-full'}>
                  {object.tags?.length ? (
                    object.tags?.map(i => <Tag square hideDelete tag={i} key={i} />)
                  ) : (
                    <Button.IconButton
                      icon={'park-plus'}
                      className={'transparent-font min-w-44'}
                      text={`${t('general.Add tags')}`}
                    ></Button.IconButton>
                  )}
                </div>
              </AnimatePopover>
            </div>
            <div>
              <div className={SectionClass}>{t('general.Properties')}</div>
              <div className={'w-full'}>
                <MetaPropDisplayer metaId={metaId} showAddPropPlaceholder={true} />
              </div>
            </div>
          </TabPane>
          {flashcard ? (
            <TabPane className={'pt-3 pb-6 flex min-h-60 flex-col gap-4'} key={'flashcard'} tab={t('general.Flashcard')}>
              <Flashcard {...flashcard} metaId={metaId} />
            </TabPane>
          ) : null}
          <TabPane
            className={'pt-3 pb-6 flex flex-col min-h-60 gap-1.5'}
            key={'contains'}
            tab={contains.length ? <Tab count={contains.length} text={t('general.Includes')} /> : null}
          >
            {contains.map(i => (
              <InlineObject
                id={i}
                key={i}
                onClick={() => {
                  if (metaObject) {
                    gotoContainedObject(metaObject.id, i)
                  }
                }}
              />
            ))}
          </TabPane>
          <TabPane
            mount
            className={'py-3'}
            key={'appear in'}
            tab={appearIns ? <Tab text={t('general.Appear in')} count={appearIns} /> : null}
          >
            <Backlinks onChange={v => setAppearIns(v)} className={SectionClass} metaId={metaId} visible={visible} />
          </TabPane>
          <TabPane mount className={'py-3'} tab={<Tab text={t('general.related')} count={related} />} key={'related'}>
            <RelatedPanel onRelatedChange={r => setRelated(r)} metaId={metaId} />
          </TabPane>
          <TabPane className={'pt-3 pb-6'} tab={<Tab text={t('general.Attachments')} count={atts} />} key={'att'}>
            <AttachmentWrapper showField={false} visible={true} maxVisibleAttachments={10} metaId={metaId} />
          </TabPane>
        </Tabs>
      </div>
    </Content>
  )
}

const ParentFolder = ({ id }: { id: number }) => {
  const parent = CollectionStore.useParentCollection(id)
  console.log(parent)
  const { t } = useTranslation()
  if (parent?.size) {
    const collections = Array.from(parent.values())
      .map(i => CollectionStore.getCachedCollectionById(i))
      .filter(i => i && !i.deleted) as ICollection[]
    if (!collections.length) return null
    return (
      <div>
        <div className={SectionClass}>{t('general.Location')}</div>
        <div className={'flex flex-col gap-1.5'}>
          {collections.map(i => {
            const parents = CollectionStore.findParentCollections(i.id)
            if (parents) {
              const joined = parents.map(i => i.name || t(trans.Unnamed)).join('/')
              return (
                <div
                  onClick={() => {
                    useHomeConfig.update(c => ({ ...c, breadcrumbsFutureStack: [], breadcrumbs: parents.map(i => i.id) }))
                    Global.layoutOps?.openPage('home')
                  }}
                  className={'hover:underline cursor-pointer w-fit'}
                  key={i.id}
                >
                  {joined}
                </div>
              )
            }
            return null
          })}
        </div>
      </div>
    )
  }
}
export default MetaMainDetails
