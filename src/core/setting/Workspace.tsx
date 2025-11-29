import { useTranslation } from 'react-i18next'
import { Content, Icon, IconWithPopover, Menu, Modal, WithBorder } from '@/components'
import KeyvalueStore, { CurrentKeyValues } from '@/api/stores/keyvalue.store'
import { useEffect, useState } from 'react'
import produce from 'immer'
import { Icons, KEY } from '@/consts'
import { useDb } from '@/hooks'
import isHotkey from 'is-hotkey'
import Id from '@/utils/id'
import Workspace from '@/api/common/workspace'
import classnames from 'classnames'
import { MetaObject } from '~/typings'
import { DateFormat } from '@/utils'
import trans from '@/consts/trans'
import ContextMenu from '@/components/contextMenu'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToFirstScrollableAncestor, restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'

export const getWorkspaceMetaCount = async () => {
  const metaDb = useDb('metaObjects')
  const allMetas = (await metaDb.toArray()) as MetaObject[]
  const notTempNotDeletedMetas = allMetas.filter(i => !i.temp && !i.deleted)
  const workspaceToMetaCount = new Map<number, number>()
  notTempNotDeletedMetas.forEach(m => {
    const workspace = m.workspace
    if (workspace) {
      workspaceToMetaCount.set(workspace, (workspaceToMetaCount.get(workspace) ?? 0) + 1)
    }
  })
  return workspaceToMetaCount
}
const WorkspaceSetting = () => {
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const allWorkspaces = KeyvalueStore.useValue('allWorkspaces')
  const [countDetails, setCountDetails] = useState<Map<number, number>>()
  const [initialEdit, setInitialEdit] = useState<number>()
  useEffect(() => {
    getWorkspaceMetaCount().then(res => setCountDetails(res))
  }, [])
  const { t } = useTranslation()
  const canDelete = (allWorkspaces?.length || 0) > 1
  const [deleteModalVisible, setDeleteModalVisible] = useState<number>()
  const handleDeleteCurrentWorkspace = () => {
    Workspace.deleteCurrentWorkspace()
  }
  const handleDeleteWorkspace = async (id: number) => {
    if (id === currentWorkspace?.id) {
      handleDeleteCurrentWorkspace()
    } else {
      const metaDb = useDb('metaObjects')
      const ids = await metaDb.filter(i => i.workspace === id).keys()
      metaDb.bulkDelete(ids)
      if (allWorkspaces) {
        KeyvalueStore.updateOne(
          'allWorkspaces',
          produce(allWorkspaces, s => {
            s.splice(
              s.findIndex(o => o.id === id),
              1
            )
          })
        )
      }
    }
  }
  const handleCreateWorkspace = () => {
    const id = Id.getId()
    KeyvalueStore.updateOne('allWorkspaces', [
      ...(allWorkspaces || []),
      {
        createdAt: Date.now(),
        name: '',
        id
      }
    ])
    setInitialEdit(id)
  }

  const handleSwitchWorkspace = async (id: number) => {
    Workspace.switchWorkspace(id)
  }

  const handleRenameWorkspace = (id: number, value: string) => {
    if (!allWorkspaces) return
    const curr = allWorkspaces.find(i => i.id === id)
    if (curr) {
      const currName = curr.name
      if (value === currName) {
        return
      }
      if (id === currentWorkspace?.id) {
        const newWorkspace = {
          ...currentWorkspace,
          name: value
        }
        KeyvalueStore.updateOne('currentWorkspace', newWorkspace)
        KeyvalueStore.updateOne(
          'allWorkspaces',
          produce(allWorkspaces, draft => {
            const t = draft.find(i => i.id === currentWorkspace.id)
            if (t) {
              t.name = value
            }
          })
        )
      } else {
        KeyvalueStore.updateOne(
          'allWorkspaces',
          produce(allWorkspaces, s => {
            const w = s.find(i => i.id === id)
            if (w) {
              w.name = value
            }
          })
        )
      }
    }
  }
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )
  if (!allWorkspaces) return null
  return (
    <Content flex column gap={9}>
      <Modal
        visible={deleteModalVisible !== undefined}
        onClose={() => {
          setDeleteModalVisible(undefined)
        }}
      >
        <div className={'w-[90vw] max-w-md p-6 pb-3 flex flex-col items-center'}>
          <Icon name={'park-caution'} size={40} className={'delete-font mb-3'} theme={'filled'} />
          <div className={'text-xl font-semibold mb-1'}>{t(trans.Settings.DeleteWorkspace.ModalTitle)}</div>
          <div className={'transparent-font text-center'}>{t(trans.Settings.DeleteWorkspace.ModalDesc)}</div>
          <div
            onClick={() => {
              handleDeleteWorkspace(deleteModalVisible!)
              setDeleteModalVisible(undefined)
            }}
            className={
              'button flex gap-2 items-center justify-center text-white w-full mt-3 !py-1.5 text-center font-medium hover:!bg-opacity-85 !bg-red-500'
            }
          >
            {t(trans.Settings.DeleteWorkspace.Confirm)}
          </div>
          <div className={'button transparent-font w-fit mt-2 text-center font-medium'} onClick={() => setDeleteModalVisible(undefined)}>
            {t(trans.Cancel)}
          </div>
        </div>
      </Modal>
      <div
        style={{
          paddingBottom: 8
        }}
        className={'border-bottom bold-font font-size-15'}
      >
        {t('settings.Current workspace')}
      </div>
      <div>{currentWorkspace?.name || t(trans.Unnamed)}</div>
      <Content
        flex
        alignItems={'center'}
        justifyContent={'space-between'}
        className={'border-bottom'}
        style={{ marginTop: 20, paddingBottom: 8 }}
      >
        <div className={'bold-font font-size-15'}>{t('settings.All workspaces')}</div>
      </Content>
      <Content flex column className={'flex flex-col -mr-2 -ml-9'}>
        <div className={'flex items-center px-2 transparent-font font-size-12'}>
          <div className={'w-[1.8rem]'}></div>
          <div className={'w-[60%]'}>{t(trans.Name)}</div>
          <div className={'w-[20%]'}>{t('general.Created at')}</div>
          <div className={'w-[10%]'}>{t('general.File count')}</div>
        </div>
        <div>
          <DndContext
            sensors={sensors}
            modifiers={[restrictToFirstScrollableAncestor, restrictToVerticalAxis, restrictToParentElement]}
            collisionDetection={closestCenter}
            onDragEnd={event => {
              const { active, over } = event

              if (allWorkspaces && active && over && active.id !== over?.id) {
                const oldIndex = allWorkspaces?.findIndex(i => i.id === active.id)
                const newIndex = allWorkspaces?.findIndex(i => i.id === over.id)
                KeyvalueStore.updateOne('allWorkspaces', arrayMove(allWorkspaces, oldIndex, newIndex))
              }
            }}
          >
            <SortableContext items={allWorkspaces} strategy={verticalListSortingStrategy}>
              {allWorkspaces.map(i => (
                <WorkspaceItem
                  onClick={() => {
                    handleSwitchWorkspace(i.id)
                  }}
                  onChange={v => {
                    handleRenameWorkspace(i.id, v)
                  }}
                  canDelete={canDelete}
                  onDelete={() => {
                    setDeleteModalVisible(i.id)
                  }}
                  initialEdit={initialEdit === i.id}
                  count={countDetails?.get(i.id)}
                  item={i}
                  key={i.id}
                />
              ))}
            </SortableContext>
          </DndContext>
          <div className={'button !py-1.5 flex items-center gap-3 super-transparent-font'} onClick={() => handleCreateWorkspace()}>
            <Icon name={Icons.Create} size={16} />
            {t('settings.New workspace')}
          </div>
        </div>
      </Content>
    </Content>
  )
}

const WorkspaceItem = ({
  item,
  onDelete,
  canDelete,
  onClick,
  onChange,
  count,
  initialEdit = false
}: {
  item: CurrentKeyValues['currentWorkspace']
  onDelete: VoidFunction
  canDelete: boolean
  onClick: VoidFunction
  onChange: (n: string) => void
  count?: number
  initialEdit?: boolean
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: item.id })
  const [isEditing, setIsEditing] = useState(initialEdit)
  const style = {
    transform: CSS.Transform.toString(transform)
  }
  const { t } = useTranslation()
  return (
    <ContextMenu
      ref={setNodeRef}
      content={setV => (
        <WithBorder onClick={e => e.stopPropagation()} className={'py-1 min-w-52'}>
          <Menu.NavigationMenu
            layout={[
              {
                type: 'item',
                key: 'edit',
                icon: 'park-edit',
                text: t('general.edit'),
                onSelect: () => {
                  setV(false)
                  setIsEditing(true)
                }
              },
              canDelete && {
                type: 'item',
                key: 'delete',
                icon: 'park-delete-one',
                text: t('general.delete'),
                onSelect: () => {
                  setV(false)
                  if (canDelete) {
                    onDelete()
                  }
                }
              }
            ]}
          />
        </WithBorder>
      )}
      enableContextMenu={!isEditing}
    >
      <Content
        style={style}
        {...attributes}
        onClick={() => {
          if (!isEditing) {
            onClick()
          }
        }}
        className={classnames(isEditing ? undefined : 'button !py-1.5 !h-auto', 'items-center flex', isDragging && 'z-[10]')}
      >
        {isEditing ? (
          <input
            className={'focus-input ml-9 w-full rounded-md px-3 py-1.5'}
            defaultValue={item.name}
            autoFocus={true}
            onBlur={e => {
              setIsEditing(false)
              onChange(e.target.value)
            }}
            placeholder={t('general.Type a name')}
            onKeyDown={e => {
              if (isHotkey(KEY.Escape, e)) {
                setIsEditing(false)
                e.stopPropagation()
              }
              if (isHotkey(KEY.Enter, e)) {
                onChange(e.currentTarget.value)
                setIsEditing(false)
              }
            }}
          />
        ) : (
          <>
            <Icon size={16} name={'park-drag'} className={'hover-active-button !cursor-grab mr-3'} {...listeners} />
            <div className={classnames(!item.name ? 'super-transparent-font' : undefined, 'line-clamp-1 w-[60%]')}>
              {item.name || t('general.Unnamed')}
            </div>
            <div className={'w-[20%] transparent-font font-size-12'}>{DateFormat.formatDate(item.createdAt)}</div>
            <div className={'w-[10%] transparent-font font-size-12'}>{count}</div>
          </>
        )}
        {isEditing ? null : (
          <IconWithPopover
            placement={['bottom', 'top']}
            name={Icons.More}
            size={18}
            onClick={e => e.stopPropagation()}
            containerClassName={'ml-auto'}
            className={'hover-active-button'}
            content={setV => (
              <WithBorder onClick={e => e.stopPropagation()} padding={'0.4rem 0'} width={160}>
                <Menu.NavigationMenu
                  layout={[
                    {
                      type: 'item',
                      key: 'edit',
                      icon: 'park-edit',
                      text: t('general.edit'),
                      onSelect: () => {
                        setV(false)
                        setIsEditing(true)
                      }
                    },
                    canDelete && {
                      type: 'item',
                      key: 'delete',
                      disabled: !canDelete,
                      icon: 'park-delete-one',
                      text: t('general.delete'),
                      onSelect: () => {
                        setV(false)
                        if (canDelete) {
                          onDelete()
                        }
                      }
                    }
                  ]}
                />
              </WithBorder>
            )}
          ></IconWithPopover>
        )}
      </Content>
    </ContextMenu>
  )
}
export default WorkspaceSetting
