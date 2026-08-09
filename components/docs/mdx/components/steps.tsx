"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  stepNumber?: number;
  "data-step"?: boolean;
}

interface StepContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function isStepElement(child: React.ReactNode): child is React.ReactElement<StepProps> {
  return (
    React.isValidElement<StepProps>(child) &&
    (child.type === Step || child.props["data-step"] === true)
  );
}

function Steps({ className, children, ...props }: StepsProps) {
  const childArray = React.Children.toArray(children);
  const sections: Array<{
    step: React.ReactElement<StepProps>;
    content: React.ReactNode[];
    key: React.Key;
  }> = [];
  const leadingContent: React.ReactNode[] = [];

  childArray.forEach((child, childIndex) => {
    if (isStepElement(child)) {
      sections.push({
        step: child,
        content: [],
        key: child.key ?? childIndex,
      });
      return;
    }

    const currentSection = sections.at(-1);
    if (currentSection) {
      currentSection.content.push(child);
    } else {
      leadingContent.push(child);
    }
  });

  return (
    <div className={cn("relative mt-4", className)} {...props}>
      {leadingContent}
      {sections.map(({ step, content, key }, sectionIndex) => {
        const stepNumber = sectionIndex + 1;
        const isLastStep = stepNumber === sections.length;

        return (
          <div key={key} className="relative">
            <div
              className={cn(
                "bg-border absolute top-[26px] left-[12px] h-full w-px",
                isLastStep && "from-border via-border/50 bg-gradient-to-b to-transparent",
              )}
              aria-hidden="true"
            />
            {React.cloneElement(step, {
              ...step.props,
              stepNumber,
              className: cn(step.props.className, "relative"),
              children: (
                <>
                  {step.props.children}
                  {content}
                </>
              ),
            })}
          </div>
        );
      })}
    </div>
  );
}

const StepTitle = ({ className, children }: { className?: string; children: string }) => {
  return (
    <h3 className={cn(className, "text-primary pt-0.5 text-[15px]! font-medium not-first:mt-2")}>
      {children}
    </h3>
  );
};

const StepDescription = ({ className, children }: { className?: string; children: string }) => {
  return (
    <div
      className={cn(
        className,
        "text-muted-foreground text-sm font-normal not-first:mt-4 [&>p]:leading-relaxed",
      )}
    >
      {children}
    </div>
  );
};

function Step({ stepNumber, className, children, ...props }: StepProps & { stepNumber?: number }) {
  const isNumbered = stepNumber !== undefined;

  return (
    <div className={cn("relative mt-6", isNumbered && "pl-9", className)} {...props}>
      {isNumbered && (
        <div className="bg-border text-primary jetbrains absolute top-0.5 left-0 flex size-6 items-center justify-center rounded-md text-xs">
          {stepNumber}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

function StepContent({ children, ...props }: StepContentProps) {
  return (
    <div className={cn("flex flex-col gap-4 py-4", props.className)} {...props}>
      {children}
    </div>
  );
}

export { Steps, Step, StepTitle, StepContent, StepDescription };
