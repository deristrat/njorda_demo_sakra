interface Step {
  title: string;
  description: React.ReactNode;
}

interface DocsStepListProps {
  steps: Step[];
}

export function DocsStepList({ steps }: DocsStepListProps) {
  return (
    <div className="space-y-6 my-6">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {index + 1}
          </div>
          <div className="pt-0.5">
            <h4 className="text-base font-medium mb-1">{step.title}</h4>
            <div className="text-[15px] text-foreground/70 leading-relaxed">
              {step.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
