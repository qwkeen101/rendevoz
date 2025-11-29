import { MetaStore, ObjectStore } from '@/api/stores'
import { Icon, IconWithPopover, Menu, WithBorder } from '@/components'
import { Icons } from '@/consts'
import classnames from 'classnames'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import addChatAsMeta from '@/core/ai/chat/addChatAsMeta'

export default ({
  currentChatId,
  allChats,
  onChatChange,
  canCreate = true,
  className,
  onDelete
}: {
  currentChatId?: number
  allChats?: number[]
  onChatChange?: (id: number) => void
  canCreate?: boolean
  className?: string
  onDelete?: (id?: number) => void
}) => {
  const chatMeta = MetaStore.useObjectToMetaValue(currentChatId)
  const chat = ObjectStore('chat').useValue(currentChatId)
  const all = ObjectStore('chat').useMultiple(allChats)
  const title = chatMeta?.name ?? chat?.name
  const handleRename = (v: string) => {
    if (chatMeta) {
      MetaStore.updateMetaObject({ id: chatMeta.id, name: v })
    } else if (currentChatId) {
      ObjectStore('chat').updateOne({ id: currentChatId, name: v })
    }
  }
  const addChatAsMetaObject = async () => {
    if (chatMeta) {
      return chatMeta.id
    }
    if (chat) {
      const res = await addChatAsMeta(chat.id)
      if (res) {
        MetaStore.triggerObjectIndex()
        return res.id
      }
    }
  }
  const { t } = useTranslation()

  return (
    <div className={classnames('p-2 shrink-0 gap-1.5 flex items-center', className)}>
      {allChats && (
        <IconWithPopover
          size={16}
          placement={['bottom']}
          align={'start'}
          content={setV => (
            <WithBorder className={'p-1 w-64 max-h-80 overflow-y-auto'}>
              <div className={'menu-sub-title px-2 pt-1 pb-0.5'}>{t('ai.All chats')}</div>
              {all.map(i => (
                <div
                  onClick={() => {
                    onChatChange?.(i.id)
                    setV(false)
                  }}
                  className={'button gap-8 flex justify-between'}
                  key={i.id}
                >
                  <div className={classnames('line-clamp-1 font-size-13', !i.name && 'super-transparent-font')}>{i.name || t(trans.Unnamed)}</div>
                  <Icon
                    name={Icons.Delete}
                    className={'hover-active-button'}
                    onClick={e => {
                      e.stopPropagation()
                      onDelete?.(i.id)
                    }}
                  />
                </div>
              ))}
            </WithBorder>
          )}
          name={'park-hamburger-button'}
          className={'square-button'}
        />
      )}
      <input
        placeholder={t(trans.AI.NewChat)}
        className={'w-64 shrink-1 py-0.5'}
        defaultValue={title}
        key={currentChatId}
        onChange={e => {
          handleRename(e.currentTarget.value)
        }}
      />
      <div className={'ml-auto flex items-center gap-1.5'}>
        {canCreate && (
          <Icon
            onClick={() => {
              Global.aiOps?.chat?.({
                createNewChat: true,
                openSidebar: false
              })
            }}
            tooltip={t(trans.AI.NewChat)}
            size={16}
            name={Icons.Edit}
            className={'square-button'}
          />
        )}
        <IconWithPopover
          size={16}
          strokeWidth={6}
          placement={['bottom']}
          content={setV => (
            <WithBorder className={'py-1 min-w-52'}>
              <Menu.NavigationMenu
                layout={[
                  ...(chat?.messages.length
                    ? [
                        {
                          type: 'item',
                          key: 'clear-context',
                          text: t('ai.Clear context'),
                          icon: 'park-clear',
                          onSelect: async () => {
                            if (currentChatId) {
                              const chat = await ObjectStore('chat').getOneById(currentChatId)
                              if (chat) {
                                toast.success(t(trans.Success.ClearedSuccessfully))
                                chat.messages.forEach(id => {
                                  ObjectStore('message').updateOne({ id, noContext: true })
                                })
                              }
                            }
                            setV(false)
                          }
                        },
                        {
                          type: 'item',
                          key: 'clear-history',
                          text: t('ai.Clear chat history'),
                          icon: Icons.History,
                          onSelect: () => {
                            if (currentChatId) {
                              toast.success(t(trans.Success.ClearedSuccessfully))
                              chat?.messages.forEach(id => {
                                ObjectStore('message').deleteOneById(id)
                              })
                              ObjectStore('chat').updateOne({ id: currentChatId, messages: [] })
                            }
                            setV(false)
                          }
                        },
                        {
                          type: 'separator',
                          key: 's-1'
                        }
                      ]
                    : []),
                  !chatMeta
                    ? {
                        type: 'item',
                        key: 'add-as-meta',
                        text: t(trans.Meta.AddAsObject),
                        icon: Icons.AddAsObject,
                        onSelect: () => {
                          addChatAsMetaObject()
                          toast.success(t(trans.Success.AddedSuccessfully))
                          setV(false)
                        }
                      }
                    : {
                        type: 'item',
                        key: 'view-details',
                        text: t(trans.Meta.ViewDetails),
                        icon: Icons.Info,
                        onSelect: () => {
                          Global.metaOps.openDetails?.(chatMeta.id)
                          setV(false)
                        }
                      },
                  {
                    type: 'item',
                    key: 'tag',
                    text: t(trans.AddTag),
                    icon: Icons.Tag,
                    onSelect: () => {
                      setV(false)
                      addChatAsMetaObject().then(id => {
                        setTimeout(() => {
                          if (id) {
                            Global.metaOps?.quickAdd(id, 'tags')
                          }
                        }, 200)
                      })
                    }
                  },
                  {
                    type: 'item',
                    key: 'move-to',
                    text: t(trans.Meta.MoveTo),
                    icon: Icons.MoveTo,
                    onSelect: () => {
                      setV(false)
                      addChatAsMetaObject().then(id => {
                        setTimeout(() => {
                          if (id) {
                            Global.metaOps?.quickAdd(id)
                          }
                        }, 200)
                      })
                    }
                  },
                  {
                    type: 'item',
                    key: 'copy-link',
                    text: t(trans.CopyLink),
                    icon: Icons.Link,
                    onSelect: () => {
                      setV(false)
                      addChatAsMetaObject().then(id => {
                        setTimeout(() => {
                          if (id) {
                            Global.metaOps?.copyLink(id)
                          }
                        }, 200)
                      })
                    }
                  },
                  {
                    type: 'separator'
                  },
                  {
                    type: 'item',
                    key: 'delete',
                    text: t(trans.Delete),
                    icon: Icons.Delete,
                    dangerous: true,
                    onSelect: () => {
                      onDelete?.()
                      if (chatMeta) {
                        MetaStore.deleteMetaObject(chatMeta.id)
                      } else if (currentChatId) {
                        ObjectStore('chat').deleteOneById(currentChatId)
                      }
                      setV(false)
                    }
                  }
                ]}
              />
            </WithBorder>
          )}
          name={Icons.More}
          className={'square-button'}
        />
      </div>
    </div>
  )
}
