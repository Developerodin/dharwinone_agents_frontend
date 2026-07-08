export default function WebAgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 -my-5 h-[calc(100vh-64px)] sm:-mx-5 lg:-mx-7 lg:-my-6">
      {children}
    </div>
  );
}
