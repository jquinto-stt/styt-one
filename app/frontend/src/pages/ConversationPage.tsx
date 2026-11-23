import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { Alert } from "@/elements/ui/alert";

/**
 * Conversación de ejemplo: muestra los estados de respuesta que pide la solución
 * (con fuente, inferencia, política sin vigencia, sin evidencia y error de herramienta).
 */
export function ConversationPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <ChatMessage from="user">¿Cómo pido vacaciones?</ChatMessage>
      <ChatMessage from="assistant" kind="found" source={{ label: "Política de vacaciones · Solicitud de vacaciones", to: "/politicas/vacaciones" }}>
        Según la política vigente (versión 3), la solicitud se registra en la sección «Solicitud de vacaciones». Abre la
        referencia para ver los pasos exactos.
      </ChatMessage>

      <ChatMessage from="user">¿Cómo se reembolsan los viáticos?</ChatMessage>
      <ChatMessage from="assistant" kind="outdated" source={{ label: "Política de viáticos · Reembolso de gastos de viaje", to: "/politicas/viaticos" }}>
        Encontré una política de viáticos, pero <b>no está vigente</b>. Te muestro la referencia con ese aviso; confirma el
        procedimiento actual con el área responsable.
      </ChatMessage>

      <ChatMessage from="user">Resume el estado de mi proyecto</ChatMessage>
      <ChatMessage from="assistant" kind="inference" choices={["Resumir Atlas"]}>
        Entiendo que te refieres a Atlas, el único proyecto autorizado para tu cuenta. ¿Quieres su resumen documentado?
      </ChatMessage>

      <ChatMessage from="user">¿Hay una política de mascotas?</ChatMessage>
      <ChatMessage from="assistant" kind="none">
        No encontré evidencia en los documentos autorizados. Prefiero decírtelo antes que improvisar una respuesta.
      </ChatMessage>

      <Alert
        variant="error"
        title="No se pudo completar la consulta"
        message="La herramienta de proyectos no respondió. Puedes reintentar en unos segundos."
      />

      <div className="sticky bottom-0 mt-4 bg-gray-50 pb-4 pt-2 dark:bg-gray-950">
        <ChatComposer />
      </div>
    </div>
  );
}
