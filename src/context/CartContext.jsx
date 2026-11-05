import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

const MAX_PER_ITEM = 10

export function CartProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await unwrap(
        supabase
          .from('cart_items')
          .select(
            'product_id, quantity, product:products(id, name, slug, price, stock, is_active, color, product_images(url, position))',
          )
          .eq('user_id', userId)
          .order('created_at'),
      )
      setItems(rows)
    } catch (fetchError) {
      setError(fetchError)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setQuantity = useCallback(
    async (productId, quantity) => {
      await unwrap(
        supabase
          .from('cart_items')
          .upsert({ user_id: userId, product_id: productId, quantity }),
      )
      await refresh()
    },
    [userId, refresh],
  )

  const addItem = useCallback(
    async (product) => {
      const current = items.find((item) => item.product_id === product.id)?.quantity ?? 0
      const next = current + 1
      if (next > Math.min(product.stock, MAX_PER_ITEM)) {
        throw new Error('Үлдэгдлээс илүү тоогоор нэмэх боломжгүй.')
      }
      await setQuantity(product.id, next)
    },
    [items, setQuantity],
  )

  const removeItem = useCallback(
    async (productId) => {
      await unwrap(
        supabase.from('cart_items').delete().eq('user_id', userId).eq('product_id', productId),
      )
      await refresh()
    },
    [userId, refresh],
  )

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0)
    // The displayed total only. The order total is calculated again in SQL.
    const total = items.reduce(
      (sum, item) => sum + (item.product ? Number(item.product.price) * item.quantity : 0),
      0,
    )
    return { items, count, total, loading, error, refresh, addItem, setQuantity, removeItem, MAX_PER_ITEM }
  }, [items, loading, error, refresh, addItem, setQuantity, removeItem])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
