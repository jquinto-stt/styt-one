import { ReactNode } from "react";
import { observer } from 'mobx-react-lite';
import { uiStore } from "@/stores";
import { Backdrop } from "@/shell/sidebar/Backdrop";

interface BaseAppShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

/**
 * @kgId 3e19a736bcb7
 */
export const BaseAppShell: React.FC<BaseAppShellProps> = observer(({
  sidebar,
  header,
  children,
}) => {
  return (
    <div className="min-h-screen xl:flex">
      {sidebar}
      <Backdrop />
      <div
        className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${
          uiStore.isSidebarVisible ? "xl:ml-[224px]" : "xl:ml-[76px]"
        }`}
      >
        {header}
        <main className="p-4 mx-auto max-w-[1536px] md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
});

export default BaseAppShell;
