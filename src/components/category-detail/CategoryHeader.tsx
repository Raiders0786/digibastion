
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CategoryHeaderProps {
  title: string;
  description: string;
  completedCount: number;
  totalItems: number;
}

export const CategoryHeader = ({ title, description, completedCount, totalItems }: CategoryHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Overview
      </Button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-lg text-foreground-secondary">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary mb-1">{completedCount}/{totalItems}</div>
          <div className="text-sm text-foreground-secondary">Items completed</div>
        </div>
      </div>
    </>
  );
};
