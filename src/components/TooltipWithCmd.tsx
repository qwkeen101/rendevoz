import { Content } from '@/components/index'
export default ({ cmd, name }: { cmd: string; name: string }) => {
  return (
    <Content flex column alignItems={'center'}>
      <div style={{ color: 'white', fontSize: 13 }}>{name}</div>
      <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.87)', fontWeight: 400 }}>{cmd}</div>
    </Content>
  )
}
