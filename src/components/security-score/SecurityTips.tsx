
import { Shield } from 'lucide-react';
import { ThreatLevel } from '../../types/threatProfile';

interface SecurityTipsProps {
  score: number;
  threatLevel: ThreatLevel;
}

export const SecurityTips = ({ score, threatLevel }: SecurityTipsProps) => {
  const getSecurityTips = (score: number) => {
    if (score < 50) {
      return [
        'Focus on completing essential security tasks first.',
        'Set up hardware wallets for your crypto assets.',
        'Enable 2FA on all your Web3 accounts.',
        'Use wallet-based authentication where available.',
        'Create secure backups of your wallet seed phrases.',
        `Use a secure password manager (see https://www.privacyguides.org/en/passwords/).`,
      ];
    } else if (score < 80) {
      return [
        'Good progress! Consider implementing recommended security measures.',
        'Set up multi-signature wallets for extra protection.',
        'Use separate hot and cold wallets for different purposes.',
        'Regularly audit your Web3 platform permissions.',
        'Consider using hardware security keys for critical accounts.',
        'Consider using a dedicated device for crypto transactions.',
      ];
    } else {
      return [
        'Excellent security practices! Keep maintaining and updating your measures.',
        'Regularly review and rotate your backup strategies.',
        'Stay updated with the latest Web3 security practices.',
        'Consider advanced features like hardware security keys.',
        'Consider wallet-based authentication for all compatible services.',
        'Help others improve their security practices.',
      ];
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <h3 className="text-sm font-medium mb-2">Security Tips</h3>
      <div className="space-y-2">
        {getSecurityTips(score).map((tip, index) => (
          <div key={`${index}-${threatLevel}`} className="flex items-start gap-2 text-xs text-foreground-secondary">
            <Shield className="w-3 h-3 text-primary shrink-0 mt-0.5" />
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
