import { QueryClient } from '@tanstack/react-query'

/**
 * Single shared query client.
 *
 * Lives in its own module (rather than inside App.jsx) so non-React code —
 * notably the auth store's logout — can clear the cache. Without that, logging
 * out is only an SPA transition: the cache survives and the next user to sign
 * in on the same tab briefly sees the previous user's cached data, because no
 * query key is scoped per user.
 */
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default queryClient
