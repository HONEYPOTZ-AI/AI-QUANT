import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PortfolioGreeksSummary from '@/components/PortfolioGreeksSummary';
import OptionsGreeksTable from '@/components/OptionsGreeksTable';
import GreeksChart from '@/components/GreeksChart';
import PnLAttributionChart from '@/components/PnLAttributionChart';
import PnLAttributionBreakdown from '@/components/PnLAttributionBreakdown';

export default function OptionsGreeksPage() {
  const { user } = useAuth();

  // Auto-save Greeks snapshots every 5 minutes
  useEffect(() => {
    if (!user?.ID) return;

    const saveSnapshot = async () => {
      try {
        const { error } = await window.ezsite.apis.run({
          path: 'greeksSnapshotSaver',
          param: [user.ID]
        });
        
        if (error) {
          console.error('Failed to save Greeks snapshot:', error);
        }
      } catch (error) {
        console.error('Snapshot save error:', error);
      }
    };

    // Save initial snapshot
    saveSnapshot();

    // Set up interval to save every 5 minutes
    const intervalId = setInterval(saveSnapshot, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user?.ID]);

  const handleManualRefresh = async () => {
    try {
      // Trigger Greeks snapshot save
      const { error: greeksError } = await window.ezsite.apis.run({
        path: 'greeksSnapshotSaver',
        param: [user?.ID]
      });

      if (greeksError) throw new Error(greeksError);

      // Trigger P&L attribution calculation
      const { error: pnlError } = await window.ezsite.apis.run({
        path: 'pnlAttributionCalculator',
        param: [user?.ID, 'daily']
      });

      if (pnlError) throw new Error(pnlError);

      toast({
        title: "Data Refreshed",
        description: "All Greeks and P&L data has been updated successfully.",
      });

      // Force re-render by reloading the page data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SPX Options Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Real-time Greeks monitoring and P&L attribution analysis
            </p>
          </div>
          <Button onClick={handleManualRefresh} variant="outline" size="lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All Data
          </Button>
        </div>

        {/* Portfolio Greeks Summary */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Portfolio Greeks Summary</h2>
          <PortfolioGreeksSummary />
        </section>

        {/* Options Positions Table */}
        <section>
          <OptionsGreeksTable />
        </section>

        {/* Greeks Historical Chart */}
        <section>
          <GreeksChart />
        </section>

        {/* P&L Attribution */}
        <section>
          <h2 className="text-xl font-semibold mb-4">P&L Attribution Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PnLAttributionChart />
            <PnLAttributionBreakdown />
          </div>
        </section>
      </div>
    </div>
  );
}