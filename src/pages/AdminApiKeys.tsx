import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Key,
  Plus,
  Copy,
  Check,
  XCircle,
  Trash2,
  ArrowLeft,
  RefreshCw,
  LogOut,
  Shield,
  AlertTriangle,
  FileText,
  Activity,
  BookOpen,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyRecord {
  id: string;
  name: string;
  is_active: boolean;
  permissions: string[];
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  request_count: number;
}

interface UsageLog {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number | null;
  ip_hash: string | null;
  request_params: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
}

async function hashKey(raw: string): Promise<string> {
  const enc = new TextEncoder().encode(raw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'db_live_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/threat-intel-api`;

export default function AdminApiKeys() {
  const [isLoading, setIsLoading] = useState(true);
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedBlock, setCopiedBlock] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchKeys = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/admin'); return; }

      const [keysRes, logsRes] = await Promise.all([
        supabase.from('api_keys')
          .select('id, name, is_active, permissions, expires_at, last_used_at, created_at, request_count')
          .order('created_at', { ascending: false }),
        supabase.from('api_usage_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (keysRes.error) throw keysRes.error;
      setKeys((keysRes.data as unknown as ApiKeyRecord[]) || []);
      setLogs((logsRes.data as unknown as UsageLog[]) || []);
    } catch (err: any) {
      console.error('Failed to fetch API keys:', err);
      toast({ title: 'Error', description: 'Failed to load API keys', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/admin'); return; }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) { await supabase.auth.signOut(); navigate('/admin'); return; }
      fetchKeys();
    };
    checkAuth();
  }, [navigate, fetchKeys]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({ title: 'Error', description: 'Please enter a name for the API key', variant: 'destructive' });
      return;
    }
    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const rawKey = generateApiKey();
      const keyHash = await hashKey(rawKey);

      const insertData: Record<string, unknown> = {
        key_hash: keyHash,
        name: newKeyName.trim(),
        permissions: ['read:threat-intel'],
        is_active: true,
        created_by: session.user.id,
      };
      if (newKeyExpiry) insertData.expires_at = new Date(newKeyExpiry).toISOString();

      const { error } = await supabase.from('api_keys').insert(insertData as any);
      if (error) throw error;

      setGeneratedKey(rawKey);
      setCreateDialogOpen(false);
      setShowKeyDialog(true);
      setNewKeyName('');
      setNewKeyExpiry('');
      fetchKeys();
      toast({ title: 'API key created', description: 'Copy it now - it won\'t be shown again.' });
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to create API key', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      const { error } = await supabase.from('api_keys').update({ is_active: !currentlyActive } as any).eq('id', id);
      if (error) throw error;
      setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: !currentlyActive } : k));
      toast({ title: currentlyActive ? 'Key revoked' : 'Key reactivated' });
    } catch { toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' }); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
      setKeys(prev => prev.filter(k => k.id !== id));
      setDeleteConfirmId(null);
      toast({ title: 'Key deleted permanently' });
    } catch { 
      setDeleteConfirmId(null);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }); 
    }
  };

  const copyText = async (text: string, blockId?: string) => {
    await navigator.clipboard.writeText(text);
    if (blockId) {
      setCopiedBlock(blockId);
      setTimeout(() => setCopiedBlock(''), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-green-600';
    if (code === 429) return 'text-yellow-600';
    return 'text-red-600';
  };

  const keyNameById = (id: string) => keys.find(k => k.id === id)?.name || 'Unknown';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // Code block component
  const CodeBlock = ({ id, code, label }: { id: string; code: string; label?: string }) => (
    <div className="relative group">
      {label && <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>}
      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto whitespace-pre-wrap font-mono">{code}</pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyText(code, id)}
      >
        {copiedBlock === id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">API Key Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/analytics')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={fetchKeys}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate('/admin'); }}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="keys" className="gap-2"><Shield className="w-4 h-4" /> Keys</TabsTrigger>
            <TabsTrigger value="logs" className="gap-2"><Activity className="w-4 h-4" /> Usage Logs</TabsTrigger>
            <TabsTrigger value="docs" className="gap-2"><BookOpen className="w-4 h-4" /> API Docs</TabsTrigger>
          </TabsList>

          {/* ===== KEYS TAB ===== */}
          <TabsContent value="keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Threat Intel API Access</CardTitle>
                <CardDescription>Keys are hashed with SHA-256 and never stored in plaintext. Rate limit: 100 requests/hour per key.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {keys.filter(k => k.is_active).length} active / {keys.length} total
                  </p>
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="w-4 h-4 mr-2" /> Generate New Key</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Generate API Key</DialogTitle>
                        <DialogDescription>The key will only be shown once after creation.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <Input placeholder="e.g. Vladimir - X Bot" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Expiry (optional)</label>
                          <Input type="date" value={newKeyExpiry} onChange={(e) => setNewKeyExpiry(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateKey} disabled={isCreating}>{isCreating ? 'Generating...' : 'Generate Key'}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Generated Key Dialog */}
            <Dialog open={showKeyDialog} onOpenChange={(open) => { if (!open) setGeneratedKey(''); setShowKeyDialog(open); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" /> Copy Your API Key</DialogTitle>
                  <DialogDescription>This key will only be shown once. Copy it now and store it securely.</DialogDescription>
                </DialogHeader>
                <div className="bg-muted p-4 rounded-md font-mono text-sm break-all">{generatedKey}</div>
                <DialogFooter>
                  <Button onClick={() => copyText(generatedKey)} className="w-full">
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader><CardTitle>API Keys</CardTitle></CardHeader>
              <CardContent>
                {keys.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No API keys yet. Generate one to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead className="text-center">Requests</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keys.map((key) => {
                        const isExpired = key.expires_at && new Date(key.expires_at) < new Date();
                        return (
                          <TableRow key={key.id}>
                            <TableCell className="font-medium">{key.name}</TableCell>
                            <TableCell>
                              {isExpired ? (
                                <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">Expired</Badge>
                              ) : key.is_active ? (
                                <Badge variant="outline" className="border-green-500/50 text-green-500">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="border-destructive/50 text-destructive">Revoked</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {(key.permissions as string[]).map((p) => (
                                  <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{key.request_count}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(key.last_used_at)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{key.expires_at ? formatDate(key.expires_at) : 'Never'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(key.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(key.id, key.is_active)} title={key.is_active ? 'Revoke' : 'Reactivate'}>
                                  {key.is_active ? <XCircle className="w-4 h-4 text-destructive" /> : <Check className="w-4 h-4 text-green-500" />}
                                </Button>
                                <Dialog open={deleteConfirmId === key.id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(key.id)} title="Delete permanently">
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Delete API Key</DialogTitle>
                                      <DialogDescription>
                                        This will permanently delete the key "{key.name}". Any integrations using this key will stop working immediately. This cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                                      <Button variant="destructive" onClick={() => handleDelete(key.id)}>Delete Permanently</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== USAGE LOGS TAB ===== */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Request Audit Trail</CardTitle>
                <CardDescription>Last 100 API requests with status, timing, and parameters. Logs auto-purge after 90 days.</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No API usage yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Key</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Latency</TableHead>
                          <TableHead>IP Hash</TableHead>
                          <TableHead>Params</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                            <TableCell className="text-sm font-medium">{keyNameById(log.api_key_id)}</TableCell>
                            <TableCell>
                              <span className={`font-mono font-bold ${statusColor(log.status_code)}`}>{log.status_code}</span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{log.response_time_ms ? `${log.response_time_ms}ms` : '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground font-mono">{log.ip_hash || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {log.request_params && Object.keys(log.request_params).length > 0
                                ? JSON.stringify(log.request_params)
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-destructive max-w-[200px] truncate">{log.error_message || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== API DOCS TAB ===== */}
          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Digibastion Threat Intel API</CardTitle>
                <CardDescription>Complete reference for the Threat Intel API. Copy and share with your team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">

                {/* Overview */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Overview</h3>
                  <p className="text-sm text-muted-foreground">
                    The Threat Intel API provides programmatic access to Digibastion's curated security threat feed.
                    All requests require a valid API key passed via the <code className="bg-muted px-1 rounded">x-api-key</code> header.
                    Keys are SHA-256 hashed and never stored in plaintext.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-xs text-muted-foreground">Base URL</p>
                      <p className="text-sm font-mono break-all">{API_BASE_URL}</p>
                    </div>
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-xs text-muted-foreground">Method</p>
                      <p className="text-sm font-mono">POST</p>
                    </div>
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-xs text-muted-foreground">Rate Limit</p>
                      <p className="text-sm font-mono">100 req/hour</p>
                    </div>
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-xs text-muted-foreground">Auth</p>
                      <p className="text-sm font-mono">x-api-key header</p>
                    </div>
                  </div>
                </div>

                {/* Authentication */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Include your API key in the <code className="bg-muted px-1 rounded">x-api-key</code> header with every request.
                    Never share your key publicly or commit it to version control.
                  </p>
                  <CodeBlock id="auth-header" code={`x-api-key: YOUR_API_KEY`} label="Required Header" />
                </div>

                {/* Request Parameters */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Request Parameters (JSON body)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-sm">limit</TableCell>
                        <TableCell className="text-sm">integer</TableCell>
                        <TableCell className="text-sm">20</TableCell>
                        <TableCell className="text-sm text-muted-foreground">Number of articles (1-100)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">offset</TableCell>
                        <TableCell className="text-sm">integer</TableCell>
                        <TableCell className="text-sm">0</TableCell>
                        <TableCell className="text-sm text-muted-foreground">Pagination offset</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">severity</TableCell>
                        <TableCell className="text-sm">string</TableCell>
                        <TableCell className="text-sm">all</TableCell>
                        <TableCell className="text-sm text-muted-foreground">critical, high, medium, low, info</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">category</TableCell>
                        <TableCell className="text-sm">string</TableCell>
                        <TableCell className="text-sm">all</TableCell>
                        <TableCell className="text-sm text-muted-foreground">web3-security, defi-exploits, operational-security, supply-chain, personal-protection, vulnerability-disclosure, tools-reviews</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">since</TableCell>
                        <TableCell className="text-sm">string</TableCell>
                        <TableCell className="text-sm">none</TableCell>
                        <TableCell className="text-sm text-muted-foreground">ISO date string. Only articles published after this date.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">tags</TableCell>
                        <TableCell className="text-sm">string[]</TableCell>
                        <TableCell className="text-sm">none</TableCell>
                        <TableCell className="text-sm text-muted-foreground">Filter by tags (e.g. ["wallet", "exploit"]). Matches any.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">search</TableCell>
                        <TableCell className="text-sm">string</TableCell>
                        <TableCell className="text-sm">none</TableCell>
                        <TableCell className="text-sm text-muted-foreground">Full-text search across titles and summaries (reserved for future use)</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Response Format */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Response Format</h3>
                  <CodeBlock id="response-format" code={`{
  "data": [
    {
      "id": "uuid",
      "title": "Critical Vulnerability in Popular Wallet",
      "summary": "A critical vulnerability was found...",
      "severity": "critical",
      "category": "web3-security",
      "tags": ["wallet", "exploit", "critical"],
      "link": "https://source-url.com/article",
      "published_at": "2025-03-01T12:00:00Z",
      "affected_technologies": ["MetaMask", "Phantom"],
      "source_name": "Security Research Team",
      "cve_id": "CVE-2025-0001",
      "metadata": {
        "amount_lost_usd": 1500000,
        "chain": "ethereum"
      }
    }
  ],
  "pagination": {
    "total": 245,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}`} label="200 OK" />
                </div>

                {/* Rate Limiting */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Rate Limiting</h3>
                  <p className="text-sm text-muted-foreground">
                    Each API key is limited to 100 requests per hour. Rate limit headers are included in every response.
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Header</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-sm">X-RateLimit-Limit</TableCell>
                        <TableCell className="text-sm text-muted-foreground">Max requests per hour (100)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">X-RateLimit-Remaining</TableCell>
                        <TableCell className="text-sm text-muted-foreground">Remaining requests in current window</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">Retry-After</TableCell>
                        <TableCell className="text-sm text-muted-foreground">Seconds to wait (only on 429)</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Error Codes */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Error Codes</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Meaning</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow><TableCell className="font-mono">401</TableCell><TableCell className="text-sm">Missing x-api-key header</TableCell></TableRow>
                      <TableRow><TableCell className="font-mono">403</TableCell><TableCell className="text-sm">Invalid, revoked, or expired API key</TableCell></TableRow>
                      <TableRow><TableCell className="font-mono">400</TableCell><TableCell className="text-sm">Invalid parameter value</TableCell></TableRow>
                      <TableRow><TableCell className="font-mono">429</TableCell><TableCell className="text-sm">Rate limit exceeded (100/hour)</TableCell></TableRow>
                      <TableRow><TableCell className="font-mono">500</TableCell><TableCell className="text-sm">Internal server error</TableCell></TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Working Curl Examples */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Working cURL Examples</h3>
                  <p className="text-sm text-muted-foreground">Replace <code className="bg-muted px-1 rounded">YOUR_API_KEY</code> with your actual key.</p>

                  <CodeBlock id="curl-basic" label="1. Get latest 10 articles" code={`curl -X POST ${API_BASE_URL} \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"limit": 10}'`} />

                  <CodeBlock id="curl-critical" label="2. Get only critical severity articles" code={`curl -X POST ${API_BASE_URL} \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"severity": "critical", "limit": 20}'`} />

                  <CodeBlock id="curl-high-critical" label="3. Get critical + high articles from the last 7 days" code={`curl -X POST ${API_BASE_URL} \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"severity": "high", "since": "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"}'`} />

                  <CodeBlock id="curl-defi" label="4. Get DeFi exploit articles" code={`curl -X POST ${API_BASE_URL} \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"category": "defi-exploits", "limit": 15}'`} />

                  <CodeBlock id="curl-web3" label="5. Get Web3 security articles from last 30 days" code={`curl -X POST ${API_BASE_URL} \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"category": "web3-security", "since": "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}", "limit": 50}'`} />

                  <CodeBlock id="curl-tags" label="6. Filter by tags (wallet exploits)" code={`curl -X POST ${API_BASE_URL} \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"tags": ["wallet", "exploit"], "limit": 10}'`} />

                  <CodeBlock id="curl-paginate" label="7. Pagination (page 2, 20 per page)" code={`curl -X POST ${API_BASE_URL} \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"limit": 20, "offset": 20}'`} />

                  <CodeBlock id="curl-all" label="8. Combined filters - critical DeFi exploits last 90 days" code={`curl -X POST ${API_BASE_URL} \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"severity": "critical", "category": "defi-exploits", "since": "${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}", "limit": 100}'`} />
                </div>

                {/* Python Example */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Python Example (for X Bot)</h3>
                  <CodeBlock id="python-example" code={`import requests
import json

API_URL = "${API_BASE_URL}"
API_KEY = "YOUR_API_KEY"

def fetch_threats(severity="high", limit=5, since=None):
    payload = {"severity": severity, "limit": limit}
    if since:
        payload["since"] = since
    
    response = requests.post(
        API_URL,
        headers={
            "x-api-key": API_KEY,
            "Content-Type": "application/json"
        },
        json=payload
    )
    
    if response.status_code == 429:
        print("Rate limited! Wait before retrying.")
        return []
    
    response.raise_for_status()
    data = response.json()
    
    print(f"Remaining requests: {response.headers.get('X-RateLimit-Remaining')}")
    return data["data"]

# Fetch latest critical threats
threats = fetch_threats(severity="critical", limit=10)

for threat in threats:
    # Format for X post
    tweet = f"""🚨 {threat['severity'].upper()}: {threat['title']}

{threat['summary'][:200] if threat.get('summary') else ''}

Tags: {', '.join(threat.get('tags', [])[:3])}
Read more: {threat['link']}

#CyberSecurity #Web3Security"""
    
    print(tweet)
    print("---")`} />
                </div>

                {/* Security Notes */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Security Notes</h3>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                    <li>API keys are hashed with SHA-256 before storage. We never store plaintext keys.</li>
                    <li>All requests are logged with timestamp, status code, response time, and anonymized IP hash.</li>
                    <li>Keys can be instantly revoked from the admin dashboard.</li>
                    <li>Optional expiry dates enforce automatic key rotation.</li>
                    <li>Rate limiting prevents abuse (100 requests per hour per key).</li>
                    <li>The API is read-only. No write operations are possible.</li>
                    <li>Store your API key in environment variables, never hardcode it.</li>
                  </ul>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
