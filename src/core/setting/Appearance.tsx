import { Content, FileUploader, Icon, Image, Slider } from '@/components'
import { useTranslation } from 'react-i18next'
import { ISettingItem } from './SettingItem'
import { useSetting } from '.'
import produce from 'immer'
import { css } from '@emotion/css'
import 'rc-slider/assets/index.css'
import ClassName from '@/styles/classNames'
import { saveImageLocally } from '@/utils/img'
import SettingGroup from '@/core/setting/SettingGroup'
import { Colors } from '@/consts'

const Moon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fill={'currentColor'}
      d="M23.4884 22.2366C23.6204 22.0993 23.4932 21.8783 23.3046 21.9057C22.8787 21.9675 22.4431 21.9995 22 21.9995C17.0294 21.9995 13 17.9701 13 12.9995C13 10.9978 13.6535 9.1486 14.7589 7.65382C14.8722 7.50063 14.7373 7.28425 14.554 7.33592C10.7721 8.40154 8 11.8768 8 15.9995C8 20.9701 12.0294 24.9995 17 24.9995C19.5492 24.9995 21.8509 23.9397 23.4884 22.2366Z"
    ></path>
  </svg>
)
const bgs = import.meta.glob('@/assets/bg/*.svg', { as: 'url', eager: true })
const AppearanceSetting = () => {
  const { t } = useTranslation()
  const [setting, setSetting] = useSetting()
  const setBg = (url: string) => {
    setSetting(
      produce(setting, draft => {
        draft.background.backgroundImage = url
      })
    )
  }
  const currentMode = setting.general.darkMode
  const followSystem = setting.general.followSystemTheme
  const ThemeItems: ISettingItem[] = [
    {
      title: t('settings.Application theme'),
      column: true,
      children: (
        <Content flex gap={18}>
          <Content flex column alignItems={'center'} gap={4}>
            <Content
              flex
              alignItems={'center'}
              justifyContent={'center'}
              onClick={() => {
                setSetting(s => ({
                  ...s,
                  general: {
                    ...s.general,
                    darkMode: false,
                    followSystemTheme: false
                  }
                }))
              }}
              style={{
                width: 90,
                height: 60,
                background: 'white',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: followSystem ? undefined : currentMode ? undefined : '0 0 0 2px var(--select-color)'
              }}
            >
              <Icon size={24} name={'park-sun'} containerStyle={{ color: 'black' }} />
            </Content>
            <div style={{ color: Colors.Font.Transparent, fontSize: 12 }}>Light</div>
          </Content>
          <Content flex column alignItems={'center'} gap={4}>
            <Content
              flex
              onClick={() => {
                setSetting(s => ({
                  ...s,
                  general: {
                    ...s.general,
                    darkMode: true,
                    followSystemTheme: false
                  }
                }))
              }}
              alignItems={'center'}
              justifyContent={'center'}
              style={{
                width: 90,
                height: 60,
                background: '#343333',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
                boxShadow: followSystem ? undefined : currentMode ? '0 0 0 2px var(--select-color)' : undefined
              }}
            >
              <Moon />
            </Content>
            <div style={{ color: Colors.Font.Transparent, fontSize: 12 }}>Dark</div>
          </Content>
          <Content flex column alignItems={'center'} gap={4}>
            <Content
              flex
              onClick={() => {
                setSetting(s => ({
                  ...s,
                  general: {
                    ...s.general,
                    followSystemTheme: !s.general.followSystemTheme
                  }
                }))
              }}
              alignItems={'center'}
              justifyContent={'center'}
              style={{
                width: 90,
                height: 60,
                background: 'linear-gradient(60deg, #dedede 10%, #198ccd 110%)',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
                boxShadow: followSystem ? '0 0 0 2px var(--select-color)' : undefined
              }}
            >
              <Icon size={24} name={'park-system'} theme={"filled"}/>
            </Content>
            <div style={{ color: Colors.Font.Transparent, fontSize: 12 }}>System</div>
          </Content>
        </Content>
      )
    }
  ]
  const BackgroundItems: ISettingItem[] = [
    {
      title: t('settings.background image'),
      column: true,
      children: (
        <Content flex column gap={10} fullWidth>
          <Content
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
              maxWidth: 500
            }}
            gap={30}
          >
            {Object.values(bgs).map(url => (
              <Image
                key={url}
                onClick={() => setBg(url)}
                src={url}
                width="100%"
                className={
                  url === setting.background.backgroundImage
                    ? css({
                        outline: '3px solid #8590ae',
                        borderRadius: 10
                      })
                    : undefined
                }
                style={{
                  borderRadius: 10,
                  cursor: 'pointer'
                }}
              />
            ))}
            <FileUploader
              dashed
              style={{ width: '100%' }}
              accept="image/*"
              onFileUploaded={file => {
                saveImageLocally(file, { compress: false }).then(data => {
                  setBg(data)
                })
              }}
            />
          </Content>
          <div className={ClassName.description('1rem')}>
            {t('settings.background opacity')}: {setting.background.backgroundOpacity || 0}
          </div>
          <Slider
            value={setting.background.backgroundOpacity}
            onChange={n =>
              setSetting(
                produce(setting, draft => {
                  draft.background.backgroundOpacity = n
                })
              )
            }
            step={0.01}
            min={0}
            max={1}
          ></Slider>
          <div className={ClassName.description('1rem')}>
            {t('settings.background blur')}: {setting.background.backgroundBlur || 0}
          </div>
          <Slider
            value={setting.background.backgroundBlur}
            onChange={n =>
              setSetting(
                produce(setting, draft => {
                  draft.background.backgroundBlur = n
                })
              )
            }
            step={1}
            min={0}
            max={100}
          ></Slider>
        </Content>
      )
    }
  ]
  return (
    <>
      <SettingGroup title={t('settings.Theme')} layout={ThemeItems} />
      {/*<SettingGroup title={t('settings.Background')} layout={BackgroundItems} />*/}
    </>
  )
}

export default AppearanceSetting
