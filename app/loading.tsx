export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-light">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <span className="text-sm font-medium text-gray">Carregando...</span>
      </div>
    </div>
  );
}
