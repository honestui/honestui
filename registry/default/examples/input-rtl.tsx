import { useId } from "react";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function InputRtl() {
  const id = useId();

  return (
    <div dir="rtl" lang="ar" className="w-full max-w-64">
      <div className="flex flex-col items-start gap-2">
        <Label htmlFor={id}>ابحث في المساعدة</Label>
        <Input id={id} type="search" placeholder="اكتب كلمة للبحث" />
      </div>
    </div>
  );
}
