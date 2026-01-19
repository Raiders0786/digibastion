import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Clock } from 'lucide-react';
import { NewsCategory, SeverityLevel } from '@/types/news';
import { newsCategoryConfig } from '@/data/newsData';

interface EmailPreviewProps {
  categories: NewsCategory[];
  frequency: 'immediate' | 'daily' | 'weekly';
  severity: SeverityLevel;
  name?: string;
  preferredHour?: number;
  timezoneOffset?: number;
  preferredDay?: number;
}

// Mock articles for preview
const mockArticles = [
  {
    title: "Critical RCE Vulnerability in Popular DeFi Protocol",
    summary: "A severe remote code execution flaw affecting smart contract interactions has been discovered. Immediate patching recommended.",
    severity: "critical",
    category: "defi",
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    cve_id: "CVE-2024-1234",
    link: "#",
  },
  {
    title: "High-Severity Phishing Campaign Targeting Wallet Users",
    summary: "New sophisticated phishing attacks impersonating major wallet providers detected across social media platforms.",
    severity: "high",
    category: "wallet",
    published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    cve_id: null,
    link: "#",
  },
  {
    title: "Medium-Risk API Exposure in Exchange Platform",
    summary: "Security researchers disclosed an API vulnerability that could leak partial user data under specific conditions.",
    severity: "medium",
    category: "exchange",
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    cve_id: null,
    link: "#",
  },
  {
    title: "Bridge Protocol Security Audit Reveals Issues",
    summary: "A comprehensive audit of a popular cross-chain bridge identified potential vulnerabilities in the validation logic.",
    severity: "low",
    category: "defi",
    published_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    cve_id: null,
    link: "#",
  },
];

const severityRank: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#eab308';
    case 'low': return '#3b82f6';
    default: return '#6b7280';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDeliveryTime(hour: number, offset: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const sign = offset >= 0 ? '+' : '';
  return `${displayHour}:00 ${period} UTC${sign}${offset}`;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const EmailPreview = ({ 
  categories, 
  frequency, 
  severity, 
  name,
  preferredHour = 9,
  timezoneOffset = 0,
  preferredDay = 0
}: EmailPreviewProps) => {
  // Filter mock articles based on preferences
  const thresholdRank = severityRank[severity] ?? 2;
  const filteredArticles = mockArticles.filter(article => {
    const articleRank = severityRank[article.severity] ?? 4;
    if (articleRank > thresholdRank) return false;
    if (categories.length > 0 && !categories.includes(article.category as NewsCategory)) return false;
    return true;
  });

  const criticalArticles = filteredArticles.filter(a => a.severity === 'critical');
  const highArticles = filteredArticles.filter(a => a.severity === 'high');
  const otherArticles = filteredArticles.filter(a => !['critical', 'high'].includes(a.severity));

  const periodLabel = frequency === 'weekly' ? 'Weekly' : 'Daily';
  const displayName = name || 'Security Professional';
  const periodStart = new Date(Date.now() - (frequency === 'weekly' ? 7 : 1) * 24 * 60 * 60 * 1000);
  const periodEnd = new Date();
  const dateRange = `${formatDate(periodStart.toISOString())} - ${formatDate(periodEnd.toISOString())}`;
  const deliveryTime = formatDeliveryTime(preferredHour, timezoneOffset);
  const deliverySchedule = frequency === 'weekly' 
    ? `${dayNames[preferredDay]}s at ${deliveryTime}`
    : `Daily at ${deliveryTime}`;

  const renderArticle = (article: typeof mockArticles[0]) => (
    <tr key={article.title}>
      <td style={{ padding: '12px 0', borderBottom: '1px solid #333' }}>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ 
            background: getSeverityColor(article.severity), 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontSize: '11px', 
            textTransform: 'uppercase' as const 
          }}>
            {article.severity}
          </span>
          <span style={{ color: '#6b7280', fontSize: '11px', marginLeft: '8px' }}>
            {formatDate(article.published_at)}
          </span>
          {article.cve_id && (
            <span style={{ 
              background: '#4b5563', 
              color: 'white', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              fontSize: '10px', 
              marginLeft: '8px' 
            }}>
              {article.cve_id}
            </span>
          )}
        </div>
        <a href={article.link} style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 500, fontSize: '14px', lineHeight: 1.4 }}>
          {article.title}
        </a>
        <p style={{ margin: '6px 0 0 0', color: '#9ca3af', fontSize: '13px', lineHeight: 1.4 }}>
          {article.summary.slice(0, 150)}{article.summary.length > 150 ? '...' : ''}
        </p>
      </td>
    </tr>
  );

  const renderSection = (title: string, sectionArticles: typeof mockArticles, bgColor: string) => {
    if (sectionArticles.length === 0) return null;
    return (
      <>
        <tr>
          <td style={{ padding: '16px 0 8px 0' }}>
            <h3 style={{ margin: 0, color: bgColor, fontSize: '14px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
              {title} ({sectionArticles.length})
            </h3>
          </td>
        </tr>
        {sectionArticles.map(renderArticle)}
      </>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="w-4 h-4" />
          Preview Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Email Preview
          </DialogTitle>
        </DialogHeader>
        
        {/* Email Preview */}
        <div style={{ backgroundColor: '#111827', padding: '16px' }}>
          <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#1f2937', borderRadius: '8px', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            {/* Header */}
            <tbody>
              <tr>
                <td style={{ padding: '24px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}>
                  <h1 style={{ margin: 0, color: 'white', fontSize: '22px' }}>📊 {periodLabel} Security Digest</h1>
                  <p style={{ margin: '6px 0 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                    {dateRange}
                  </p>
                </td>
              </tr>
              
              {/* Summary Stats */}
              <tr>
                <td style={{ padding: '20px 24px' }}>
                  <table width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <tr>
                        <td width="33%" style={{ textAlign: 'center', padding: '12px', background: 'rgba(220, 38, 38, 0.1)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{criticalArticles.length}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const }}>Critical</div>
                        </td>
                        <td width="4%"></td>
                        <td width="33%" style={{ textAlign: 'center', padding: '12px', background: 'rgba(234, 88, 12, 0.1)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>{highArticles.length}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const }}>High</div>
                        </td>
                        <td width="4%"></td>
                        <td width="33%" style={{ textAlign: 'center', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{filteredArticles.length}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const }}>Total</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Greeting */}
              <tr>
                <td style={{ padding: '0 24px 16px 24px' }}>
                  <p style={{ color: '#d1d5db', margin: 0, fontSize: '14px' }}>
                    Hi {displayName}, here's your {frequency} security digest with {filteredArticles.length} threat{filteredArticles.length !== 1 ? 's' : ''} matching your preferences.
                  </p>
                </td>
              </tr>

              {/* Articles */}
              <tr>
                <td style={{ padding: '0 24px' }}>
                  <table width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      {renderSection('🚨 Critical Threats', criticalArticles, '#dc2626')}
                      {renderSection('⚠️ High Severity', highArticles, '#ea580c')}
                      {renderSection('📋 Other Alerts', otherArticles.slice(0, 10), '#6b7280')}
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Empty State */}
              {filteredArticles.length === 0 && (
                <tr>
                  <td style={{ padding: '24px', textAlign: 'center' }}>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                      No threats match your current filter settings.<br />
                      Try selecting more categories or lowering the severity threshold.
                    </p>
                  </td>
                </tr>
              )}

              {/* CTA Button */}
              <tr>
                <td style={{ padding: '24px', textAlign: 'center' }}>
                  <a href="#" style={{ display: 'inline-block', background: '#3b82f6', color: 'white', padding: '12px 28px', borderRadius: '6px', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}>
                    View All Threats
                  </a>
                </td>
              </tr>

              {/* Footer */}
              <tr>
                <td style={{ padding: '16px 24px', background: '#111827', textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '11px' }}>
                    You're receiving this {frequency} digest because you subscribed to Digibastion Threat Intel.<br />
                    <a href="#" style={{ color: '#60a5fa' }}>Manage preferences</a> | <a href="#" style={{ color: '#60a5fa' }}>Unsubscribe</a>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-muted/50 text-sm text-muted-foreground border-t">
          <p className="flex items-center gap-2 mb-2">
            <span className="text-primary">ℹ️</span>
            <strong>This is a preview with sample data.</strong>
          </p>
          <div className="space-y-1 text-xs">
            <p className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Delivery schedule: <strong className="text-foreground">{deliverySchedule}</strong></span>
            </p>
            <p>
              Categories: {categories.length > 0 ? categories.map(c => newsCategoryConfig[c]?.name).join(', ') : 'none selected'}
            </p>
            <p>
              Min severity: {severity}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};