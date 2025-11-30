import { TabPane, Tabs, WithBorder } from '@/components'
import { Resizable } from 're-resizable'
import { memo } from 'react'
import { useSelectAtomValue } from '@/hooks'
import useEditorState, { EditorStateAtom } from '../hooks/useEditorState'
import { isEqual } from 'lodash'
import { Tab } from '@/components/base/tabs'
import { useTranslation } from 'react-i18next'
import trans from '../consts/trans'

export default memo(() => {
  const [state, setState] = useEditorState()
  const { metaId } = useSelectAtomValue(
    EditorStateAtom,
    s => ({
      metaId: s.metaId
    }),
    { compare: isEqual }
  )
  const { t } = useTranslation()
  const visible = state.sidebarVisible
  return (
    <Resizable
      enable={{
        left: true
      }}
      defaultSize={{
        width: state.sidebarWidth,
        height: '100%'
      }}
      minWidth={300}
      maxWidth={'50%'}
      onResizeStop={(e, d, ele) => {
        setState(s => ({ ...s, sidebarWidth: ele.offsetWidth }))
      }}
      className={'border-left'}
      style={{
        position: visible ? 'relative' : 'absolute',
        pointerEvents: visible ? 'auto' : 'none',
        opacity: visible ? 1 : 0
      }}
    >
      <Tabs
        tabNavLeftClassName={'overflow-x-auto font-size-13 no-scrollbar !flex-nowrap'}
        tabNavContainerClassname={'p-2.5 py-1.5 border-bottom'}
        tabNavClassname={'!font-medium !px-1.5 shrink-0 !py-1.5'}
        onTabClick={k => setState(s => ({ ...s, sidebarActive: k }))}
        activeKey={state.sidebarActive}
      >
        <TabPane tab={<Tab text={t('general.Info')} />} key="info">
          <WithBorder className="p-3">
            <div style={{ opacity: 0.7 }}>{t(trans.Untitled)}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Meta ID: {metaId ?? '-'}</div>
          </WithBorder>
        </TabPane>
      </Tabs>
    </Resizable>
  )
})
