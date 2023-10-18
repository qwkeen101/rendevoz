import { Content } from '@/components'
import { ClassName } from 'rendevoz'
import SettingItem, { ISettingItem } from '@/core/setting/SettingItem'
import { Colors } from '@/consts'

const SettingGroup = ({ title, layout }: { title: string; layout: ISettingItem[] }) => {
  return (
    <Content flex column>
      <div
        className={ClassName.title()}
        style={{
          marginBottom: 10,
          paddingBottom: 8,
          fontWeight: 800,
          borderBottom: `1px solid ${Colors.Background.Border}`
        }}
      >
        {title}
      </div>
      <Content flex column gap={18}>
        {layout.map(i => (
          <SettingItem key={i.title} {...i} />
        ))}
      </Content>
    </Content>
  )
}

export default SettingGroup
