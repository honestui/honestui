import { Plus, Search } from "honestui/icons";

import { Button } from "@/registry/default/ui/button";

export default function ButtonRtl() {
  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex flex-wrap items-center justify-center gap-3"
    >
      <Button>
        <Plus aria-hidden="true" />
        عنصر جديد
      </Button>
      <Button variant="outline">
        <Search aria-hidden="true" />
        بحث
      </Button>
      <Button variant="ghost">إلغاء</Button>
    </div>
  );
}
