import { Content } from '@/components/index'
import { memo } from 'react'
export default memo(({ cmd, name }: { cmd: string; name: string }) => {
  return (
    <Content flex column alignItems={'center'}>
      <div style={{ color: 'white', fontSize: 13, marginBottom: 3, padding: '0 3px' }}>{name}</div>
      <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.87)', fontWeight: 400 }}>{cmd}</div>
    </Content>
  )
})
