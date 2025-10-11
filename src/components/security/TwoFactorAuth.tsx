import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Copy, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

interface TwoFactorAuthProps {
  open: boolean;
  onClose: () => void;
}

export const TwoFactorAuth = ({ open, onClose }: TwoFactorAuthProps) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (open) {
      loadTwoFactorStatus();
    }
  }, [open]);

  const loadTwoFactorStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_2fa_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setEnabled(data?.enabled || false);
    } catch (error: any) {
      console.error('Error loading 2FA status:', error);
    }
  };

  const generateSecret = () => {
    // Generate random base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  };

  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const setupTwoFactor = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Generate secret and backup codes
      const newSecret = generateSecret();
      const codes = generateBackupCodes();
      
      setSecret(newSecret);
      setBackupCodes(codes);

      // Generate QR code
      const otpauthUrl = `otpauth://totp/OBC:${user.email}?secret=${newSecret}&issuer=OBC`;
      const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
      setQrCode(qrDataUrl);

      setShowSetup(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // In production, verify the code with a proper TOTP library
      if (!verificationCode || verificationCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }

      // Save 2FA settings
      const { error } = await supabase
        .from('user_2fa_settings')
        .upsert({
          user_id: user.id,
          enabled: true,
          method: 'totp',
          secret: secret, // In production, encrypt this
          backup_codes: backupCodes, // In production, encrypt these
        });

      if (error) throw error;

      setEnabled(true);
      setShowSetup(false);
      
      toast({
        title: 'Success',
        description: '2FA has been enabled successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('user_2fa_settings')
        .update({ enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setEnabled(false);
      
      toast({
        title: 'Success',
        description: '2FA has been disabled',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: 'Copied to clipboard',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account
          </DialogDescription>
        </DialogHeader>

        {!showSetup ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">2FA Status</p>
                <p className="text-sm text-muted-foreground">
                  {enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setupTwoFactor();
                  } else {
                    disableTwoFactor();
                  }
                }}
                disabled={loading}
              />
            </div>

            {!enabled && (
              <div className="p-4 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-2">Why enable 2FA?</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Protect your account from unauthorized access</li>
                  <li>Receive alerts for suspicious login attempts</li>
                  <li>Keep your personal data secure</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Scan this QR code with your authenticator app
              </p>
              {qrCode && (
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="mx-auto w-48 h-48 border rounded-lg"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Or enter this code manually:</Label>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(secret)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Backup Codes (Save these!)</Label>
              <div className="p-3 bg-muted rounded-lg font-mono text-xs space-y-1">
                {backupCodes.map((code, i) => (
                  <div key={i}>{code}</div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All Codes
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSetup(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={verifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                Enable 2FA
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};