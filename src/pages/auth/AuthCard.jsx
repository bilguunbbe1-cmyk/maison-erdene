// Shared frame for the login, register and password pages.
export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="mx-auto w-full max-w-md px-5 py-16">
      <h1 className="text-center text-4xl">{title}</h1>
      {subtitle && <p className="mt-3 text-center text-sm leading-6 text-ash">{subtitle}</p>}
      <div className="mt-9">{children}</div>
    </div>
  )
}
