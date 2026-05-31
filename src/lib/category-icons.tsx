import {
  Briefcase, Shield, Calculator, Brain, Folder, BookOpen, GraduationCap,
  Scale, Gavel, Target, Banknote, Globe, Building2, Stethoscope, Landmark,
  Star, Heart, Award, Medal, Trophy, Crown, Flag, Map, MapPin, Compass,
  Plane, Car, Building, Home, Hospital, Factory,
  Atom, Microscope, FlaskConical, TestTube, Lightbulb, Zap, Flame, Sun,
  Lock, Key, ShieldCheck, ShieldAlert,
  Clipboard, ClipboardCheck, FileText, FileQuestion, FileSearch, Newspaper,
  Wallet, CreditCard, Receipt, Coins,
  Library, BookMarked, Notebook,
  Computer, Code, Database, Server,
  Hammer, Wrench, Settings, Cog,
  User, Users, UserCheck, UserCog,
  Languages, Mic, MessageSquare, Phone,
  Activity, BarChart, LineChart, PieChart, TrendingUp,
  Eye, Search, Bell, Warehouse,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS: { key: string; icon: LucideIcon; label: string }[] = [
  // Госслужба / профессии
  { key: 'briefcase', icon: Briefcase, label: 'Портфель' },
  { key: 'building', icon: Building, label: 'Здание' },
  { key: 'building2', icon: Building2, label: 'Здание-2' },
  { key: 'landmark', icon: Landmark, label: 'Памятник' },
  { key: 'factory', icon: Factory, label: 'Завод' },
  { key: 'warehouse', icon: Warehouse, label: 'Склад' },
  { key: 'home', icon: Home, label: 'Дом' },

  // Безопасность / право
  { key: 'shield', icon: Shield, label: 'Щит' },
  { key: 'shield-check', icon: ShieldCheck, label: 'Щит-проверка' },
  { key: 'shield-alert', icon: ShieldAlert, label: 'Щит-предупр.' },
  { key: 'scale', icon: Scale, label: 'Весы' },
  { key: 'gavel', icon: Gavel, label: 'Молоток судьи' },
  { key: 'lock', icon: Lock, label: 'Замок' },
  { key: 'key', icon: Key, label: 'Ключ' },

  // Образование / документы
  { key: 'graduation', icon: GraduationCap, label: 'Шапка' },
  { key: 'book', icon: BookOpen, label: 'Книга' },
  { key: 'book-marked', icon: BookMarked, label: 'Книга закладка' },
  { key: 'library', icon: Library, label: 'Библиотека' },
  { key: 'notebook', icon: Notebook, label: 'Тетрадь' },
  { key: 'clipboard', icon: Clipboard, label: 'Планшет' },
  { key: 'clipboard-check', icon: ClipboardCheck, label: 'Планшет ✓' },
  { key: 'file', icon: FileText, label: 'Файл' },
  { key: 'file-question', icon: FileQuestion, label: 'Файл-вопрос' },
  { key: 'file-search', icon: FileSearch, label: 'Файл-поиск' },
  { key: 'newspaper', icon: Newspaper, label: 'Газета' },

  // Финансы
  { key: 'banknote', icon: Banknote, label: 'Купюра' },
  { key: 'wallet', icon: Wallet, label: 'Кошелёк' },
  { key: 'credit-card', icon: CreditCard, label: 'Карта' },
  { key: 'receipt', icon: Receipt, label: 'Чек' },
  { key: 'coins', icon: Coins, label: 'Монеты' },
  { key: 'calculator', icon: Calculator, label: 'Калькулятор' },

  // Достижения
  { key: 'target', icon: Target, label: 'Мишень' },
  { key: 'star', icon: Star, label: 'Звезда' },
  { key: 'award', icon: Award, label: 'Награда' },
  { key: 'medal', icon: Medal, label: 'Медаль' },
  { key: 'trophy', icon: Trophy, label: 'Кубок' },
  { key: 'crown', icon: Crown, label: 'Корона' },
  { key: 'heart', icon: Heart, label: 'Сердце' },

  // Наука / технологии
  { key: 'brain', icon: Brain, label: 'Мозг' },
  { key: 'atom', icon: Atom, label: 'Атом' },
  { key: 'microscope', icon: Microscope, label: 'Микроскоп' },
  { key: 'flask', icon: FlaskConical, label: 'Колба' },
  { key: 'test-tube', icon: TestTube, label: 'Пробирка' },
  { key: 'stethoscope', icon: Stethoscope, label: 'Стетоскоп' },
  { key: 'hospital', icon: Hospital, label: 'Больница' },
  { key: 'lightbulb', icon: Lightbulb, label: 'Лампочка' },
  { key: 'zap', icon: Zap, label: 'Молния' },
  { key: 'flame', icon: Flame, label: 'Огонь' },
  { key: 'sun', icon: Sun, label: 'Солнце' },

  // Аналитика
  { key: 'activity', icon: Activity, label: 'Пульс' },
  { key: 'bar-chart', icon: BarChart, label: 'Столбцы' },
  { key: 'line-chart', icon: LineChart, label: 'Линия' },
  { key: 'pie-chart', icon: PieChart, label: 'Круг' },
  { key: 'trending-up', icon: TrendingUp, label: 'Рост' },

  // Технологии
  { key: 'computer', icon: Computer, label: 'Компьютер' },
  { key: 'code', icon: Code, label: 'Код' },
  { key: 'database', icon: Database, label: 'База' },
  { key: 'server', icon: Server, label: 'Сервер' },
  { key: 'settings', icon: Settings, label: 'Настройки' },
  { key: 'cog', icon: Cog, label: 'Шестерня' },
  { key: 'hammer', icon: Hammer, label: 'Молоток' },
  { key: 'wrench', icon: Wrench, label: 'Ключ' },

  // Люди / коммуникации
  { key: 'user', icon: User, label: 'Человек' },
  { key: 'users', icon: Users, label: 'Люди' },
  { key: 'user-check', icon: UserCheck, label: 'Человек ✓' },
  { key: 'user-cog', icon: UserCog, label: 'Чел. настр.' },
  { key: 'languages', icon: Languages, label: 'Языки' },
  { key: 'message', icon: MessageSquare, label: 'Сообщение' },
  { key: 'mic', icon: Mic, label: 'Микрофон' },
  { key: 'phone', icon: Phone, label: 'Телефон' },
  { key: 'bell', icon: Bell, label: 'Колокол' },

  // География / транспорт
  { key: 'globe', icon: Globe, label: 'Глобус' },
  { key: 'map', icon: Map, label: 'Карта' },
  { key: 'map-pin', icon: MapPin, label: 'Метка' },
  { key: 'flag', icon: Flag, label: 'Флаг' },
  { key: 'compass', icon: Compass, label: 'Компас' },
  { key: 'plane', icon: Plane, label: 'Самолёт' },
  { key: 'car', icon: Car, label: 'Машина' },

  // Прочее
  { key: 'eye', icon: Eye, label: 'Глаз' },
  { key: 'search', icon: Search, label: 'Поиск' },
  { key: 'folder', icon: Folder, label: 'Папка' },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICONS.map((i) => [i.key, i.icon])
);

// Legacy slug-based fallback: maps existing seed slugs to a default iconKey
// (the icon is then resolved through CATEGORY_ICONS — keeps single source of truth)
const SLUG_FALLBACK_KEY: Record<string, string> = {
  administrative: 'briefcase',
  'law-enforcement': 'shield',
  numerical: 'calculator',
  'personal-qualities': 'brain',
};

export function resolveCategoryIconKey(iconKey: string | null | undefined, slug: string): string {
  if (iconKey && ICON_MAP[iconKey]) return iconKey;
  return SLUG_FALLBACK_KEY[slug] ?? '';
}

export function resolveCategoryIcon(iconKey: string | null | undefined, slug: string): LucideIcon {
  const key = resolveCategoryIconKey(iconKey, slug);
  return ICON_MAP[key] ?? Folder;
}
