interface Props {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className = '', hover = false }: Props) {
  return (
    <div
      className={`glass ${hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
