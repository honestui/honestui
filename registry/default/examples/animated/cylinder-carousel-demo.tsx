import { CylinderCarousel } from "@/registry/default/animated/cylinder-carousel";

const swatches = ["#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#ec4899"];

export default function CylinderCarouselDemo() {
  return (
    <CylinderCarousel itemSize={112} visibleItems={5} height={180} className="w-full">
      {swatches.map((color, index) => (
        <div
          key={color}
          className="grid size-full place-items-center rounded-full border-4 border-background text-lg font-semibold text-white shadow-xl"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </div>
      ))}
    </CylinderCarousel>
  );
}
