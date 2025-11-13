import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface GreeksData {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface PortfolioGreeksSummaryProps {
  greeks: GreeksData;
  portfolioValue: number;
}

export default function PortfolioGreeksSummary({ greeks, portfolioValue }: PortfolioGreeksSummaryProps) {
  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const greeksCards = [
  {
    title: "Portfolio Delta",
    value: greeks.delta,
    description: "Directional exposure",
    format: formatNumber(greeks.delta, 3),
    color: greeks.delta >= 0 ? "text-green-600" : "text-red-600",
    icon: greeks.delta >= 0 ? TrendingUp : TrendingDown
  },
  {
    title: "Portfolio Gamma",
    value: greeks.gamma,
    description: "Delta sensitivity",
    format: formatNumber(greeks.gamma, 4),
    color: "text-blue-600"
  },
  {
    title: "Portfolio Theta",
    value: greeks.theta,
    description: "Daily time decay",
    format: formatCurrency(greeks.theta),
    color: greeks.theta >= 0 ? "text-green-600" : "text-red-600",
    icon: greeks.theta >= 0 ? TrendingUp : TrendingDown
  },
  {
    title: "Portfolio Vega",
    value: greeks.vega,
    description: "Volatility exposure",
    format: formatNumber(greeks.vega, 2),
    color: "text-purple-600"
  },
  {
    title: "Portfolio Rho",
    value: greeks.rho,
    description: "Interest rate sensitivity",
    format: formatNumber(greeks.rho, 2),
    color: "text-orange-600"
  },
  {
    title: "Portfolio Value",
    value: portfolioValue,
    description: "Total position value",
    format: formatCurrency(portfolioValue),
    color: "text-blue-600"
  }];


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {greeksCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              {Icon && <Icon className={`h-4 w-4 ${card.color}`} />}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.format}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>);

      })}
    </div>);

}