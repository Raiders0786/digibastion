import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, X, Brain, AlertTriangle, BookOpen } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { TouchFeedback } from './TouchFeedback';

interface FABAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

export const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const actions: FABAction[] = [
    {
      id: 'quiz',
      icon: <Brain className="w-5 h-5" />,
      label: 'Security Quiz',
      color: 'from-purple-500 to-violet-600',
      onClick: () => {
        navigate('/quiz');
        setIsOpen(false);
      },
    },
    {
      id: 'alerts',
      icon: <AlertTriangle className="w-5 h-5" />,
      label: 'Threat Alerts',
      color: 'from-red-500 to-orange-600',
      onClick: () => {
        navigate('/threat-intel?tab=alerts');
        setIsOpen(false);
      },
    },
    {
      id: 'articles',
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Security Articles',
      color: 'from-blue-500 to-cyan-600',
      onClick: () => {
        navigate('/articles');
        setIsOpen(false);
      },
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col-reverse items-end gap-3">
        {/* Action buttons */}
        <AnimatePresence>
          {isOpen && actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                transition: { 
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25
                }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.3, 
                y: 20,
                transition: { delay: (actions.length - index - 1) * 0.03 }
              }}
              className="flex items-center gap-3"
            >
              {/* Label */}
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 + 0.1 } }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-card text-foreground text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg border border-border whitespace-nowrap"
              >
                {action.label}
              </motion.span>
              
              {/* Button */}
              <TouchFeedback>
                <button
                  onClick={action.onClick}
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.color} text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform`}
                >
                  {action.icon}
                </button>
              </TouchFeedback>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Main FAB */}
        <TouchFeedback>
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl flex items-center justify-center"
            style={{
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            }}
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Shield className="w-6 h-6" />
            )}
          </motion.button>
        </TouchFeedback>
      </div>
    </>
  );
};
