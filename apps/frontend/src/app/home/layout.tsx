export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex bg-slate-50">
      <main className="flex-1">{children}</main>
    </div>
  );
}
