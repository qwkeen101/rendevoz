import { Button, Content } from '@/components'

export default () => {
  const actions: {
    text: string
    icon: string
    onClick: VoidFunction
  }[] = [
    {
      text: 'Hide',
      icon: 'park-preview-close-one',
      onClick: () => {}
    }
  ]
  return (
    <Content flex column>
      {actions.map(i => (
        <Button.IconButton text={i.text} key={i.text} icon={i.icon} onClick={i.onClick} />
      ))}
    </Content>
  )
}
