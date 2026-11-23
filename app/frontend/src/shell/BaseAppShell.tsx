import { ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { uiStore } from "@/stores";
import { Backdrop } from "@/shell/sidebar/Backdrop";

interface BaseAppShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  /** Cuando es true, el contenido ocupa todo el viewport restante bajo la cabecera sin márgenes externos. */
  fullBleed?: boolean;
}

/**
 * @kgId 3e19a736bcb7
 */
export const BaseAppShell: React.FC<BaseAppShellProps> = observer(({
  sidebar,
  header,
  children,
  fullBleed = false,
}) => {
  return (
    <div className="min-h-screen lg:flex">
      {sidebar}
      <Backdrop />
      <div
        className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${
          uiStore.isSidebarVisible ? "lg:ml-[14rem]" : "lg:ml-[4.75rem]"
        }`}
      >
        {header}
        <main
          className={
            fullBleed
              ? "h-[calc(100dvh-4rem)] overflow-hidden p-0"
              : "mx-auto max-w-[96rem] p-4 md:p-6"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
});

export default BaseAppShell;
