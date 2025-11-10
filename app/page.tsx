import PayrollTable from './components/PayrollTable'

export default function Page() {
  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Sheet</h1>
        <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-gray-700">Deployed on Vercel</a>
      </header>
      <PayrollTable />
    </main>
  )
}
