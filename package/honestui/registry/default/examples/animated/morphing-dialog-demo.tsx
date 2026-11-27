"use client";

import {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogImage,
  MorphingDialogSubtitle,
  MorphingDialogTitle,
  MorphingDialogTrigger,
} from "@/registry/default/animated/morphing-dialog";

export default function MorphingDialogDemo() {
  return (
    <MorphingDialog>
      <MorphingDialogTrigger className="w-64">
        <MorphingDialogImage src="/ohio-stadium.jpg" alt="Ohio Stadium seen from the upper deck" className="h-40" />
        <div className="flex flex-col gap-0.5 p-3">
          <MorphingDialogTitle className="text-sm">Ohio Stadium</MorphingDialogTitle>
          <MorphingDialogSubtitle>Columbus, Ohio</MorphingDialogSubtitle>
        </div>
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className="max-w-md">
          <MorphingDialogImage src="/ohio-stadium.jpg" alt="Ohio Stadium seen from the upper deck" className="h-64" />
          <div className="flex flex-col gap-0.5 p-5 pb-0">
            <MorphingDialogTitle className="text-lg">Ohio Stadium</MorphingDialogTitle>
            <MorphingDialogSubtitle>Columbus, Ohio</MorphingDialogSubtitle>
          </div>
          <MorphingDialogDescription className="flex flex-col gap-3 p-5">
            <p>
              Opened in 1922, the horseshoe-shaped stadium on the Olentangy River seats more than
              100,000 people, which makes it one of the largest in the world.
            </p>
            <p>
              The open south end was enclosed with permanent stands in 2001, and the field was
              lowered to add rows closer to play.
            </p>
          </MorphingDialogDescription>
          <MorphingDialogClose />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}
