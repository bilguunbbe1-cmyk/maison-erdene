import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { PageLoader } from './components/ui.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Verify from './pages/Verify.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import Cart from './pages/account/Cart.jsx'
import Checkout from './pages/account/Checkout.jsx'
import Orders from './pages/account/Orders.jsx'
import OrderDetail from './pages/account/OrderDetail.jsx'
import Wishlist from './pages/account/Wishlist.jsx'
import Profile from './pages/account/Profile.jsx'
import NotFound from './pages/NotFound.jsx'

// Admin pages load separately so shoppers never download the chart library.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'))
const AdminProducts = lazy(() => import('./pages/admin/Products.jsx'))
const ProductForm = lazy(() => import('./pages/admin/ProductForm.jsx'))
const Taxonomy = lazy(() => import('./pages/admin/Taxonomy.jsx'))
const AdminOrders = lazy(() => import('./pages/admin/Orders.jsx'))
const Users = lazy(() => import('./pages/admin/Users.jsx'))
const Payments = lazy(() => import('./pages/admin/Payments.jsx'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<Layout />}>
                  {/* Guest */}
                  <Route index element={<Home />} />
                  <Route path="shop" element={<Shop />} />
                  <Route path="products/:slug" element={<ProductDetail />} />
                  <Route path="verify" element={<Verify />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="reset-password" element={<ResetPassword />} />

                  {/* Signed-in customer */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:id" element={<OrderDetail />} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* Administrator */}
                <Route element={<ProtectedRoute requireAdmin />}>
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<ProductForm />} />
                    <Route path="products/:id" element={<ProductForm />} />
                    <Route
                      path="categories"
                      element={<Taxonomy key="categories" table="categories" title="Ангилал" />}
                    />
                    <Route
                      path="collections"
                      element={<Taxonomy key="collections" table="collections" title="Цуглуулга" />}
                    />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="users" element={<Users />} />
                    <Route path="payments" element={<Payments />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
            <Toaster
              position="bottom-center"
              toastOptions={{
                style: {
                  background: '#14110f',
                  color: '#f8f5ef',
                  borderRadius: 0,
                  fontSize: 13,
                },
              }}
            />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
