import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface OptionPosition {
  id: number;
  symbol: string;
  underlying: string;
  option_type: string;
  strike_price: number;
  expiration_date: string;
  quantity: number;
  current_price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  implied_volatility: number;
  underlying_price: number;
  positionValue?: number;
}

export default function OptionsGreeksTable() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['options-greeks', user?.ID],
    queryFn: async () => {
      const { data, error } = await window.ezsite.apis.run({
        path: 'optionsGreeksCalculator',
        param: [user?.ID]
      });
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!user?.ID,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000
  });

  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculatePositionValue = (quantity: number, price: number) => {
    return quantity * price * 100; // Options are typically 100 shares per contract
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load options positions'}
        </AlertDescription>
      </Alert>
    );
  }

  const positions: OptionPosition[] = data?.positions || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Options Positions</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Strike</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Delta</TableHead>
              <TableHead className="text-right">Gamma</TableHead>
              <TableHead className="text-right">Theta</TableHead>
              <TableHead className="text-right">Vega</TableHead>
              <TableHead className="text-right">Rho</TableHead>
              <TableHead className="text-right">IV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                  No options positions found
                </TableCell>
              </TableRow>
            ) : (
              positions.map((position) => (
                <TableRow key={position.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{position.symbol}</TableCell>
                  <TableCell>
                    <Badge variant={position.option_type === 'Call' ? 'default' : 'secondary'}>
                      {position.option_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(position.strike_price)}</TableCell>
                  <TableCell>{formatDate(position.expiration_date)}</TableCell>
                  <TableCell className="text-right">{position.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(position.current_price)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(calculatePositionValue(position.quantity, position.current_price))}
                  </TableCell>
                  <TableCell className={`text-right ${position.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(position.delta * position.quantity, 3)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(position.gamma * position.quantity, 4)}
                  </TableCell>
                  <TableCell className={`text-right ${position.theta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(position.theta * position.quantity * 100)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(position.vega * position.quantity, 2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(position.rho * position.quantity, 2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(position.implied_volatility * 100, 1)}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}