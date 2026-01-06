import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ChallengeButtonProps {
  score?: number;
  variant?: 'default' | 'outline';
  className?: string;
}

export const ChallengeButton = ({ score, variant = 'outline', className = '' }: ChallengeButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [friendHandle, setFriendHandle] = useState('');

  const handleChallenge = () => {
    const handle = friendHandle.replace('@', '').trim();
    if (!handle) return;

    const quizUrl = 'https://digibastion.com/quiz';
    let tweetText = '';

    if (score !== undefined) {
      tweetText = `Hey @${handle}! 🔥 I just scored ${score}/100 on the @digibastion OpSec Quiz. Think you can beat me? 💀\n\nTake the challenge 👇\n${quizUrl}`;
    } else {
      tweetText = `Hey @${handle}! 🛡️ How secure is YOUR crypto OpSec?\n\nI challenge you to take the @digibastion security quiz and share your score! 🔐\n\n${quizUrl}`;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
    setIsOpen(false);
    setFriendHandle('');
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant={variant}
        className={`gap-2 ${className}`}
      >
        <Users className="w-4 h-4" />
        Challenge a Friend
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Challenge a Friend
            </DialogTitle>
            <DialogDescription>
              Enter your friend's X handle to challenge them to beat your score!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="handle" className="text-sm font-medium text-foreground">
                Friend's X Handle
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="handle"
                  value={friendHandle}
                  onChange={(e) => setFriendHandle(e.target.value)}
                  placeholder="their_handle"
                  className="pl-8"
                  onKeyDown={(e) => e.key === 'Enter' && handleChallenge()}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleChallenge}
                disabled={!friendHandle.trim()}
                className="flex-1 gap-2"
              >
                <Users className="w-4 h-4" />
                Send Challenge
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};