import { Logo } from "./common";

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-6" size="h-8" />
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="space-y-5">{children}</div>
        <p className="mt-8 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}
