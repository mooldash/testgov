import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllSettings, SETTING_KEYS } from '@/lib/settings';
import { SettingToggle } from './SettingToggle';
import { SettingText } from './SettingText';

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();
  const directProgram = settings[SETTING_KEYS.CATEGORY_DIRECT_PROGRAM] === 'true';
  const defaultPassword = settings[SETTING_KEYS.DEFAULT_RESET_PASSWORD] ?? '';
  const newsAuthorRu = settings[SETTING_KEYS.NEWS_AUTHOR_RU] ?? '';
  const newsAuthorKk = settings[SETTING_KEYS.NEWS_AUTHOR_KK] ?? '';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Настройки</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Глобальные опции работы сайта на клиентской стороне.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Поведение категорий</CardTitle>
          <CardDescription>
            Влияет на то, что происходит при клике по категории на клиентских страницах.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingToggle
            settingKey={SETTING_KEYS.CATEGORY_DIRECT_PROGRAM}
            initial={directProgram}
            title="Открывать программу напрямую, если она одна"
            description="Если у категории всего одна опубликованная программа, клик по карточке категории ведёт сразу на страницу программы — без промежуточного списка."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Новости</CardTitle>
          <CardDescription>
            Эти значения отображаются как автор на всех новостях. Поле «Автор» в редакторе
            статьи заблокировано — меняется только здесь.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingText
            settingKey={SETTING_KEYS.NEWS_AUTHOR_RU}
            initial={newsAuthorRu}
            title="Автор (русская версия)"
            description='Подпись под новостями на /ru/news. Например: «Редакция testgov.kz».'
            placeholder="Редакция testgov.kz"
          />
          <SettingText
            settingKey={SETTING_KEYS.NEWS_AUTHOR_KK}
            initial={newsAuthorKk}
            title="Автор (қазақша)"
            description='Жаңалықтар астындағы қол. Мысалы: «testgov.kz редакциясы».'
            placeholder="testgov.kz редакциясы"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Сброс паролей пользователей</CardTitle>
          <CardDescription>
            При сбросе пароля у пользователя (карточка «Информация» в Доступах) ты увидишь
            новый пароль один раз и сразу сможешь отправить его в WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingText
            settingKey={SETTING_KEYS.DEFAULT_RESET_PASSWORD}
            initial={defaultPassword}
            title="Дефолтный пароль"
            description="Если задан — кнопка «По умолчанию» в сбросе пароля будет использовать это значение. Оставь пустым, чтобы всегда генерировать случайный."
            placeholder="testgov2026"
          />
        </CardContent>
      </Card>
    </div>
  );
}
