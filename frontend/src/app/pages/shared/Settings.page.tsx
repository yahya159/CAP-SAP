import React, { useEffect, useState } from 'react';
import { Save, Bell, Globe, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';

interface LocalSettings {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  weeklyDigest: boolean;
}

const STORAGE_KEY = 'appSettings';

const DEFAULT_SETTINGS: LocalSettings = {
  emailNotifications: true,
  desktopNotifications: true,
  weeklyDigest: true,
};

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as LocalSettings;
      setSettings(parsed);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const save = () => {
    toast.success(t('settings.saved'), {
      description: t('settings.savedDesc'),
    });
  };

  const changeLanguage = (lng: string) => {
    void i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title={t('common.settings')}
        subtitle={t('settings.subtitle')}
        breadcrumbs={[{ label: t('common.settings') }]}
      />

      <div className="mx-auto grid max-w-4xl gap-6 p-6 lg:p-8">
        <Card className="bg-card/92">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-xl">
              <Palette className="h-4 w-4 text-primary" />
              {t('settings.appearance')}
            </CardTitle>
            <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-2 p-4">
            <div>
              <p id="settings-theme-label" className="font-semibold text-foreground">
                {t('settings.theme')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('settings.currentMode')}: {theme === 'dark' ? t('settings.dark') : t('settings.light')}
              </p>
            </div>
            <Switch
              id="settings-theme-toggle"
              aria-labelledby="settings-theme-label"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </CardContent>
        </Card>

        <Card className="bg-card/92">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-xl">
              <Bell className="h-4 w-4 text-primary" />
              {t('settings.notifications')}
            </CardTitle>
            <CardDescription>{t('settings.notificationsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-2 p-4">
              <div>
                <p id="settings-email-label" className="font-semibold text-foreground">
                  {t('settings.emailNotifications')}
                </p>
                <p className="text-sm text-muted-foreground">{t('settings.emailNotificationsDesc')}</p>
              </div>
              <Switch
                id="settings-email-toggle"
                aria-labelledby="settings-email-label"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, emailNotifications: Boolean(checked) }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-2 p-4">
              <div>
                <p id="settings-desktop-label" className="font-semibold text-foreground">
                  {t('settings.desktopNotifications')}
                </p>
                <p className="text-sm text-muted-foreground">{t('settings.desktopNotificationsDesc')}</p>
              </div>
              <Switch
                id="settings-desktop-toggle"
                aria-labelledby="settings-desktop-label"
                checked={settings.desktopNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, desktopNotifications: Boolean(checked) }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-2 p-4">
              <div>
                <p id="settings-weekly-label" className="font-semibold text-foreground">
                  {t('settings.weeklyDigest')}
                </p>
                <p className="text-sm text-muted-foreground">{t('settings.weeklyDigestDesc')}</p>
              </div>
              <Switch
                id="settings-weekly-toggle"
                aria-labelledby="settings-weekly-label"
                checked={settings.weeklyDigest}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, weeklyDigest: Boolean(checked) }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/92">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-xl">
              <Globe className="h-4 w-4 text-primary" />
              {t('settings.locale')}
            </CardTitle>
            <CardDescription>{t('settings.localeDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="rounded-xl border border-border/70 bg-surface-2 p-4">
            <Label htmlFor="settings-locale" className="mb-1 block text-sm text-muted-foreground">
              {t('settings.displayLanguage')}
            </Label>
            <Select
              value={i18n.language}
              onValueChange={changeLanguage}
            >
              <SelectTrigger id="settings-locale" className="w-full max-w-xs">
                <SelectValue placeholder={t('settings.selectLocale')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('common.english')}</SelectItem>
                <SelectItem value="fr">{t('common.french')}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-border/70 bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
          {t('settings.storageNote')}
        </div>

        <div>
          <Button onClick={save}>
            <Save className="h-4 w-4" />
            {t('settings.saveButton')}
          </Button>
        </div>
      </div>
    </div>
  );
};

