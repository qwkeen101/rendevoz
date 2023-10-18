import { AnimatePopover, Button, Icon, IconWithPopover, Modal, WithBorder } from '@/components'
import { FC, useMemo, useState } from 'react'
import { Components } from 'rendevoz'
import { useDebounceFn, useGlobalAtomValue, useSelectAtomValue, useToggle } from '@/hooks'
import { useTranslation } from 'react-i18next'
import TabTitle from '@/components/layout/TabTitle'
import ClassName from '@/styles/classNames'
import { TypeToRegisteredMetaObject, undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { MetaObject } from '~/typings'
import Select from '@/components/base/select'
import DateFormat from '@/utils/dateFormat'
import { css } from '@emotion/css'
import { motion } from 'framer-motion'
import { IconNameItem } from '@/components/layout/sidebar/SidebarCollection'
import { DraggableElement, ObjectActionPopover, TypeToTypeName, useCreateObject } from '@/core'
import { Zindexes } from '@/consts'
import Colors from '@/consts/colors'
import { atom, createStore, useAtomValue } from 'jotai'
import fuzzysort from 'fuzzysort'
import { Rendevoz } from '@/core/rendevoz'
import FileImporter from '@/components/fileImporter'
import HomeGallery from '@/scenes/home/HomeGallery'
import KeyvalueStore from '@/stores/keyvalue.store'
import GalleryConfig from '@/scenes/home/GalleryConfig'
import fetchGoogleNews from '@/core/feed/utils/googleNewsScraper'

const { Content } = Components
const HomeSearchAtom = atom<string | undefined>(undefined)
export const HomePage: FC = () => {
  const { t } = useTranslation()
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace') || 'default'
  const homeMode = KeyvalueStore.useValue('homeDisplayMode') || 'gallery'
  const [createVisible, toggleCreateVisible] = useToggle(false)
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
        <Modal visible={createVisible} onClose={toggleCreateVisible} style={{}}>
          <FileImporter onClose={toggleCreateVisible} />
        </Modal>
        <Content flex alignItems="center" justifyContent="space-between" style={{ margin: '16px 0px' }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 500
            }}
          >
            {currentWorkspace === 'default' ? 'Default workspace' : currentWorkspace}
          </div>
          <Content flex gap={8} alignItems={'center'}>
            <Icon
              name={'park-all-application'}
              size={20}
              className={ClassName.flatButton(4, 4)}
              onClick={() => {
                KeyvalueStore.updateOne('homeDisplayMode', 'gallery')
              }}
              style={{ background: homeMode === 'gallery' ? Colors.Background.ButtonActive : undefined }}
            />
            <Icon
              name={'park-list-view'}
              size={20}
              onClick={() => {
                KeyvalueStore.updateOne('homeDisplayMode', 'table')
              }}
              className={ClassName.flatButton(4, 4)}
              style={{ background: homeMode === 'table' ? Colors.Background.ButtonActive : undefined }}
            />
            <div style={{ height: 20, width: 1, background: Colors.Background.Border }}></div>
            <Icon size={20} className={ClassName.flatButton(4, 4)} onClick={e => toggleCreateVisible()} name="park-plus"></Icon>
            {homeMode === 'gallery' && (
              <AnimatePopover
                align={'end'}
                content={
                  <WithBorder padding={6} width={180}>
                    <GalleryConfig />
                  </WithBorder>
                }
                positions={['bottom']}
              >
                <Icon name={'park-more'} size={20} className={ClassName.flatButton(4, 4)} />
              </AnimatePopover>
            )}
          </Content>
        </Content>
        {homeMode === 'gallery' && <HomeGallery />}
        {homeMode === 'table' && <Recent />}
      </Content>
    </Content>
  )
}

const VisibleTypes: MetaObject['type'][] = ['note', 'video', 'pdf', 'whiteboard', 'webpage', 'localFile', 'image']

const ColWidthState = {
  nameWidth: '100%',
  viewWidth: '200px',
  createWidth: '200px'
}
const Recent = () => {
  const all = useGlobalAtomValue(undeletedMetaObjectsAtom)
  const { t } = useTranslation()
  const [type, setType] = useState<MetaObject['type'] | 'all'>('all')
  const [showResizer, toggleShowResizer] = useToggle(false)
  const search = useAtomValue(HomeSearchAtom)
  const getIcon = Rendevoz.Utils.Object.getMetaObjectIcon
  const allVisibleTypes = useMemo(() => {
    const visible = Array.from(TypeToRegisteredMetaObject.values())
      .filter(i => i.visibleInHomepage)
      .map(i => i.type)
    return [...VisibleTypes, ...visible]
  }, [])
  const [sortMode, setSortMode] = useState<'viewDesc' | 'viewAsc' | 'createDesc' | 'createAsc'>('viewDesc')
  const filteredItems = () => {
    switch (type) {
      case 'all':
        return all.filter(i => allVisibleTypes.includes(i.type))
      default: {
        if (allVisibleTypes.includes(type)) {
          return all.filter(i => i.type === type)
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
            style={{ marginLeft: -8 }}
            value={type}
            onSelect={v => setType(v[0])}
            closeOnSelect
            options={[
              {
                value: 'all',
                children: t('general.all types'),
                icon: 'park-all-application'
              },
              ...allVisibleTypes.map(type => ({
                value: type,
                children: t(`general.${TypeToTypeName[type]}`),
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
                borderLeft: '2px solid rgba(0,0,0,0.1)',
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
              style={{ flex: 1, whiteSpace: 'nowrap' }}
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
                borderLeft: '2px solid rgba(0,0,0,0.1)',
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
              style={{ flex: 1, whiteSpace: 'nowrap' }}
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
          padding: '0px 24px'
        }}
      >
        <colgroup>
          <col width={ColWidthState.nameWidth} id="name-col" />
          <col style={{ minWidth: ColWidthState.viewWidth }} width={ColWidthState.viewWidth} id="view-col" />
          <col style={{ minWidth: ColWidthState.createWidth }} width={ColWidthState.createWidth} id="create-col" />
          <col style={{ minWidth: 50 }} />
        </colgroup>

        <tbody>
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
                  borderTop: `1px solid ${Colors.Background.Border}`,
                  userSelect: 'none',
                  td: {
                    padding: '10px 8px'
                  },
                  ':hover': {
                    borderColor: 'transparent',
                    '+ tr': {
                      borderColor: 'transparent'
                    }
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
                  <IconNameItem icon={i.icon || getIcon(i.type, i)} name={i.name} color={i.color} />
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
