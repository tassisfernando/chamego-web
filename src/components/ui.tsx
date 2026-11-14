import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-ink-soft">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-line/80 bg-foam/90 p-5 shadow-[0_12px_40px_rgba(31,42,36,0.05)] backdrop-blur',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-leaf text-foam hover:bg-leaf-soft',
        variant === 'secondary' && 'border border-line bg-paper text-ink hover:bg-paper-deep',
        variant === 'ghost' && 'text-ink-soft hover:bg-paper-deep/70 hover:text-ink',
        variant === 'danger' && 'bg-danger text-white hover:bg-danger/90',
        className,
      )}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-sm', className)}>
      <span className="font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="text-xs text-ink-soft">{hint}</span> : null}
    </label>
  )
}

const controlClass =
  'w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-leaf focus:ring-2 focus:ring-leaf/15'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, props.className)} {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClass, props.className)} {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, 'min-h-24 resize-y', props.className)} {...props} />
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'leaf'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tone === 'neutral' && 'bg-paper-deep text-ink-soft',
        tone === 'ok' && 'bg-ok/10 text-ok',
        tone === 'warn' && 'bg-warn/10 text-warn',
        tone === 'danger' && 'bg-danger/10 text-danger',
        tone === 'leaf' && 'bg-leaf/10 text-leaf',
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center">
      <p className="font-medium text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
    </div>
  )
}

export function LoadingBlock({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-line bg-white/50 px-4 py-12 text-ink-soft">
      <span className="size-5 animate-spin rounded-full border-2 border-leaf/20 border-t-leaf" />
      {label}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'leaf'
}) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          tone === 'ok' && 'bg-ok',
          tone === 'warn' && 'bg-warn',
          tone === 'danger' && 'bg-danger',
          tone === 'leaf' && 'bg-leaf',
          tone === 'neutral' && 'bg-honey',
        )}
      />
      <p className="text-sm font-medium text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-2 text-xs text-ink-soft">{hint}</p> : null}
    </Card>
  )
}

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input placeholder="Buscar…" {...props} />
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="min-w-full divide-y divide-line text-left text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn('bg-paper-deep/70 px-3 py-3 font-semibold text-ink-soft', className)}>
      {children}
    </th>
  )
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-3 py-3 align-middle text-ink', className)}>{children}</td>
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  wide,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <button className="absolute inset-0 cursor-default" aria-label="Fechar" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-line bg-foam p-5 shadow-2xl',
          wide ? 'max-w-3xl' : 'max-w-lg',
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
