import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordProtectionProps {
    children: ReactNode;
}

export function PasswordProtection({ children }: PasswordProtectionProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        // Check session storage on mount
        const auth = sessionStorage.getItem('is_admin_authenticated');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);

        try {
            // 1. Fetch password from Supabase
            const { data, error } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'admin_password')
                .single();

            if (error) {
                console.error('Error fetching password:', error);
                toast.error('Failed to verify password. Please try again.');
                return;
            }

            if (!data) {
                toast.error('System error: Password not configured.');
                return;
            }

            // 2. Compare
            if (password === data.value) {
                sessionStorage.setItem('is_admin_authenticated', 'true');
                setIsAuthenticated(true);
                toast.success('Access granted');
            } else {
                toast.error('Incorrect password');
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsVerifying(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>;
    }

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Restricted Access</CardTitle>
                    <CardDescription>
                        Please enter the administrator password to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                                className="text-center text-lg"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isVerifying || !password}
                        >
                            {isVerifying ? 'Verifying...' : 'Unlock Dashboard'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
