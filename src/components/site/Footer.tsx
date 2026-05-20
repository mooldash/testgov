export function Footer() {
  return (
    <footer className="border-t">
      <div className="container py-6 text-sm text-muted-foreground flex flex-col md:flex-row gap-2 justify-between">
        <div>© {new Date().getFullYear()} testgov.kz</div>
        <div className="text-xs">Подготовка к государственному тестированию РК</div>
      </div>
    </footer>
  );
}
