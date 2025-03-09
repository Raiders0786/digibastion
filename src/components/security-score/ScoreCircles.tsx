
import { SecurityStats } from '../../types/security';
import { ThreatLevel } from '../../types/threatProfile';

interface ScoreCirclesProps {
  stats: SecurityStats;
  threatLevel: ThreatLevel;
}

export const ScoreCircles = ({ stats, threatLevel }: ScoreCirclesProps) => {
  const securityLevels = [
    { label: 'Essential', value: stats.essential, color: 'green', description: 'Must-have security measures' },
    { label: 'Recommended', value: stats.optional, color: 'yellow', description: 'Additional protection layers' },
    { label: 'Advanced', value: stats.advanced, color: 'blue', description: 'Expert-level security' }
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {securityLevels.map(({ label, value, color, description }) => (
        <div key={`${label}-${threatLevel}`} className="relative group">
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  className={`stroke-${color}-500/10`}
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  className={`stroke-${color}-500`}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - value / 100)}`}
                  style={{
                    transition: 'stroke-dashoffset 0.5s ease-in-out'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold text-${color}-400`}>{value}%</span>
              </div>
            </div>
            <h3 className="mt-2 text-sm font-medium text-foreground">{label}</h3>
            <p className="text-xs text-foreground-secondary mt-1">{description}</p>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full bg-background p-2 rounded shadow-lg text-xs w-48 text-center pointer-events-none z-10">
            {description}
          </div>
        </div>
      ))}
    </div>
  );
};
