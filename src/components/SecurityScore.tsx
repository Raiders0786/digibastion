
import { Progress } from './ui/progress';

interface SecurityScoreProps {
  score: number;
}

export const SecurityScore = ({ score }: SecurityScoreProps) => {
  return (
    <div className="bg-card p-6 rounded-lg shadow-md mb-8 animate-slide-up border border-white/10">
      <h2 className="text-2xl font-bold mb-2 text-foreground">Your Security Score</h2>
      <div className="flex items-center gap-4">
        <Progress value={score} className="flex-1" />
        <span className="text-2xl font-semibold text-primary">{score}%</span>
      </div>
    </div>
  );
};
