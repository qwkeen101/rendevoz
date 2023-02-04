import AuthenticatedLayout from '@/components/base/authenticatedLayout'
import { useLocation } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorFallback from '@/components/base/ErrorFallBack'
import { GlobalLocationContextProvider } from './globalLocation'

const Routes = () => {
  const location = useLocation()

  return (
    <GlobalLocationContextProvider value={location}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <AuthenticatedLayout />
      </ErrorBoundary>
    </GlobalLocationContextProvider>
  )
}
export default Routes
