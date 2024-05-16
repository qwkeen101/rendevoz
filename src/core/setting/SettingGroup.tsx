import { Content } from '@/components'
import { ClassName } from 'rendevoz'
import SettingItem, { ISettingItem } from '@/core/setting/SettingItem'
import { Colors } from '@/consts'
import { ReactNode } from 'react'

const SettingGroup = ({ title, layout, extra, gap = 16 }: { title: string; layout: ISettingItem[]; extra?: ReactNode; gap?: number }) => {
  return (
    <Content flex column>
      <Content
        style={{
          marginBottom: 16,
          paddingBottom: 8,
          userSelect: 'none',
          borderBottom: `1px solid ${Colors.Background.Border}`
        }}
        flex
        justifyContent={'space-between'}
        alignItems={'flex-end'}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 500
          }}
        >
          {title}
        </div>
        {extra}
      </Content>
      <Content flex column gap={gap}>
        {layout.map((i, idx) => (
          <SettingItem key={idx} {...i} />
        ))}
      </Content>
    </Content>
  )
}

export default SettingGroup
