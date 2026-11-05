import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'

const WishlistContext = createContext(null)
export const useWishlist = () => useContext(WishlistContext)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id
  const [ids, setIds] = useState(() => new Set())

  useEffect(() => {
    if (!userId) {
      setIds(new Set())
      return
    }
    supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', userId)
      .then(({ data }) => setIds(new Set((data ?? []).map((row) => row.product_id))))
  }, [userId])

  const toggle = useCallback(
    async (productId) => {
      if (ids.has(productId)) {
        await unwrap(
          supabase.from('wishlist_items').delete().eq('user_id', userId).eq('product_id', productId),
        )
        setIds((previous) => {
          const next = new Set(previous)
          next.delete(productId)
          return next
        })
        return false
      }
      await unwrap(supabase.from('wishlist_items').insert({ user_id: userId, product_id: productId }))
      setIds((previous) => new Set(previous).add(productId))
      return true
    },
    [ids, userId],
  )

  const value = useMemo(() => ({ ids, toggle }), [ids, toggle])
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
