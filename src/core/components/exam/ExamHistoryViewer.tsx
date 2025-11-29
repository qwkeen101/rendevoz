import { ObjectStore } from '@/api/stores'
import { EmptyList } from '@/core/components'
import { IExam } from '~/typings'
import useExamState from '@/core/components/exam/useExamState'
import { Resizable } from 're-resizable'
import { memo, useMemo, useState } from 'react'
import { Icon, IconWithPopover, Menu, TabPane, Tabs, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import ExamWrongQuestions from '@/core/components/exam/ExamWrongQuestions'
import { Tab } from '@/components/base/tabs'
import classnames from 'classnames'
import { Icons } from '@/consts'

export default memo(({ history, listMode }: { history: IExam['history']; listMode?: boolean }) => {
  const [state, setState] = useExamState()
  const { t } = useTranslation()
  const [mode, setMode] = useState<'history' | 'wrong'>('history')
  const renderInner = () => {
    if (!history?.length) {
      return <EmptyList className={'h-full'} />
    }
    return (
      <div className={classnames('flex flex-col pb-40', listMode && 'border-top')}>
        {history.map((i, idx) => (
          <HistoryItemRenderer
            isLast={idx === history.length - 1}
            item={i}
            key={i.id}
            onClick={() => {
              setState(s => ({ ...s, mode: 'history', currentHistory: i, currentViewingQuestionWithHistory: undefined }))
            }}
          />
        ))}
      </div>
    )
  }

  const renderTabs = () => {
    return (
      <Tabs
        tabNavClassname={'!pb-2 !px-3 font-medium'}
        tabNavContainerClassname={'border-bottom px-3'}
        tabNavMode={'underline'}
        activeKey={mode}
        extra={
          mode === 'wrong' && (
            <IconWithPopover
              content={setV => (
                <WithBorder className={'popover-menu-mid'}>
                  <Menu.NavigationMenu
                    onSelect={k => {
                      setV(false)
                      setState(s => ({ ...s, questionHistorySort: k.key }))
                    }}
                    layout={[
                      {
                        type: 'title',
                        name: 'Sort by'
                      },
                      {
                        type: 'item',
                        key: 'order',
                        text: '题目顺序'
                      },
                      {
                        type: 'item',
                        key: 'name',
                        text: '名称'
                      },
                      {
                        type: 'item',
                        key: 'wrong',
                        text: '错误次数'
                      },
                      {
                        type: 'item',
                        key: 'correct',
                        text: '正确次数'
                      }
                    ]}
                  />
                </WithBorder>
              )}
              placement={['bottom']}
              align={'end'}
              size={16}
              name={Icons.Sort}
              className={'square-button transparent-font mb-1'}
            />
          )
        }
        onTabClick={k => setMode(k)}
      >
        <TabPane className={'overflow-y-auto'} tab={<Tab text={t('exam.Exam history')} />} key={'history'}>
          {renderInner()}
        </TabPane>
        <TabPane className={'overflow-y-auto'} tab={<Tab text={t('exam.Analytics')} />} key={'wrong'}>
          <ExamWrongQuestions />
        </TabPane>
      </Tabs>
    )
  }

  if (listMode) {
    return <div className={'flex-1 overflow-hidden'}>{renderInner()}</div>
  }
  return (
    <Resizable
      handleStyles={{
        left: {
          top: -100,
          left: -5,
          width: 5,
          height: 'calc(100% + 100px)',
          borderRight: '1px solid var(--border-background)'
        }
      }}
      className={'flex flex-col exam-sidebar'}
      enable={{
        left: true
      }}
      style={{
        position: state.historyVisible ? 'relative' : 'absolute',
        right: 0,
        opacity: state.historyVisible ? 1 : 0,
        pointerEvents: state.historyVisible ? 'auto' : 'none'
      }}
      defaultSize={{
        width: 400
      }}
    >
      <Icon
        onClick={() => setState(s => ({ ...s, historyVisible: false }))}
        name={'park-double-right'}
        size={20}
        className={'square-button-small transparent-font'}
        style={{
          position: 'absolute',
          top: -38,
          left: '0.5rem'
        }}
      />
      {renderTabs()}
    </Resizable>
  )
})

const HistoryItemRenderer = ({
  item,
  isLast,
  onClick
}: {
  item: Required<IExam>['history'][0]
  onClick: VoidFunction
  isLast: boolean
}) => {
  const { t } = useTranslation()
  const notDescQuestions = useMemo(() => item.questions.filter(i => i.type !== 'description'), [item.questions])
  return (
    <div className={classnames('p-3.5 cursor-pointer transition-colors light-hover', !isLast && 'border-bottom')} onClick={onClick}>
      <div>
        <div>
          共 {notDescQuestions.length} 题 • 正确 {item.correct} 题 • 错误 {notDescQuestions.length - item.correct} 题
        </div>
        <div className={'mt-0.5 small-transparent'}>
          {DateFormat.formatDate(item.time)} • {DateFormat.format(item.time, 'H:mm')}
        </div>
        {item.comment ? <div className={'whitespace-pre-wrap mt-0.5'}>{item.comment}</div> : null}
      </div>
    </div>
  )
}
