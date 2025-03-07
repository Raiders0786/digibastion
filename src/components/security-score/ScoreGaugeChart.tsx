
import { Gauge } from 'lucide-react';

interface ScoreGaugeChartProps {
  score: number;
  getScoreColor: (score: number) => string;
}

export const ScoreGaugeChart = ({ score, getScoreColor }: ScoreGaugeChartProps) => {
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="relative w-48 h-24 mx-auto mb-6">
      <div className="absolute inset-0">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 5 45 A 40 40 0 0 1 95 45"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-secondary/30"
          />
          {/* Score arc */}
          <path
            d={`M 5 45 A 40 40 0 0 1 ${5 + (90 * score) / 100} 45`}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className={`${getProgressColor(score)} transition-all duration-1000`}
          />
          {/* Gauge Icon */}
          <Gauge 
            className={`w-6 h-6 ${getScoreColor(score)}`} 
            style={{ 
              transform: `rotate(${(score / 100) * 180 - 90}deg) translate(50px, 45px)` 
            }} 
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</span>
        </div>
      </div>
    </div>
  );
};
