import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';import { AuthAPI } from '../services/odata/authApi';
import { User, UserRole } from '../types/entities';
import inetumLogoDark from '@/assets/inetum-logo-dark.svg';
import inetumLogoLight from '@/assets/inetum-logo.svg';

const QUICK_ACCESS_PASSWORDS: Record<UserRole, string> = {
  ADMIN: 'Admin#2026',
  MANAGER: 'Manager#2026',
  CONSULTANT_TECHNIQUE: 'Tech#2026',
  CONSULTANT_FONCTIONNEL: 'Func#2026',
  PROJECT_MANAGER: 'PM#2026',
  DEV_COORDINATOR: 'DevCo#2026',
};
const QUICK_ACCESS_AUTO_LOGIN = import.meta.env.VITE_ENABLE_QUICK_ACCESS_AUTO_LOGIN !== 'false'; // Enabled by default for now
type QuickAccessUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;

const ROLES: UserRole[] = [
  'ADMIN',
  'MANAGER',
  'CONSULTANT_TECHNIQUE',
  'CONSULTANT_FONCTIONNEL',
  'PROJECT_MANAGER',
  'DEV_COORDINATOR',
];

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickUsers, setQuickUsers] = useState<QuickAccessUser[]>([]);

  const { login, directLogin, isDirectLoginEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    const loadQuickAccessUsers = async () => {
      try {
        const users = await AuthAPI.quickAccessAccounts();

        const dedupByRole = new Map<UserRole, QuickAccessUser>();
        users.forEach((user) => {
          if (!dedupByRole.has(user.role)) {
            dedupByRole.set(user.role, user);
          }
        });

        setQuickUsers([...dedupByRole.values()]);
      } catch {
        setQuickUsers([]);
      }
    };

    void loadQuickAccessUsers();
  }, []);

  const quickAccessUsers = useMemo(() => quickUsers.slice(0, 6), [quickUsers]);

  const handleLogin = async (userEmail: string, userPass: string) => {
    setLoading(true);

    try {
      await login(userEmail, userPass);
      toast.success(t('login.welcomeBack'), { description: t('login.sessionStarted') });
      navigate(fromPath || '/dashboard', { replace: true });
    } catch {
      toast.error(t('login.authFailed'), {
        description: t('login.authFailedDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleLogin(email, password);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -left-40 top-[-120px] h-[420px] w-[420px] rounded-full bg-primary/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-[-80px] h-[360px] w-[360px] rounded-full bg-accent-foreground/35 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-5">
          <Card className="hidden border-border/80 bg-surface-1 lg:flex lg:flex-col lg:justify-between">
            <CardHeader className="space-y-8">
              <div>
                <div>
                  <img src={inetumLogoDark} alt="Inetum" className="h-8 w-auto dark:hidden" />
                  <img src={inetumLogoLight} alt="Inetum" className="hidden h-8 w-auto dark:block" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t('login.platformName')}
                </p>
                <CardTitle className="text-4xl leading-tight">{t('login.hubTitle')}</CardTitle>
                <p className="max-w-sm text-sm text-muted-foreground">{t('login.signInToContinue')}</p>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="rounded-xl border border-border/70 bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
                {t('login.secureWorkspace')}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Card className="border-border/80 bg-card">
              <CardHeader className="space-y-4">
                <div>
                  <img src={inetumLogoDark} alt="Inetum" className="h-8 w-auto dark:hidden" />
                  <img src={inetumLogoLight} alt="Inetum" className="hidden h-8 w-auto dark:block lg:hidden" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t('login.accountAccess')}
                  </p>
                  <CardTitle className="text-2xl">{t('login.signIn')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('login.useWorkAccount')}</p>
                </div>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={onSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">{t('login.email')}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t('login.emailPlaceholder')}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-password">{t('login.password')}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={t('login.passwordPlaceholder')}
                      required
                    />
                  </div>

                  <Button className="w-full" size="lg" type="submit" disabled={loading}>
                    {loading ? t('login.signingIn') : t('login.enterPlatform')}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card">
              <CardHeader className="pb-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t('login.quickAccess')}
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {quickAccessUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground sm:col-span-2">
                    {t('login.noActiveUsers')}
                  </p>
                ) : (
                  quickAccessUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        if (loading) return;
                        const quickPassword = QUICK_ACCESS_PASSWORDS[user.role];
                        setEmail(user.email);
                        setPassword('');
                        if (!quickPassword || !QUICK_ACCESS_AUTO_LOGIN) {
                          toast.info(t('login.selectedRole', { role: t(`roles.${user.role}`) }));
                          return;
                        }
                        toast.info(t('login.signingInAs', { role: t(`roles.${user.role}`) }));
                        void handleLogin(user.email, quickPassword);
                      }}
                      className="group w-full rounded-lg border border-border/80 bg-surface-2 p-3 text-left transition-colors hover:border-primary/55 hover:bg-accent/45 disabled:opacity-60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/20 text-primary">
                          <span className="text-sm font-semibold">{user.name.slice(0, 1).toUpperCase()}</span>
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                          {t(`roles.${user.role}`)}
                        </p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {isDirectLoginEnabled ? (
              <Card className="border-border/80 bg-card">
                <CardHeader className="pb-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t('login.bypassValidation')}
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        if (loading) return;
                        directLogin(role);
                        toast.success(t('login.directLoginSuccess', { role: t(`roles.${role}`) }));
                        navigate(fromPath || '/dashboard', { replace: true });
                      }}
                      className="group w-full rounded-lg border border-border/80 bg-surface-2 p-3 text-left transition-colors hover:border-primary/55 hover:bg-accent/45 disabled:opacity-60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary/40 text-secondary-foreground">
                          <span className="text-sm font-semibold">{t(`roles.${role}`).slice(0, 1).toUpperCase()}</span>
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                          {t(`roles.${role}`)}
                        </p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
