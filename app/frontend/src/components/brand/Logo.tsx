import { observer } from "mobx-react-lite";
import { uiStore } from "@/stores";
import { cn } from "@/utils";

/** Símbolo compacto para avatares, navegación móvil y barras contraídas. */
export function LogoMark({ className }: { className?: string }) {
  return <img src="/brand/stt-mark.svg" alt="ST&T" className={cn("size-8 shrink-0 object-contain", className)} />;
}

/** Firma horizontal del producto con el dibujo de letras de la marca original. */
export const Logo = observer(function Logo({ className }: { className?: string }) {
  return <img src={uiStore.isDarkMode ? "/brand/stt-one-on-dark.svg" : "/brand/stt-one-on-light.svg"} width={1368} height={246} alt="ST&T One" className={cn("block h-auto w-36 max-w-full shrink-0 self-center object-contain", className)} />;
});
