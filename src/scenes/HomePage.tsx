import { AnimatePopover, Button, Icon, Menu, WithBorder, Content } from '@/components'
import { FC, useMemo, useState } from 'react'
import { GlobalInstance, useGlobalAtomValue, useToggle } from '@/hooks'
import { useTranslation } from 'react-i18next'
import TabTitle from '@/components/layout/TabTitle'
import { ClassName } from 'rendevoz'
import { undeletedMetaObjectsAtom } from '@/api/stores/meta/meta.store'
import { MetaObject } from '~/typings'
import Select from '@/components/base/select'
import DateFormat from '@/utils/dateFormat'
import { css } from '@emotion/css'
import { ObjectActionMenu } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import HomeGallery from '@/scenes/home/HomeGallery'
import KeyvalueStore, { IHomeConfig } from '@/api/stores/keyvalue.store'
import GalleryConfig from '@/scenes/home/GalleryConfig'
import { MetaStore } from '@/api/stores'
import Workspace from '@/api/common/workspace'
import ContextMenu from '@/components/contextMenu'
import classnames from 'classnames'
import { Resizable } from 're-resizable'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import { Colors } from '@/consts'
import { sortStrings } from '@/utils/str'

const RowClass = classnames([
  css({
    clipPath: 'xywh(0 0 100% 100% round 6px)',
    td: {
      padding: '6px 8px'
    }
  }),
  'button none-select'
])
export const HomePage: FC = () => {
  const { t } = useTranslation()
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const homeMode = useHomeConfig().mode
  const allWorkspaces = KeyvalueStore.useValue('allWorkspaces') || []
  const switchMode = (m: IHomeConfig['mode']) => useHomeConfig.update(c => ({ ...c, mode: m }))
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
          padding: '18px 36px'
        }}
      >
        <TabTitle title={t('general.home')} icon="park-home" />
        <Content flex alignItems="center" gap={10} justifyContent="space-between" style={{ margin: '16px 0px' }}>
          <div>
            <div className={'menu-sub-title pl-8'}>{t('settings.workspace')}</div>
            <AnimatePopover
              align={'start'}
              content={setV => (
                <WithBorder padding={'0.4rem 0'} width={180}>
                  <Menu.NavigationMenu
                    layout={[
                      {
                        type: 'title',
                        name: t('general.All workspaces')
                      },
                      // @ts-ignore
                      ...allWorkspaces.map(i => ({
                        type: 'item',
                        key: String(i.id),
                        style: {
                          color: !i.name ? Colors.Font.SuperTransparent : undefined
                        },
                        text: i.name || t('general.Unnamed'),
                        onSelect: async () => {
                          setV(false)
                          Workspace.switchWorkspace(i.id)
                        }
                      }))
                    ]}
                  />
                </WithBorder>
              )}
              positions={['bottom']}
            >
              <div
                style={{
                  fontSize: 22,
                  color: !currentWorkspace?.name ? Colors.Font.SuperTransparent : undefined
                }}
                className={'button ellipsis-font-1 py-0 px-8 bold-font'}
              >
                {currentWorkspace?.name === 'default' ? t('general.Default workspace') : currentWorkspace?.name || t('general.Unnamed')}
              </div>
            </AnimatePopover>
          </div>
          <Content flex gap={8} alignItems={'center'} className={'transparent-font'}>
            <Icon
              name={'park-all-application'}
              className={classnames('button p-5 icon-18', homeMode === 'gallery' && 'active-button')}
              onClick={() => {
                switchMode('gallery')
              }}
            />
            <Icon
              name={'custom-list'}
              onClick={() => {
                switchMode('list')
              }}
              className={classnames('button p-5 icon-18', homeMode === 'list' && 'active-button')}
            />
            {homeMode === 'gallery' && (
              <AnimatePopover
                padding={6}
                content={
                  <WithBorder className={'p-4'} width={200}>
                    <GalleryConfig />
                  </WithBorder>
                }
                positions={['bottom']}
              >
                <Icon name={'park-more'} size={18} className={'button p-5'} />
              </AnimatePopover>
            )}
            <Button.IconButton
              text={t('general.New')}
              icon={'park-plus'}
              gap={4}
              onClick={() =>
                GlobalInstance.metaOps?.createObject().then(res => {
                  if (res) {
                    setTimeout(() => {
                      GlobalInstance.layoutOps?.openObject(res.id)
                    }, 300)
                  }
                })
              }
              style={{
                padding: '3px 10px 3px 7px'
              }}
              className={'select-button ml-6'}
            ></Button.IconButton>
          </Content>
        </Content>
        {homeMode === 'gallery' && <HomeGallery />}
        {homeMode === 'list' && <ListView />}
      </Content>
    </Content>
  )
}

const ListView = () => {
  const [colWidth, setColWidth] = useState({
    nameWidth: '100%',
    viewWidth: '140px',
    createWidth: '140px'
  })
  const all = useGlobalAtomValue(undeletedMetaObjectsAtom) as MetaObject[]
  const { t } = useTranslation()
  const type = useHomeConfig().list.visibleType
  const [showResizer, toggleShowResizer] = useToggle(false)
  const getIcon = Rendevoz.Utils.Object.getMetaObjectIcon
  const allVisibleTypes = useMemo(() => {
    return MetaStore.getVisibleMetaTypes(false, false)
  }, [all.length])
  const sortMode = useHomeConfig().list.sortMode
  const setSortMode = (m: IHomeConfig['list']['sortMode']) => {
    useHomeConfig.update(c => ({ ...c, list: { ...c.list, sortMode: m } }))
  }
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
    return allItems
  }, [type, all, sortMode])

  return (
    <>
      <Content
        flex
        onPointerEnter={() => toggleShowResizer(true)}
        onPointerLeave={() => toggleShowResizer(false)}
        style={{
          zIndex: 10,
          padding: '2px 0px'
        }}
        className={'transparent-font font-size-13 normal-font'}
      >
        <div style={{ width: '100%' }}>
          <Select
            align={'start'}
            value={type}
            onSelect={v => useHomeConfig.update(curr => ({ ...curr, list: { ...curr.list, visibleType: v[0] } }))}
            closeOnSelect
            style={{
              width: 160
            }}
            options={[
              {
                value: 'all',
                children: t('general.All types'),
                icon: 'park-all-application'
              },
              {
                value: 'pin',
                children: t('general.pinned'),
                icon: 'park-star'
              },
              ...sortStrings(allVisibleTypes, o => Rendevoz.Utils.Meta.getTypeName(o)).map(type => ({
                value: type,
                children: Rendevoz.Utils.Meta.getTypeName(type),
                icon: getIcon(type)
              }))
            ]}
          ></Select>
        </div>
        <Resizable
          defaultSize={{
            width: colWidth.viewWidth,
            height: '100%'
          }}
          maxWidth={300}
          minWidth={100}
          enable={{ left: true }}
          onResize={(event, direction, elementRef) => {
            setColWidth(s => ({ ...s, viewWidth: `${elementRef.clientWidth}px` }))
          }}
          handleStyles={{
            left: {
              opacity: showResizer ? 1 : 0,
              transition: 'opacity 0.2s ease'
            }
          }}
        >
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
        </Resizable>
        <Resizable
          defaultSize={{
            width: colWidth.createWidth,
            height: '100%'
          }}
          maxWidth={300}
          onResize={(event, direction, elementRef) => {
            setColWidth(s => ({ ...s, createWidth: `${elementRef.clientWidth}px` }))
          }}
          minWidth={100}
          enable={{ left: true }}
          handleStyles={{
            left: {
              opacity: showResizer ? 1 : 0,
              transition: 'opacity 0.2s ease'
            }
          }}
        >
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
        </Resizable>
      </Content>
      {!items?.length ? (
        <div
          className={'super-transparent-font'}
          style={{
            gap: 12,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 200px)',
            margin: '0px -24px',
            padding: '0px 24px 50px',
            flexDirection: 'column'
          }}
        >
          <Icon size={80} style={{ opacity: 0.3 }} name={'custom-empty'} />
          <div>{t('general.Current list is empty')}</div>
        </div>
      ) : (
        <table
          style={{
            display: 'block',
            height: 0,
            flex: 1,
            paddingBottom: 50
          }}
        >
          <colgroup>
            <col width={colWidth.nameWidth} />
            <col style={{ minWidth: colWidth.viewWidth }} width={colWidth.viewWidth} />
            <col style={{ minWidth: colWidth.createWidth }} width={colWidth.createWidth} />
          </colgroup>

          <tbody>
            {items?.slice(0, 100)?.map(i => (
              <ContextMenu
                key={i.id}
                content={setV => (
                  <WithBorder>
                    <ObjectActionMenu onClose={() => setV(false)} metaObjectId={i.id} />
                  </WithBorder>
                )}
              >
                <tr
                  onClick={e => {
                    if (!e.defaultPrevented) {
                      Rendevoz.Actions.Open.Meta.openMetaObject(i.id)
                    }
                  }}
                  className={RowClass}
                >
                  <td className={'normal-font'}>
                    <Content style={{ minHeight: 30 }} flex gap={12} alignItems={'center'}>
                      {i.coverImgSrc ? (
                        <img src={i.coverImgSrc} width={36} height={36} style={{ objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <Icon size={18} name={getIcon(i.type)} />
                      )}
                      <div className={ClassName.ellipsisFont(1)}>{i.name || i.placeholderName}</div>
                    </Content>
                  </td>
                  <td className={'transparent-font font-size-12'}>{i.viewAt && DateFormat.formatDistanceToNowStrict(i.viewAt)}</td>
                  <td className={'transparent-font font-size-12'}>{DateFormat.formatDistanceToNowStrict(i.createdAt)}</td>
                </tr>
              </ContextMenu>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
