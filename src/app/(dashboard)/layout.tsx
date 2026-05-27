import { Sidebar }        from '@/components/layout/Sidebar'
import { Header }         from '@/components/layout/Header'
import { DataPrefetcher } from '@/components/DataPrefetcher'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DataPrefetcher />
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
