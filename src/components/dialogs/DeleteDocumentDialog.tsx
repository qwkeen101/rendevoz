import { Noop } from '@/common/types'
import { Content, Footer } from '../base'

const DeleteDocumentDialog = ({ onBack, onSubmit }: { onBack: Noop; onSubmit: Noop }) => {
  return (
    <Content flex column fullHeight fullWidth justifyContent="space-between">
      <Content flex column centered gap={20}>
        <div style={{ fontSize: 22, fontWeight: 600 }}>Delete file</div>
        <div>Are you sure you want to delete this file?</div>
        <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginBottom: 24 }}>You can recover it from bin later</div>
      </Content>
      <Footer onBack={onBack} onSubmit={onSubmit}></Footer>
    </Content>
  )
}

export default DeleteDocumentDialog
