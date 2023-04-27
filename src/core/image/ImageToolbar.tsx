import { AnimatePopover, Button, ColorPicker, Content, Icon, IconWithPopover, Slider, Toolbar, WithBorder } from '@/components'
import ClassName from '@/styles/classNames'
import { useAtomValue } from 'jotai'
import { useTranslation } from 'react-i18next'
import { CanvasManagerAtom } from './ImageDisplayer'
import { IconNameItem } from '@/components/layout/sidebar/SidebarCollection'
import { useState } from 'react'
import { defaultBgColor } from '@/components/picker/colorPicker'

const ImageToolbar = () => {
  const canvasManager = useAtomValue(CanvasManagerAtom)
  const { t } = useTranslation()
  const [color, setColor] = useState<string>()
  const [eraserSize, setEraserSize] = useState<number>(10)
  const [drawSize, setDrawSize] = useState<number>(4)
  const [mode, setMode] = useState<'draw' | 'erase' | 'move'>('draw')
  if (!canvasManager) return null
  return (
    <Toolbar>
      <Toolbar.Item
        isActive={mode === 'move'}
        iconName="park-move"
        onClick={() => {
          canvasManager.setMode('move')
          setMode('move')
        }}
      ></Toolbar.Item>
      <Toolbar.Item isActive={mode === 'draw'}>
        <Content
          flex
          alignItems="center"
          gap={10}
          onClick={() => {
            setMode('draw')
            canvasManager.setMode('draw')
            canvasManager.setDrawMode('draw')
          }}
        >
          <IconNameItem
            icon="park-pencil"
            name={t('image.draw')}
            style={{
              color: color === defaultBgColor ? undefined : color
            }}
          />
          <IconWithPopover
            name="park-down"
            placement={['bottom']}
            closeOnContentClick={false}
            content={
              <WithBorder padding={10} style={{ width: 240 }}>
                <div>{t('image.draw color')}</div>
                <ColorPicker
                  enableMore
                  disableLinear
                  onPick={c => {
                    if (c === defaultBgColor) {
                      canvasManager.setPencilColor('black')
                    } else {
                      canvasManager.setPencilColor(c)
                    }
                    setColor(c)
                  }}
                />
                <div>
                  {t('image.draw size')}: {drawSize}
                </div>
                <Slider
                  value={drawSize}
                  step={1}
                  onChange={v => {
                    setDrawSize(v)
                    canvasManager.setPencilSize(v)
                  }}
                  min={1}
                  max={100}
                />
              </WithBorder>
            }
          />
        </Content>
      </Toolbar.Item>
      <Toolbar.Item isActive={mode === 'erase'}>
        <Content
          flex
          gap={10}
          alignItems="center"
          onClick={() => {
            canvasManager.setMode('draw')
            setMode('erase')
            canvasManager.setDrawMode('erase')
          }}
        >
          <IconNameItem icon="park-erase" name={t('image.erase')} />
          <IconWithPopover
            name="park-down"
            placement={['bottom']}
            content={
              <WithBorder padding={10}>
                <div>
                  {t('image.eraser size')}: {eraserSize}
                </div>
                <Slider
                  value={eraserSize}
                  step={1}
                  onChange={v => {
                    setEraserSize(v)
                    canvasManager.setEraserSize(v)
                  }}
                  min={1}
                  max={100}
                />
              </WithBorder>
            }
          />
        </Content>
      </Toolbar.Item>
    </Toolbar>
  )
}

export default ImageToolbar
