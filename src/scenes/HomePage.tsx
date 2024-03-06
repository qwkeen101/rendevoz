import { AnimatePopover, Button, Icon, IconWithPopover, WithBorder } from '@/components'
import { FC, useMemo, useState } from 'react'
import { Components } from 'rendevoz'
import { GlobalInstance, useGlobalAtomValue, useToggle } from '@/hooks'
import { useTranslation } from 'react-i18next'
import TabTitle from '@/components/layout/TabTitle'
import { ClassName } from 'rendevoz'
import { undeletedMetaObjectsAtom } from '@/api/stores/meta/meta.store'
import { MetaObject } from '~/typings'
import Select from '@/components/base/select'
import DateFormat from '@/utils/dateFormat'
import { css } from '@emotion/css'
import { motion } from 'framer-motion'
import { DraggableElement, ObjectActionPopover } from '@/core'
import { Zindexes } from '@/consts'
import Colors from '@/consts/colors'
import { atom, useAtomValue } from 'jotai'
import fuzzysort from 'fuzzysort'
import { Rendevoz } from '@/core/rendevoz'
import HomeGallery from '@/scenes/home/HomeGallery'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import GalleryConfig from '@/scenes/home/GalleryConfig'
import { CollectionStore, MetaStore } from '@/api/stores'
import RecycleBin from '@/core/components/recycleBin'
import Workspace from '@/api/common/workspace'
import { request } from '@/utils/request'

const { Content } = Components
const HomeSearchAtom = atom<string | undefined>(undefined)
export const HomePage: FC = () => {
  const { t } = useTranslation()
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const homeMode = KeyvalueStore.useValue('homeDisplayMode') || 'gallery'
  const allWorkspaces = KeyvalueStore.useValue('allWorkspaces') || []
  return (
    <Content fullHeight fullWidth style={{ overflowY: 'auto' }}>
      <Content
        flex
        column
        style={{
          height: 'auto',
          margin: '0 auto',
          width: '100%',
          maxWidth: 1400,
          padding: '18px 24px'
        }}
      >
        <TabTitle title={t('general.home')} icon="park-home" />
        <Content flex alignItems="center" gap={10} justifyContent="space-between" style={{ margin: '16px 0px' }}>
          <div>
            <div style={{ fontSize: 13, color: Colors.Font.Transparent, paddingLeft: 8 }}>{t('settings.workspace')}</div>
            <AnimatePopover
              align={'start'}
              content={setV => (
                <WithBorder padding={6} style={{ maxHeight: 260, overflowY: 'auto', maxWidth: 200, overflowX: 'hidden' }}>
                  {allWorkspaces.map(i => (
                    <div
                      key={i.createdAt}
                      onClick={async () => {
                        setV(false)
                        await KeyvalueStore.updateOne('currentWorkspace', i)
                        setTimeout(() => {
                          Workspace.switchWorkspace(i.id)
                        })
                      }}
                      className={css([ClassName.flatButton(), ClassName.ellipsisFont(1)])}
                    >
                      {i.name}
                    </div>
                  ))}
                </WithBorder>
              )}
              positions={['bottom']}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  padding: '0px 8px'
                }}
                className={css([ClassName.flatButton(), ClassName.ellipsisFont(1)])}
              >
                {currentWorkspace?.name === 'default' ? 'Default workspace' : currentWorkspace?.name || 'Unnamed workspace'}
              </div>
            </AnimatePopover>
          </div>
          <Content flex gap={8} alignItems={'center'}>
            <Icon
              name={'park-all-application'}
              size={18}
              className={ClassName.flatButton(4, 4)}
              onClick={() => {
                KeyvalueStore.updateOne('homeDisplayMode', 'gallery')
              }}
              style={{
                background: homeMode === 'gallery' ? Colors.Background.ButtonActive : undefined,
                color: homeMode === 'table' ? Colors.Font.Transparent : undefined
              }}
            />
            <Icon
              name={'park-table-file'}
              size={18}
              onClick={() => {
                KeyvalueStore.updateOne('homeDisplayMode', 'table')
              }}
              className={ClassName.flatButton(4, 4)}
              style={{
                background: homeMode === 'table' ? Colors.Background.ButtonActive : undefined,
                color: homeMode === 'gallery' ? Colors.Font.Transparent : undefined
              }}
            />
            {homeMode === 'gallery' && (
              <AnimatePopover
                align={'end'}
                content={
                  <WithBorder padding={6} width={200}>
                    <GalleryConfig />
                  </WithBorder>
                }
                positions={['bottom']}
              >
                <Icon name={'park-more'} size={18} className={ClassName.flatButton(4, 4)} />
              </AnimatePopover>
            )}
            <div
              onClick={() =>
                GlobalInstance.metaOps?.createObject().then(res => {
                  if (res) {
                    setTimeout(() => {
                      Rendevoz.Actions.Open.Meta.openMetaObject(res.id)
                    }, 300)
                  }
                })
              }
              className={ClassName.selectButton(4, '1px 8px')}
              style={{ fontSize: 14, fontWeight: 500, color: 'white', marginLeft: 6 }}
            >
              {t('general.New')}
            </div>
          </Content>
        </Content>
        {homeMode === 'gallery' && <HomeGallery />}
        {homeMode === 'table' && <Recent />}
      </Content>
    </Content>
  )
}

const VisibleTypes: MetaObject['type'][] = [
  'note',
  'video',
  'pdf',
  'whiteboard',
  'webpage',
  'localFile',
  'image',
  'audio',
  'group',
  'code',
  'tweet',
  'question'
]

const ColWidthState = {
  nameWidth: '100%',
  viewWidth: '200px',
  createWidth: '200px'
}
const Recent = () => {
  const all = useGlobalAtomValue(undeletedMetaObjectsAtom) as MetaObject[]
  const { t } = useTranslation()
  const [type, setType] = useState<MetaObject['type'] | 'all'>('all')
  const [showResizer, toggleShowResizer] = useToggle(false)
  const search = useAtomValue(HomeSearchAtom)
  const getIcon = Rendevoz.Utils.Object.getMetaObjectIcon
  const allVisibleTypes = useMemo(() => {
    return MetaStore.getVisibleMetaTypes().filter(i => VisibleTypes.includes(i))
  }, [all.length])
  const [sortMode, setSortMode] = useState<'viewDesc' | 'viewAsc' | 'createDesc' | 'createAsc'>('viewDesc')
  const filteredItems = () => {
    switch (type) {
      case 'all':
        return all.filter(i => allVisibleTypes.includes(i.type) && MetaStore.isVisibleMetaObject(i))
      case 'pin':
        return all.filter(i => allVisibleTypes.includes(i.type) && i.pinned && MetaStore.isVisibleMetaObject(i))
      default: {
        if (allVisibleTypes.includes(type)) {
          return all.filter(i => i.type === type && MetaStore.isVisibleMetaObject(i))
        }
      }
    }
  }

  const items = useMemo(() => {
    const allItems = filteredItems()
    switch (sortMode) {
      case 'createAsc':
        allItems?.sort((a, b) => a.createdAt - b.createdAt)
        break
      case 'createDesc':
        allItems?.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'viewAsc':
        allItems?.sort(
          (a, b) => (a.viewAt == undefined ? Number.MAX_VALUE : a.viewAt) - (b.viewAt == undefined ? Number.MAX_VALUE : b.viewAt)
        )
        break
      case 'viewDesc':
        allItems?.sort(
          (a, b) => (b.viewAt == undefined ? Number.MIN_VALUE : b.viewAt) - (a.viewAt == undefined ? Number.MIN_VALUE : a.viewAt)
        )
        break
    }
    if (search?.length && allItems) {
      const result = fuzzysort.go(search, allItems, { key: 'name' })
      return result.map(i => i.obj)
    }
    return allItems
  }, [type, all, sortMode, search])

  const [showFilter, toggleShowFilter] = useToggle(false)

  return (
    <>
      <Content
        flex
        onPointerEnter={() => toggleShowResizer(true)}
        onPointerLeave={() => toggleShowResizer(false)}
        style={{
          zIndex: 10,
          marginRight: 50,
          padding: '4px 0px'
        }}
      >
        <div id="name-header" style={{ width: '100%' }}>
          <Select
            align={'start'}
            value={type}
            onSelect={v => setType(v[0])}
            closeOnSelect
            style={{
              fontWeight: 600,
              width: 200
            }}
            options={[
              {
                value: 'all',
                children: t('general.all'),
                icon: 'park-all-application'
              },
              {
                value: 'pin',
                children: t('general.pinned'),
                icon: 'park-star'
              },
              ...allVisibleTypes.map(type => ({
                value: type,
                children: Rendevoz.Utils.Meta.getTypeName(type),
                icon: getIcon(type)
              }))
            ]}
          ></Select>
        </div>
        <div id="view-header" style={{ minWidth: ColWidthState.viewWidth }}>
          <Content flex style={{ paddingRight: 8 }}>
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragMomentum={false}
              dragElastic={0}
              onDrag={(e, info) => {
                const dx = info.delta.x
                const nameHeader = document.getElementById('name-header')!
                const viewHeader = document.getElementById('view-header')!
                const nameColWidth = nameHeader.getBoundingClientRect().width
                const viewColWidth = viewHeader.getBoundingClientRect().width
                const nextNameColWidth = nameColWidth + dx
                const nextViewColWidth = viewColWidth - dx
                nameHeader.style.width = `${nextNameColWidth}px`
                viewHeader.style.width = `${nextViewColWidth}px`
                document.getElementById('view-col')?.setAttribute('width', `${nextViewColWidth}px`)
                document.getElementById('name-col')?.setAttribute('width', `${nextNameColWidth}px`)
              }}
              style={{
                width: '0px',
                borderLeft: '2px solid var(--border-background)',
                cursor: 'col-resize',
                height: '100%',
                top: 0,
                opacity: showResizer ? 1 : 0,
                position: 'absolute',
                left: -6,
                transition: 'opacity 0.2s ease'
              }}
            ></motion.div>
            <Button.IconButton
              spaceBetween
              reverse
              style={{ flex: 1, whiteSpace: 'nowrap', fontWeight: 600 }}
              text={t('general.view at')}
              onClick={() => {
                setSortMode(sortMode === 'viewDesc' ? 'viewAsc' : 'viewDesc')
              }}
              icon={sortMode === 'viewDesc' ? 'park-down' : sortMode === 'viewAsc' ? 'park-up' : undefined}
            ></Button.IconButton>
          </Content>
        </div>
        <div id="create-header" style={{ minWidth: ColWidthState.createWidth }}>
          <Content flex>
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragMomentum={false}
              dragElastic={0}
              onDrag={(e, info) => {
                const dx = info.delta.x
                const createHeader = document.getElementById('create-header')!
                const viewHeader = document.getElementById('view-header')!
                const createColWidth = createHeader.getBoundingClientRect().width
                const viewColWidth = viewHeader.getBoundingClientRect().width
                const nextCreateColWidth = createColWidth - dx
                const nextViewColWidth = viewColWidth + dx
                createHeader.style.width = `${nextCreateColWidth}px`
                viewHeader.style.width = `${nextViewColWidth}px`
                document.getElementById('view-col')?.setAttribute('width', `${nextViewColWidth}px`)
                document.getElementById('create-col')?.setAttribute('width', `${nextCreateColWidth}px`)
              }}
              style={{
                width: '0px',
                borderLeft: '2px solid var(--border-background)',
                cursor: 'col-resize',
                height: '100%',
                top: 0,
                opacity: showResizer ? 1 : 0,
                position: 'absolute',
                left: -6,
                transition: 'opacity 0.2s ease'
              }}
            ></motion.div>
            <Button.IconButton
              spaceBetween
              style={{ flex: 1, whiteSpace: 'nowrap', fontWeight: 600 }}
              reverse
              text={t('general.create at')}
              onClick={() => {
                setSortMode(sortMode === 'createDesc' ? 'createAsc' : 'createDesc')
              }}
              icon={sortMode === 'createDesc' ? 'park-down' : sortMode === 'createAsc' ? 'park-up' : undefined}
            ></Button.IconButton>
          </Content>
        </div>
      </Content>
      <table
        onScroll={e => {
          if (e.currentTarget.scrollTop > 0) {
            toggleShowFilter(true)
          } else {
            toggleShowFilter(false)
          }
        }}
        style={{
          display: 'block',
          height: 0,
          flex: 1,
          margin: '0px -24px',
          padding: '0px 24px 50px'
        }}
      >
        <colgroup>
          <col width={ColWidthState.nameWidth} id="name-col" />
          <col style={{ minWidth: ColWidthState.viewWidth }} width={ColWidthState.viewWidth} id="view-col" />
          <col style={{ minWidth: ColWidthState.createWidth }} width={ColWidthState.createWidth} id="create-col" />
          <col style={{ minWidth: 50 }} />
        </colgroup>

        <tbody
          style={{
            borderTop: '1px solid var(--border-background)'
          }}
        >
          {items?.slice(0, 100)?.map(i => (
            <tr
              onClick={e => {
                if (!e.defaultPrevented) {
                  Rendevoz.Actions.Open.Meta.openMetaObject(i.id)
                }
              }}
              key={i.id}
              className={css([
                {
                  userSelect: 'none',
                  td: {
                    padding: '6px 8px',
                    fontWeight: 500,
                    fontSize: 14
                  }
                },
                ClassName.flatButton()
              ])}
            >
              <td>
                <DraggableElement
                  draggingDetails={{
                    type: 'metaElement',
                    metaId: i.id
                  }}
                >
                  <Content flex gap={12} alignItems={'center'}>
                    {i.coverImgSrc ? (
                      <img src={i.coverImgSrc} width={36} height={36} style={{ objectFit: 'cover', borderRadius: 4 }} />
                    ) : (
                      <Icon size={18} name={getIcon(i.type)} />
                    )}
                    <div className={ClassName.ellipsisFont(1)}>{i.name || i.placeholderName}</div>
                  </Content>
                </DraggableElement>
              </td>
              <td>{i.viewAt && DateFormat.formatDistanceToNowStrict(i.viewAt)}</td>
              <td>{DateFormat.formatDistanceToNowStrict(i.createdAt)}</td>
              <td>
                <Content flex alignItems="center" justifyContent="center" onClick={e => e.stopPropagation()}>
                  <IconWithPopover
                    placement={['right', 'left']}
                    align="start"
                    zIndex={Zindexes.PopupMenu}
                    content={
                      <WithBorder>
                        <ObjectActionPopover metaObjectId={i.id} />
                      </WithBorder>
                    }
                    name="park-more"
                    closeOnContentClick
                    disableIntersection
                    disableNudge
                    className={ClassName.circleButton()}
                  ></IconWithPopover>
                </Content>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
