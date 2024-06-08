import { ButtonChooser, CheckBox, Content, Icon } from '@/components'
import { Reorder } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import _ from 'lodash'
import { Colors } from '@/consts'
import { useRef } from 'react'
import useHomeConfig from '@/scenes/home/useHomeConfig'
const GalleryConfig = () => {
  const config = useHomeConfig().gallery
  const { t } = useTranslation()
  const isDragging = useRef(false)
  const toggleVisibilty = (idx: number, v: boolean) => {
    const nextItems = config.items.slice()
    nextItems[idx].visible = v
    useHomeConfig.update(c => ({ ...c, gallery: { ...c.gallery, items: nextItems } }))
  }
  return (
    <>
      <Content style={{ padding: '2px 6px' }}>
        <div className={'menu-sub-title'} style={{ marginBottom: 2 }}>
          {t('settings.Rows per item')}
        </div>
        <ButtonChooser
          buttonSize={12}
          showValue={false}
          value={`${config.rowsPerItem}`}
          name={`${config.rowsPerItem}`}
          options={_.range(1, 5).map(i => i.toString())}
          onChange={v => {
            const n = parseInt(v)
            if (n >= 1 && n <= 5) {
              useHomeConfig.update(c => ({ ...c, gallery: { ...c.gallery, rowsPerItem: n } }))
            }
          }}
        />
      </Content>
      <div className={'menu-sub-title'} style={{ padding: '2px 6px' }}>
        {t('settings.Visible items')}
      </div>
      <Reorder.Group
        as={'div'}
        onReorder={v => useHomeConfig.update(c => ({ ...c, gallery: { ...c.gallery, items: v } }))}
        values={config.items}
      >
        {config.items.map((l, index) => (
          <Reorder.Item
            onDragStart={() => (isDragging.current = true)}
            onDragEnd={() => {
              setTimeout(() => {
                isDragging.current = false
              })
            }}
            as={'div'}
            value={l}
            key={l.name}
          >
            <Content
              flex
              gap={10}
              onClick={e => {
                if ((e.target as HTMLInputElement).closest('input')) return
                if (isDragging.current) return
                toggleVisibilty(index, !l.visible)
              }}
              alignItems={'center'}
              className={'button'}
            >
              <CheckBox
                checked={l.visible}
                onChange={v => {
                  toggleVisibilty(index, !l.visible)
                }}
              ></CheckBox>
              <div>{t(`general.${l.name}`)}</div>
              <Icon
                name={'park-drag'}
                style={{
                  marginLeft: 'auto',
                  cursor: 'grab',
                  color: Colors.Font.SuperTransparent
                }}
              />
            </Content>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </>
  )
}

export default GalleryConfig
