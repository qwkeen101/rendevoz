import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Content } from './base'

const upgradeClassName = css({
  boxShadow: '0px 0px 0px 3px #8590ae',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  padding: '4px 30px',
  flexDirection: 'column',
  borderRadius: '4px',
  cursor: 'pointer',
  '> span': {
    fontSize: 20,
    fontWeight: 600
  },
  '> p': {
    fontSize: 13,
    marginBottom: 0
  }
})
const UpgradePlan = () => {
  return (
    <Content flex column style={{ fontFamily: 'Muli' }}>
      <div className={ClassName.title('24px')}>Rendevoz Pro</div>
      <div className={ClassName.description()}>升级成为Rendevoz会员解锁全部功能，并可以率先体验新功能。</div>
      <Content
        flex
        justifyContent="space-between"
        gap={30}
        className={css({
          '> div': upgradeClassName,
          marginTop: 30
        })}
      >
        <div>
          <p>一个月</p>
          <span>¥15.00</span>
        </div>
        <div>
          <p>六个月</p>
          <span>¥90.00</span>
        </div>
        <div>
          <p>一年</p>
          <span>¥128.00</span>
        </div>
      </Content>
      <Content
        flex
        gap={10}
        justifyContent="space-around"
        className={css({
          '> div': css([ClassName.description(), { textDecoration: 'underline' }]),
          marginTop: 20
        })}
      >
        <div>隐私政策</div>
        <div>退款政策</div>
        <div>服务条款</div>
      </Content>
      <div className={ClassName.description()} style={{marginTop: 30}}>由苏州高凰信息科技发展有限公司为您提供服务</div>
    </Content>
  )
}

export default UpgradePlan
