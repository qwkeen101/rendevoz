import { Noop } from '@/common/types'
import { FC, useState } from 'react'
import { Content, Footer } from '../base'
import { PrettyInput } from '../custom/input/pretty'

const RenameDialog: FC<{ onRename: (newName: string) => void; onBack: Noop }> = ({ onRename, onBack }) => {
  const [name, setName] = useState('')
  return (
    <Content flex column justifyContent="space-between" fullHeight>
      <PrettyInput displayText="New name" onChange={e => setName(e.target.value)} />
      <Footer onBack={onBack} onSubmit={() => onRename(name)} />
    </Content>
  )
}

export default RenameDialog
