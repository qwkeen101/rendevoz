import { Noop } from '@/common/types'
import { FC, useState } from 'react'
import { Content, Footer } from '../base'
import { PrettyInput } from '../custom/input/pretty'

const RenameDialog: FC<{ onRename: (newName: string) => void; onBack: Noop }> = ({ onRename, onBack }) => {
  const [name, setName] = useState('')
  return (
    <Content flex column justifyContent="space-between" fullHeight>
      <Content flex column style={{ height: 300 }}>
        <div style={{ fontWeight: 600, fontSize: 20 }}>Rename file</div>
        <PrettyInput displayText="New name" onChange={e => setName(e.target.value)} />
      </Content>
      <Footer onBack={onBack} onSubmit={() => onRename(name)} />
    </Content>
  )
}

export default RenameDialog
