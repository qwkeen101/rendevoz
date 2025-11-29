import navigateToSource from '@/core/global/common/navigateToSource'
import classnames from 'classnames'
import { IAIMessage, IGeneralSource } from '~/typings'
import { MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { Icon } from '@/components'

export default ({
  message,
  showSource,
  className,
  lineClamp,
  onQuestion
}: {
  message: IAIMessage
  showSource?: boolean
  className?: string
  lineClamp?: string
  onQuestion?: (id: number) => void
}) => {
  const { t } = useTranslation()
  const renderContent = (content: typeof message.content) => {
    const renderTextContent = (content: string) => {
      if (message.type === 'explain') {
        return (
          <div className={lineClamp ?? 'line-clamp-4'}>
            {t('ai.Explain content')}: {message.source?.selectedText}
          </div>
        )
      }
      if (message.type === 'explainExamQuestion') {
        if (message.source?.type === 'question') {
          return (
            <div className={lineClamp ?? 'line-clamp-4'}>
              {t('ai.Hint question')}:{' '}
              <span
                onClick={() => {
                  if (onQuestion) {
                    onQuestion(message.source!.objectId)
                    return
                  }
                  navigateToSource(message.source!)
                }}
                className={'font-medium cursor-pointer hover:underline'}
              >
                {message.source.name}
              </span>
            </div>
          )
        }
        return null
      }
      if (message.type === 'translate') {
        return (
          <div className={lineClamp ?? 'line-clamp-4'}>
            {t('ai.Translate content')}: {message.source?.selectedText}
          </div>
        )
      }
      if (message.type === 'table') {
        return <div>{t('ai.Create summary table')}</div>
      }
      if (message.type === 'overview') {
        return <div>{t('ai.Summarize briefly')}</div>
      }
      if (message.type === 'outline') {
        return <div>{t('ai.List contents')}</div>
      }
      if (message.type === 'quiz') {
        return <div>{t('ai.Make a quiz')}</div>
      }
      if (message.type === 'question') {
        return <div>{t('ai.Ask questions')}</div>
      }
      if (message.type === 'mindmap') {
        return <div>{t('ai.Make a mindmap')}</div>
      }
      if (message.type === 'points') {
        return <div>{t('ai.Extract points')}</div>
      }
      if (message.type === 'background') {
        return <div>{t('ai.Provide background')}</div>
      }
      if (message.type === 'summarize') {
        return <SummarizeContentRenderer content={message.content} source={message.source} />
      }
      return content
    }
    if (typeof content === 'string') {
      return (
        <div
          style={{
            maxWidth: 'min(320px, 80%)'
          }}
          className={'em:rounded-lg bg-third em:py-2 em:px-3 w-fit'}
        >
          {renderTextContent(content)}
        </div>
      )
    }
    if (typeof content === 'object') {
      const renderInner = () => {
        return content?.map(i => {
          if (i.type === 'text') {
            return (
              <div
                key={i.text}
                style={{
                  maxWidth: 'min(320px, 80%)'
                }}
                className={'em:rounded-lg bg-third em:py-2 em:px-3 w-fit'}
              >
                {renderTextContent(i.text)}
              </div>
            )
          }
          if (i.type === 'image') {
            const imageUrl = i.image as string
            return (
              <img
                key={imageUrl}
                onClick={() => {
                  Global.commonOps?.previewImage?.(imageUrl)
                }}
                style={{
                  maxWidth: 'min(320px, 80%)'
                }}
                className={'rounded-xl cursor-pointer mb-2'}
                src={imageUrl}
              />
            )
          }
        })
      }
      return <div className={'flex flex-col items-end w-full gap-3'}>{renderInner()}</div>
    }
  }
  return (
    <div className={classnames('flex items-end em:py-3 flex-col gap-1 empty:hidden w-full', className)}>
      {renderContent(message.content)}
      {message.source && message.type !== 'summarize' && showSource && <MessageSourceRenderer source={message.source} />}
    </div>
  )
}

const MessageSourceRenderer = ({ source }: { source: IGeneralSource }) => {
  const sourceMeta = MetaStore.useObjectToMetaValue(source.objectId)
  const { t } = useTranslation()
  if (sourceMeta) {
    return (
      <div
        onClick={() => {
          navigateToSource(source)
        }}
        style={{
          maxWidth: '60%'
        }}
        className={'button !py-1 flex w-fit gap-1 !rounded-2xl transparent-font font-size-12'}
      >
        <div className={'line-clamp-1 break-all'}>{sourceMeta.name || t(trans.Unnamed)}</div>
        <Icon strokeWidth={5} name={'park-right'} />
      </div>
    )
  }
}

const SummarizeContentRenderer = ({ source, content }: { source?: IGeneralSource; content: string }) => {
  const meta = MetaStore.useObjectToMetaValue(source?.objectId)
  const { t } = useTranslation()
  if (source && meta) {
    return (
      <div>
        {t('ai.Summarize content')}:{' '}
        <span
          onClick={() => {
            navigateToSource(source)
          }}
          className={'font-medium cursor-pointer hover:underline'}
        >
          {meta.name}
        </span>
      </div>
    )
  }
  return <div className={'line-clamp-4'}>{content}</div>
}
