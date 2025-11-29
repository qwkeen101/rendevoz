import { Icon, Switch, WithBorder } from '@/components'
import { memo, ReactElement, useState } from 'react'
import useMediaState, { useSelectMediaState } from '../../../hooks/useMediaState'
import { Icons } from '@/consts'
import classnames from 'classnames'
import FocusLanguages from './FocusLanguages'
import FocusTranslator from './FocusTranslator'
import FocusTranslated from './FocusTranslated'
import FocusLabel from './FocusLabel'
import FocusTranscribe from './FocusTranscribe'
import FocusImporter from './FocusImporter'
import FocusExporter from './FocusExporter'
import useFocusSettings from '../useFocusSettings'

const Item = ({
  text,
  icon,
  switcher,
  next
}: {
  text: string
  icon: string | ReactElement
  switcher?: {
    value: boolean
    onSwitch: VoidFunction
  }
  next?: VoidFunction
}) => {
  return (
    <div
      onClick={next}
      style={{
        color: 'rgba(255, 255, 255, 0.8)'
      }}
      className='flex !transition-colors hover-bg-hover py-2.5 select-none px-4 items-center gap-3'
    >
      {typeof icon === 'string' ? <Icon name={icon} size={18} /> : icon}
      <div className='mr-auto'>{text}</div>
      {switcher && <Switch value={switcher.value} onChange={switcher.onSwitch} />}
      {next && <Icon name='park-right' className='transparent-font' size={16} strokeWidth={4} />}
    </div>
  )
}
export default memo(() => {
  const visible = useSelectMediaState(s => s.focus?.settingsVisible)
  const [state, setState] = useState<
    'language' | 'style' | 'main' | 'translator' | 'export' | 'transcribe' | 'label' | 'translated' | 'import'
  >('main')
  const [settings, setSettings] = useFocusSettings()
  const renderMain = () => {
    return (
      <div className='pt-3 pb-3'>
        <Item text='点击查词' icon={Icons.Search} switcher={{}} />
        <Item text='划词工具' icon='park-system' switcher={{}} />
        <Item
          text='隐藏控制栏'
          icon='park-bottom-bar'
          switcher={{
            value: !!settings.controlbarCollapsed,
            onSwitch: () => {
              setSettings(s => ({ ...s, controlbarCollapsed: !s.controlbarCollapsed }))
            }
          }}
        />
        <div className='w-full border-bottom my-3'></div>
        <Item text='标注样式' icon='park-bookmark' next={() => setState('label')} />
        <Item text='字幕语言' icon='park-sphere' next={() => setState('language')} />
        <Item text='翻译语言' icon='park-add-text' next={() => setState('translated')} />
        <Item text='翻译引擎' icon='park-translate' next={() => setState('translator')} />
        <div className='w-full border-bottom my-3'></div>
        <Item
          icon={
            <svg width={18} height={18} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M20.4668 8.69379L20.7134 8.12811C21.1529 7.11947 21.9445 6.31641 22.9323 5.87708L23.6919 5.53922C24.1027 5.35653 24.1027 4.75881 23.6919 4.57612L22.9748 4.25714C21.9616 3.80651 21.1558 2.97373 20.7238 1.93083L20.4706 1.31953C20.2942 0.893489 19.7058 0.893489 19.5293 1.31953L19.2761 1.93083C18.8442 2.97373 18.0384 3.80651 17.0252 4.25714L16.308 4.57612C15.8973 4.75881 15.8973 5.35653 16.308 5.53922L17.0677 5.87708C18.0555 6.31641 18.8471 7.11947 19.2866 8.12811L19.5331 8.69379C19.7136 9.10792 20.2864 9.10792 20.4668 8.69379ZM5.79993 16H7.95399L8.55399 14.5H11.4459L12.0459 16H14.1999L10.9999 8H8.99993L5.79993 16ZM9.99993 10.8852L10.6459 12.5H9.35399L9.99993 10.8852ZM15 16V8H17V16H15ZM3 3C2.44772 3 2 3.44772 2 4V20C2 20.5523 2.44772 21 3 21H21C21.5523 21 22 20.5523 22 20V11H20V19H4V5H14V3H3Z'></path>
            </svg>
          }
          text='AI 字幕转录'
          next={() => setState('transcribe')}
        />
        <Item text='导入字幕' icon='park-new-afferent' next={() => setState('import')} />
        <Item text='导出字幕' icon='park-efferent-three' next={() => setState('export')} />
        <Item text='复制链接' icon='park-link-one' next={() => setState('export')} />
      </div>
    )
  }
  return (
    <WithBorder
      style={{
        transform: visible ? 'translateX(0px)' : 'translateX(calc(100% + 12px))',
        position: 'absolute',
        transition: 'transform 0.2s ease',
        right: 12,
        bottom: 90,
        height: 'auto',
        zIndex: 1000,
        width: 320,
        minHeight: state === 'export' ? 200 : 400,
        maxHeight: 600,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className='border-bottom shrink-0 p-3 text-lg flex items-center gap-3'>
        {state !== 'main' && (
          <Icon
            onClick={() => setState('main')}
            name='park-left-small'
            className='border rounded-md cursor-pointer hover-active-button p-1 transparent-font'
          />
        )}
        播放设置
      </div>
      {state === 'main' && renderMain()}
      {state === 'label' && <FocusLabel />}
      {state === 'translator' && <FocusTranslator />}
      {state === 'language' && <FocusLanguages />}
      {state === 'translated' && <FocusTranslated />}
      {state === 'transcribe' && <FocusTranscribe />}
      {state === 'import' && <FocusImporter />}
      {state === 'export' && <FocusExporter />}
    </WithBorder>
  )
})
