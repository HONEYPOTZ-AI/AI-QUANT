import SPXPriceHeader from '@/components/SPXPriceHeader';
import SPXOptionsChain from '@/components/SPXOptionsChain';

export default function SPXOptionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">SPX Options Trading</h1>
          <p className="text-muted-foreground">
            Real-time S&P 500 index price and options chain data
          </p>
        </div>

        {/* SPX Price Display */}
        <SPXPriceHeader />

        {/* Options Chain */}
        <SPXOptionsChain />
      </div>
    </div>);

}