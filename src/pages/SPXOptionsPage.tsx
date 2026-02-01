import Sidebar from '@/components/Sidebar';
import SPXVIXDisplay from '@/components/SPXVIXDisplay';
import SPXOptionsChain from '@/components/SPXOptionsChain';
import OptionsGreeksTable from '@/components/OptionsGreeksTable';
import GreeksChart from '@/components/GreeksChart';

export default function SPXOptionsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              SPX Options Trading
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Real-time SPX index price and options chain with live Greeks
            </p>
          </div>

          {/* SPX & VIX Display */}
          <SPXVIXDisplay />

          {/* Options Chain */}
          <SPXOptionsChain />

          {/* Portfolio Greeks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OptionsGreeksTable />
            <GreeksChart />
          </div>
        </div>
      </main>
    </div>);

}