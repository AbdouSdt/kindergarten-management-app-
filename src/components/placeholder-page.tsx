export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
        هذا القسم جاهز هيكلياً وبانتظار إكماله.
      </div>
    </div>
  );
}
