export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/barberia_logo.png"
              alt="BarberíaApp"
              width={80}
              height={80}
              className="rounded-2xl object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">BarberíaApp</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistema de gestión profesional</p>
        </div>
        {children}
      </div>
    </div>
  )
}
