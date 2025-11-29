import { memo, useContext } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { AutosizeTextarea, Icon, TabTitle } from '@/components'
import ChatMessage from '@/core/ai/chat/message/ChatMessage'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import classnames from 'classnames'
import InPageTagRenderer from '@/core/components/common/InPageTagRenderer'
import PageConfigContext from '@/core/components/PageConfigContext'

export default memo(
  ({ id, className, title = true, titleRenderer = true }: { id: number; title?: boolean; className?: string; titleRenderer?: boolean }) => {
    const message = MetaStore.useObjectToMetaValue(id)
    const m = ObjectStore('message').useValue(id)
    const prevM = ObjectStore('message').useValue(m?.prevMessageId)
    const from = MetaStore.useValue(message?.fromObject?.metaId)
    const pageConfig = useContext(PageConfigContext)
    const renderTitle = titleRenderer && pageConfig.messageTitle !== false
    const { t } = useTranslation()
    return (
      <div className={classnames('w-full h-full flex flex-col overflow-y-auto pl-4 pr-6', className)}>
        {title && <TabTitle icon={<Icon name={Global.utils.getIcon('message')} />} title={message?.name} />}
        <div className={classnames('container-4xl my-auto', renderTitle ? 'pt-6 pb-20' : 'py-3')}>
          {renderTitle && (
            <div className={'flex justify-between mt-8 mb-3 gap-2 flex-wrap px-2 flex-col'}>
              <AutosizeTextarea
                onChange={v => {
                  if (message) {
                    MetaStore.updateMetaObject({ id: message.id, name: v })
                  }
                }}
                value={message?.name}
                className={'font-semibold grow text-3xl'}
                placeholder={t(trans.Untitled)}
              ></AutosizeTextarea>
              {from && (
                <div
                  onClick={() => {
                    if (from.type === 'chat') {
                      Global.layoutOps?.openObject<'chat'>(from.id).then(ins => {
                        ins?.scrollToMessage?.(id)
                      })
                    } else {
                      switch (from.type) {
                        case 'webpage':
                          Global.layoutOps?.openObject<'webpage'>(from.id).then(i => {
                            i?.editorInstance?.aiOps?.scrollToMessage(id)
                          })
                          return
                        case 'note':
                          Global.layoutOps?.openObject<'editor'>(from.id).then(i => {
                            i?.aiOps?.scrollToMessage(id)
                          })
                          return
                        case 'pdf':
                          Global.layoutOps?.openObject<'pdf'>(from.id).then(i => {
                            i?.aiOps?.scrollToMessage(id)
                          })
                          return
                        case 'video':
                        case 'audio':
                          Global.layoutOps?.openObject<'video'>(from.id).then(i => {
                            i?.aiOps?.scrollToMessage(id)
                          })
                          return
                      }
                    }
                  }}
                  className={'flex cursor-pointer group gap-2 w-fit mt-1'}
                >
                  <Icon name={Global.utils.getIcon(from.type)} />
                  <div className={classnames('line-clamp-1', !from.name && 'super-transparent-font')}>{from.name || t(trans.Unnamed)}</div>
                  <Icon strokeWidth={4} name={'park-right'} className={'transparent-font group-hover:translate-x-1 transition-transform'} />
                </div>
              )}
              {message && <InPageTagRenderer className={'mt-1'} metaId={message.id} />}
            </div>
          )}
          {prevM && <ChatMessage noToolbar id={prevM.id} />}
          {m && <ChatMessage noToolbar id={m.id} />}
        </div>
      </div>
    )
  }
)
