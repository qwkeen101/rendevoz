import { Content } from '@/components'
export default ({ cmd, name }: { cmd: string; name: string }) => {
  return (
    <Content style={{ fontWeight: 500 }} flex column alignItems={'center'}>
      <div style={{ color: 'white', fontSize: 14 }}>{name}</div>
      <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.52)' }}>{cmd}</div>
    </Content>
  )
}
