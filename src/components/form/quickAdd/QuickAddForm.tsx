import { useEffect, useState } from 'react'
import { Content, Menu } from '@/components'
import ChooseGroupForm from './ChooseGroupForm'
import ChooseTagForm from '@/components/form/quickAdd/ChooseTagForm'
import ChooseCollectionForm from '@/components/form/quickAdd/ChooseCollectionForm'
import { CollectionStore, MetaStore, ObjectStore } from '@/api/stores'
import { ClassName } from 'rendevoz'
import ChooseNoteForm from '@/components/form/quickAdd/ChooseNoteForm'
import ChooseAttachmentForm from '@/components/form/quickAdd/ChooseAttachmentForm'
import { useTranslation } from 'react-i18next'
import note from '@/assets/images/note.png?url'
import group from '@/assets/images/group.png?url'
import tag from '@/assets/images/tag.png?url'
import folder from '@/assets/images/folder.png?url'
import whiteboard from '@/assets/images/whiteboard.png?url'
import { Colors, KEY } from '@/consts'
import ChooseWhiteboardForm from '@/components/form/quickAdd/ChooseWhiteboardForm'
import isHotkey from 'is-hotkey'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import quickAdd from '@/components/form/quickAdd/quickAdd'
import { Rendevoz } from '@/core/rendevoz'
import updateMovetoCache from '@/components/form/quickAdd/updateMovetoCache'

export type AvailableQuickAdd = 'tags' | 'collections' | 'groups' | 'attachments' | 'main' | 'note' | 'whiteboard'
export default ({
  currentMetaId,
  onClose,
  defaultVisible = 'main'
}: {
  currentMetaId: number[]
  onClose: VoidFunction
  defaultVisible?: AvailableQuickAdd
}) => {
  const [visible, setVisible] = useState<AvailableQuickAdd>(defaultVisible)
  const { t } = useTranslation()
  const currWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const recently = KeyvalueStore.useValue('moveToCache')?.[currWorkspace?.id || 0]?.recently
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (visible === 'main') {
        const keys = ['1', '2', '3', '4', '5']
        const matched = keys.find(i => isHotkey(i, e))
        if (matched) {
          e.preventDefault()
          e.stopPropagation()
          setVisible(options[Number(matched) - 1].key)
        }
      }
      if (isHotkey(KEY.Escape, e)) {
        e.preventDefault()
        e.stopPropagation()
        if (visible === 'main' || defaultVisible !== 'main') {
          onClose()
        } else {
          setVisible('main')
        }
      }
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  })
  const options = [
    {
      key: 'groups',
      name: t('general.group'),
      image: group
    },
    {
      key: 'whiteboard',
      name: t('general.whiteboard'),
      image: whiteboard
    },
    {
      key: 'note',
      name: t('general.note'),
      image: note
    },
    {
      key: 'collections',
      name: t('general.collection'),
      image: folder
    },
    {
      key: 'tags',
      name: t('general.tags'),
      image: tag
    }
  ]
  const handleBack = defaultVisible !== 'main' ? undefined : () => setVisible('main')
  const renderer = () => {
    switch (visible) {
      case 'main':
        return (
          <Content style={{ padding: 16, width: 'min(420px, 90vw)' }}>
            <Menu.NavigationMenu
              defaultSelectFirst
              layout={[
                ...(recently?.length
                  ? [
                      {
                        type: 'title',
                        style: {
                          fontSize: 14,
                          margin: '4px 0px 12px',
                          color: Colors.Font.Primary
                        },
                        name: t('general.Recently used')
                      },
                      ...recently
                        .map(i => {
                          let text = '',
                            icon = ''
                          switch (i.type) {
                            case 'tag': {
                              const t = ObjectStore('tag').getCachedOneById(i.id)
                              if (t) {
                                text = t.name || 'Unnamed tag'
                                icon = 'park-tag-one'
                                break
                              } else {
                                return
                              }
                            }
                            case 'collection': {
                              const c = CollectionStore.getCachedCollectionById(i.id)
                              if (c) {
                                text = c.name || 'Unnamed collection'
                                icon = 'park-folder-close'
                                break
                              } else {
                                return
                              }
                            }
                            case 'whiteboard':
                            case 'note':
                            case 'group': {
                              const m = MetaStore.getMetaObjectByObjectId(i.id)
                              if (m && !m.deleted) {
                                text = m.name || m.placeholderName || 'Unnamed object'
                                icon = Rendevoz.Utils.Object.getMetaObjectIcon(i.type)
                                break
                              } else {
                                return
                              }
                            }
                          }
                          return {
                            type: 'item',
                            key: i.id,
                            text: text,
                            suffixIconClassName: ClassName.flatButton(4, '4px'),
                            suffixIcon: 'park-close',
                            suffixIconStyle: {
                              color: Colors.Font.SuperTransparent
                            },
                            onSuffixIconClick: e => {
                              e.stopPropagation()
                              updateMovetoCache(s => {
                                s.recently = s.recently?.filter(o => o.id !== i.id)
                              })
                            },
                            icon: icon,
                            onSelect: () => {
                              if (i.type === 'whiteboard') {
                                updateMovetoCache(s => {
                                  s.whiteboard = { id: i.id }
                                })
                                setTimeout(() => {
                                  setVisible('whiteboard')
                                })
                              } else {
                                setTimeout(() => {
                                  quickAdd(currentMetaId, i.type, i.id)
                                }, 200)
                                onClose()
                              }
                            }
                          }
                        })
                        .filter(i => i)
                        .slice(0, 10)
                    ]
                  : []),
                {
                  type: 'title',
                  style: {
                    fontSize: 14,
                    margin: recently?.length ? '12px 0px' : '0px 0px 12px',
                    color: Colors.Font.Primary
                  },
                  name: t('general.Quick add')
                },
                ...options.map((i, idx) => ({
                  key: i.key,
                  type: 'custom',
                  onSelect: () => {
                    setVisible(i.key)
                  },
                  children: opts => (
                    <Content
                      key={i.key}
                      onClick={opts.onClick}
                      onPointerMove={opts.onPointerMove}
                      className={ClassName.flatButton()}
                      flex
                      alignItems={'center'}
                      gap={12}
                      style={{
                        fontWeight: 500,
                        fontSize: 14,
                        background: opts.isSelected ? Colors.Background.ButtonHover : 'transparent'
                      }}
                    >
                      <img src={i.image} width={24} height={24} />
                      {i.name}
                      <div
                        className={'font-size-12 transparent-font'}
                        style={{
                          marginLeft: 'auto'
                        }}
                      >
                        {idx + 1}
                      </div>
                    </Content>
                  )
                }))
              ].filter(i => i)}
            />
          </Content>
        )
      case 'groups':
        return <ChooseGroupForm onClose={onClose} onBack={handleBack} metaId={currentMetaId} />
      case 'whiteboard':
        return <ChooseWhiteboardForm onClose={onClose} onBack={handleBack} metaId={currentMetaId} />
      case 'note':
        return <ChooseNoteForm onClose={onClose} onBack={handleBack} metaId={currentMetaId} />
      case 'attachments':
        return <ChooseAttachmentForm onClose={onClose} onBack={handleBack} metaId={currentMetaId} />
      case 'tags':
        return <ChooseTagForm onBack={handleBack} metaId={currentMetaId} />
      case 'collections':
        return (
          <ChooseCollectionForm
            onBack={handleBack}
            onChoose={s => {
              onClose()
              quickAdd(currentMetaId, 'collection', s.id)
            }}
          />
        )
    }
  }
  return <Content>{renderer()}</Content>
}
