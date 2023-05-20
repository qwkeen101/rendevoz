import ClassName from '@/styles/classNames'
import { Content, Icon } from './base'
import { useSetting } from '@/core'
import Colors from '@/consts/colors'

const FreePlanIncludes = ['最多创建300个实体', '查看实体关系图', '每月最多50次翻译（登录后）', '全文搜索已有笔记，PDF，网页']
const ProPlanIncludes = [
  '解锁全部本地功能，无限制使用',
  '无限翻译次数',
  '每月最多200次图片文字识别（识别后可搜索图片）',
  '10GB文件云存储*',
  '优先客户支持'
]

const UpgradePlan = () => {
  const [setting] = useSetting()
  if (setting.general.language === 'en-US') {
    return <div>Not Avaliable Outside China Mainland Right Now.</div>
  }
  return (
    <Content
      flex
      column
      className={ClassName.Background.pseudoBlurContrastBackground}
      style={{
        padding: '24px 60px',
        borderRadius: 10
      }}
    >
      <Content
        flex
        alignItems="center"
        justifyContent="space-between"
        gap={40}
        style={{
          borderBottom: `1px solid ${Colors.Background.Border}`,
          padding: '40px 0px'
        }}
      >
        <Content flex column gap={10}>
          <div className={ClassName.title()}>免费账户</div>
          <div className={ClassName.description()}>￥0 / 月</div>
        </Content>
        <Content flex column gap={6} style={{ width: 250 }}>
          {FreePlanIncludes.map(i => (
            <Content flex gap={6} key={i}>
              <Icon fill={'rgb(34,197,94)'} name="park-check" />
              <div>{i}</div>
            </Content>
          ))}
        </Content>
      </Content>

      <Content flex gap={40} alignItems="center" style={{ padding: '40px 0px' }} justifyContent="space-between">
        <Content flex column gap={10}>
          <div className={ClassName.title()}>标准账户</div>
          <Content flex className={ClassName.description()}>
            ￥15 / 月或 <span style={{ textDecoration: 'line-through', marginRight: 6 }}>￥158</span>
            <span>￥108{' (早鸟特惠) '} </span> / 年
          </Content>
        </Content>
        <Content flex column gap={6} style={{ width: 250 }}>
          {ProPlanIncludes.map(i => (
            <Content flex gap={6} key={i}>
              <Icon fill={'rgb(34,197,94)'} name="park-check" />
              <div>{i}</div>
            </Content>
          ))}
          <div style={{ marginTop: 15 }} className={ClassName.description('11px')}>
            带*为当前版本暂未上线的功能
          </div>
        </Content>
      </Content>
      <div className={ClassName.description()}>如需要升级账户请加入官方QQ群：704637839。Rendeovz因为您的支持而变得更好❤️！</div>
    </Content>
  )
}

export default UpgradePlan
