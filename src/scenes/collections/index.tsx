import Collection from '@/components/collection'
import Container from '@/components/base/container'
import { FC } from 'react'
import { Content } from '@/components'

const Collections: FC = () => {
  return (
    <Container auto>
      <Content flex fullHeight fullWidth justifyContent="center">
        <Collection
          useRoute={false}
          hideDocuments={false}
          hideExtra={false}
          hideNotes={false}
          style={{ height: 'calc( 100vh - 30px )', padding: '50px 70px', maxWidth: 1300 }}
        />
      </Content>
    </Container>
  )
}
export default Collections
