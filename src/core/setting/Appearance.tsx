import { Content, FileUploader, Image } from '@/components'
import { useTranslation } from 'react-i18next'
import SettingItem from './Item'
import { useSetting } from '.'
import produce from 'immer'
import { css } from '@emotion/css'
import { Slider } from '@/components'
import 'rc-slider/assets/index.css'
import ClassName from '@/styles/classNames'
import { saveImageLocally } from '@/utils/img'

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
  const appearance: SettingItem[] = [
    {
      title: t('settings.background'),
      column: true,
      childrenContainerStyle: {
        maxHeight: '100%',
        overflowY: 'auto',
        padding: '5px 30px',
        margin: '0 -30px'
      },
      children: (
        <Content flex column gap={10} fullWidth>
          <Content style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }} gap={30}>
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
                  console.log(data)
                  setBg(data.data)
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
    <Content flex column fullHeight>
      {appearance.map(i => (
        <SettingItem {...i} />
      ))}
    </Content>
  )
}

export default AppearanceSetting
