import { IAIMessage } from '~/typings'
import ChatReferencesRenderer from '@/core/ai/chat/message/ChatReferencesRenderer'
import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DotLoading, Icon } from '@/components'
import classnames from 'classnames'

export default memo(
  ({
    reasoning,
    collapsed,
    references,
    content,
    onCollapse,
    timeUsed,
    loadState,
    nextMessage,
    onRetry
  }: {
    reasoning?: string
    collapsed?: boolean
    references?: IAIMessage['references']
    onCollapse?: VoidFunction
    nextMessage?: IAIMessage
    content?: string
    timeUsed?: number
    loadState?: IAIMessage['loadState']
    onRetry?: VoidFunction
  }) => {
    const [state, setState] = useState<{
      reasoningCollapsed: boolean
      sourceCollapsed: boolean
    }>({
      sourceCollapsed: false,
      reasoningCollapsed: false
    })
    const renderContent = () => {
      if (!reasoning && !references?.length) return null
      return (
        <>
          {references?.length ? (
            <>
              <div
                onClick={() => setState(s => ({ ...s, sourceCollapsed: !s.sourceCollapsed }))}
                className={'flex items-center select-none cursor-pointer'}
                style={{
                  fontSize: '0.9em',
                  gap: '0.5em'
                }}
              >
                <Icon
                  name={'park-right-one'}
                  theme={'filled'}
                  className={classnames(state.sourceCollapsed ? '' : 'rotate-90', 'transition-transform')}
                />
                <div>整理来源</div>
              </div>
              <div
                style={{
                  fontSize: '0.86em',
                  marginLeft: '0.5em',
                  borderLeft: '1px dashed var(--border-background)',
                  paddingTop: '0.5em',
                  paddingBottom: '0.5em',
                  paddingLeft: '1em'
                }}
              >
                <AnimatePresence initial={false}>
                  {!state.sourceCollapsed && (
                    <motion.div
                      initial={{
                        height: 0,
                        opacity: 0
                      }}
                      animate={{
                        height: 'auto',
                        opacity: 1
                      }}
                      exit={{
                        height: 0,
                        opacity: 0
                      }}
                      className={'transparent-font overflow-y-hidden overflow-x-auto no-scrollbar flex gap-3 whitespace-pre-wrap'}
                    >
                      <ChatReferencesRenderer references={references} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : null}
          <div
            onClick={() => setState(s => ({ ...s, reasoningCollapsed: !s.reasoningCollapsed }))}
            className={'flex items-center select-none cursor-pointer'}
            style={{
              fontSize: '0.9em',
              gap: '0.5em'
            }}
          >
            <Icon
              name={'park-right-one'}
              theme={'filled'}
              className={classnames(state.reasoningCollapsed ? '' : 'rotate-90', 'transition-transform')}
            />
            <div>深度思考</div>
          </div>
          <div
            style={{
              fontSize: '0.85em',
              marginLeft: '0.5em',
              borderLeft: '1px dashed var(--border-background)',
              paddingTop: '0.5em',
              paddingBottom: '0.5em',
              paddingLeft: '1em'
            }}
          >
            <AnimatePresence initial={false}>
              {!state.reasoningCollapsed && (
                <motion.div
                  initial={{
                    height: 0,
                    opacity: 0
                  }}
                  animate={{
                    height: 'auto',
                    opacity: 1
                  }}
                  exit={{
                    height: 0,
                    opacity: 0
                  }}
                  className={'transparent-font whitespace-pre-wrap'}
                >
                  {reasoning}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {content && (
            <div
              className={'flex items-center'}
              style={{
                fontSize: '0.9em',
                gap: '0.5em'
              }}
            >
              <div style={{ width: '1em' }} className={'flex items-center justify-center'}>
                <div
                  style={{
                    width: '0.5em',
                    height: '0.5em',
                    borderRadius: '50%',
                    border: '1.5px solid var(--font-primary)'
                  }}
                ></div>
              </div>
              <div>生成回答</div>
            </div>
          )}
        </>
      )
    }
    if (loadState === 'failed') {
      return (
        <div
          className={
            'bg-red-500 gap-6 flex items-center justify-between rounded-xl bg-opacity-20 border !border-red-500 !border-opacity-40 text-red-500 p-3'
          }
        >
          <div className={'flex gap-2 items-start'}>
            <Icon size={16} name={'park-attention'} className={'mt-1'} strokeWidth={4} />
            <div>发生了一个错误！请检查您的网络或模型提供商。</div>
          </div>
          {!nextMessage && (
            <div onClick={onRetry} className={'reverse-theme-button !rounded-3xl shrink-0 px-5 py-2'}>
              重试
            </div>
          )}
        </div>
      )
    }
    if (loadState === 'connecting') {
      return (
        <div className={'em:pb-6'}>
          <DotLoading className={'em:ml-3'} size={6} />
        </div>
      )
    }
    if (!references?.length && !reasoning) return null
    return (
      <div
        style={{
          marginBottom: '0.8em'
        }}
      >
        {loadState === 'loading' || loadState === 'succeeded' ? (
          <div
            onClick={() => onCollapse?.()}
            className={'flex font-medium items-center select-none cursor-pointer'}
            style={{
              fontSize: '0.95em',
              gap: '0.5em'
            }}
          >
            {loadState === 'loading' ? <div>生成回答中</div> : <div>完成回答，用时 {((timeUsed ?? 0) / 1000).toFixed(0)} 秒</div>}
            <Icon
              strokeWidth={5}
              name={'park-down'}
              className={classnames(collapsed ? '' : 'rotate-180', 'transition-transform super-transparent-font')}
            />
          </div>
        ) : null}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0
              }}
              animate={{
                height: 'auto',
                opacity: 1
              }}
              exit={{
                height: 0,
                opacity: 0
              }}
            >
              <div style={{ height: '0.75em' }}></div>
              {renderContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
