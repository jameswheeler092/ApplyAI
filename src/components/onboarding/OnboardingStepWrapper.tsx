export function OnboardingStepWrapper({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">{title}</h1>
      {description && <p className="text-gray-500 mb-8">{description}</p>}
      {children}
    </div>
  )
}
