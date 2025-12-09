
import { 
  Shield, 
  Share2, 
  Wallet, 
  Laptop, 
  Database, 
  Building2, 
  User, 
  Mail, 
  Smartphone, 
  Key,
  Globe,
  CreditCard,
  ShieldAlert
} from 'lucide-react';

interface CategoryIconProps {
  iconName: string;
}

export const CategoryIcon = ({ iconName }: CategoryIconProps) => {
  switch (iconName) {
    case 'Share2':
      return <Share2 className="w-4 h-4" />;
    case 'Wallet':
      return <Wallet className="w-4 h-4" />;
    case 'Laptop':
      return <Laptop className="w-4 h-4" />;
    case 'Database':
      return <Database className="w-4 h-4" />;
    case 'Building2':
      return <Building2 className="w-4 h-4" />;
    case 'User':
      return <User className="w-4 h-4" />;
    case 'Mail':
      return <Mail className="w-4 h-4" />;
    case 'Smartphone':
      return <Smartphone className="w-4 h-4" />;
    case 'Key':
      return <Key className="w-4 h-4" />;
    case 'Globe':
      return <Globe className="w-4 h-4" />;
    case 'CreditCard':
      return <CreditCard className="w-4 h-4" />;
    case 'ShieldAlert':
      return <ShieldAlert className="w-4 h-4" />;
    default:
      return <Shield className="w-4 h-4" />;
  }
};
