import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function AdminApiKeys() {
  const [isLoading, setIsLoading] = useState(true);
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchKeys = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/admin');
        return;
      }

      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, is_active, permissions, expires_at, last_used_at, created_at, request_count')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys((data as unknown as ApiKeyRecord[]) || []);
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
      if (!session) {
        navigate('/admin');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        navigate('/admin');
        return;
      }

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

      if (newKeyExpiry) {
        insertData.expires_at = new Date(newKeyExpiry).toISOString();
      }

      const { error } = await supabase
        .from('api_keys')
        .insert(insertData as any);

      if (error) throw error;

      setGeneratedKey(rawKey);
      setCreateDialogOpen(false);
      setShowKeyDialog(true);
      setNewKeyName('');
      setNewKeyExpiry('');
      fetchKeys();

      toast({ title: 'API key created', description: 'Copy it now - it won\'t be shown again.' });
    } catch (err: any) {
      console.error('Failed to create API key:', err);
      toast({ title: 'Error', description: 'Failed to create API key', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentlyActive } as any)
        .eq('id', id);

      if (error) throw error;

      setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: !currentlyActive } : k));
      toast({
        title: currentlyActive ? 'Key revoked' : 'Key reactivated',
        description: currentlyActive ? 'The API key has been revoked and is no longer valid.' : 'The API key is active again.',
      });
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update API key', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setKeys(prev => prev.filter(k => k.id !== id));
      toast({ title: 'Key deleted', description: 'The API key has been permanently deleted.' });
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to delete API key', variant: 'destructive' });
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Threat Intel API Access
            </CardTitle>
            <CardDescription>
              Generate and manage API keys for external access to the threat intelligence feed.
              Keys are hashed with SHA-256 and never stored in plaintext.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {keys.filter(k => k.is_active).length} active key{keys.filter(k => k.is_active).length !== 1 ? 's' : ''} / {keys.length} total
              </p>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate New Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key for threat intel access. The key will only be shown once.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        placeholder="e.g. Vladimir - X Bot"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Expiry (optional)</label>
                      <Input
                        type="date"
                        value={newKeyExpiry}
                        onChange={(e) => setNewKeyExpiry(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateKey} disabled={isCreating}>
                      {isCreating ? 'Generating...' : 'Generate Key'}
                    </Button>
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
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Copy Your API Key
              </DialogTitle>
              <DialogDescription>
                This key will only be shown once. Copy it now and store it securely.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted p-4 rounded-md font-mono text-sm break-all">
              {generatedKey}
            </div>
            <DialogFooter>
              <Button onClick={() => copyToClipboard(generatedKey)} className="w-full">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Keys Table */}
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
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
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">Expired</Badge>
                          ) : key.is_active ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">Revoked</Badge>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(key.id, key.is_active)}
                              title={key.is_active ? 'Revoke' : 'Reactivate'}
                            >
                              {key.is_active ? (
                                <XCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <Check className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(key.id)}
                              title="Delete permanently"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
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

        {/* Usage Example */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Example</CardTitle>
            <CardDescription>Share this with your colleague to query the threat intel feed.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto whitespace-pre-wrap">
{`curl -X POST ${window.location.origin.includes('localhost') ? 'https://sdszjqltoheqhfkeprrd.supabase.co' : `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`}/functions/v1/threat-intel-api \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"limit": 10, "severity": "high", "since": "2025-01-01"}'`}
            </pre>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p><strong>Parameters:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li><code>limit</code> - Max articles to return (1-100, default 20)</li>
                <li><code>severity</code> - Filter by severity: critical, high, medium, low, info</li>
                <li><code>category</code> - Filter by category: web3-security, defi-exploits, etc.</li>
                <li><code>since</code> - Only articles published after this date (ISO format)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
