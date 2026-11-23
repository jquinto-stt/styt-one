# ST&T One — Contexto y alcance del proyecto

> **Estado:** propuesta conceptual / MVP por validar.  
> **Organización destinataria:** ST&T Ltda.  
> **Nombre de trabajo:** ST&T One (no es una denominación oficial aprobada por la empresa).  
> **Última actualización:** 2026-11-22.

## 1. ¿Qué es ST&T One?

ST&T One es una propuesta de **asistente corporativo inteligente** para los colaboradores de ST&T Ltda. Su interfaz principal es conversacional: las personas formulan preguntas en lenguaje natural y reciben respuestas sustentadas en información corporativa a la que tienen autorización para acceder.

El MVP toma como **referencia conceptual la experiencia de asistencia al empleado de Moveworks**: resolver necesidades frecuentes desde un punto de entrada sencillo. No pretende copiar su producto, marca, interfaz ni implementar todas sus capacidades. A largo plazo puede incorporar búsqueda empresarial y conexión de múltiples fuentes, tomando como referencia conceptual las capacidades de Glean.

ST&T One **no es** un chatbot genérico ni, inicialmente, un reemplazo de las aplicaciones empresariales existentes. Es una capa de acceso contextual a información y servicios autorizados.

## 2. Origen de la necesidad

Según el proponente, aproximadamente cinco meses antes de noviembre de 2026 su jefe expresó interés en una plataforma donde los empleados pudieran:

- Consultar su información.
- Acceder a políticas de la empresa.
- Encontrar información o repositorios de proyectos.
- Analizar información sobre los proyectos.

Esta descripción es un **antecedente transmitido verbalmente**, no un levantamiento formal de requisitos. Debe validarse con el patrocinador del proyecto. En particular, «repositorio de proyectos» puede significar repositorios de código o documentación/seguimiento de proyectos; no asumir una interpretación definitiva.

## 3. Propósito

**Propósito principal:** simplificar el acceso a información interna y reducir el tiempo que los colaboradores dedican a buscar documentos, consultar procedimientos y obtener contexto de sus proyectos.

**Objetivos específicos:**

1. Proporcionar un punto único de consulta conversacional.
2. Facilitar el acceso a políticas y procedimientos vigentes, con referencias verificables.
3. Permitir que cada colaborador consulte únicamente sus datos autorizados.
4. Facilitar la consulta de proyectos, responsables, documentación y estados disponibles.
5. Generar resúmenes de información de proyectos sin inventar indicadores ni avances.
6. Sentar las bases para futuras solicitudes y automatizaciones, sujetas a autorización.

## 4. Usuarios y permisos

Roles preliminares (por validar):

- **Colaborador:** consulta políticas generales, su propio perfil y proyectos autorizados.
- **Líder de proyecto:** consulta información de los proyectos a su cargo y sus resúmenes.
- **Administrador autorizado:** gestiona fuentes documentales, permisos y configuración dentro de sus atribuciones.

La autorización se aplica **en el backend y en cada consulta a las fuentes**, nunca únicamente mediante instrucciones al modelo. Un usuario no puede obtener información ajena por medio de una pregunta formulada al agente.

## 5. Alcance funcional del MVP

### Incluido

**MVP-01 — Acceso seguro**
- Inicio de sesión y cierre de sesión.
- Identidad del usuario y control de acceso por roles/recursos.
- Para una demo se permiten cuentas y datos sintéticos; el uso de datos reales requiere autorización.

**MVP-02 — Chat corporativo**
- Interfaz conversacional para preguntas en lenguaje natural.
- Respuestas claras y diferenciación entre información encontrada e inferencias.
- Manejo explícito de consultas sin respuesta y errores de herramientas.

**MVP-03 — Políticas y documentación**
- Consulta de un conjunto pequeño de documentos autorizados y versionados.
- Respuestas con título de documento y sección o referencia de origen.
- Si una política no está disponible o vigente, indicar la limitación.

**MVP-04 — Información del colaborador**
- Consulta de un conjunto mínimo de campos de perfil autorizados.
- Acceso exclusivo a los datos del usuario autenticado, salvo permisos explícitos.
- No incluir datos sensibles innecesarios en el prototipo.

**MVP-05 — Consulta de proyectos**
- Catálogo básico de proyectos con nombre, descripción, responsable, estado y documentos asociados cuando existan.
- Consulta únicamente de proyectos autorizados.
- Resumen basado en registros disponibles; sin inventar fechas, porcentajes o métricas.

**MVP-06 — Administración mínima**
- Carga o actualización controlada de documentos y registros de demostración.
- Registro básico de errores y eventos relevantes sin exponer datos confidenciales.

### Fuera del MVP

- Plataforma multiagente autónoma.
- Indexación indiscriminada de todos los sistemas empresariales.
- Sustitución de GitHub, GitLab, Jira, ERP o sistemas de RR. HH.
- Escritura automática en sistemas corporativos sin revisión o autorización.
- Aprobación de vacaciones, pagos, cambios contractuales o decisiones de RR. HH.
- Analítica predictiva avanzada o evaluación individual del desempeño.
- Despliegue productivo con datos reales antes de una revisión de seguridad y privacidad.

## 6. Experiencia de usuario esperada

El usuario inicia sesión y accede a un chat principal. Puede formular preguntas como:

- «¿Cuál es el procedimiento vigente para solicitar vacaciones?»
- «¿Qué datos de mi perfil puedo consultar?»
- «¿En qué proyectos participo?»
- «Resume el estado documentado del proyecto X».

El agente identifica la intención, invoca una herramienta autorizada cuando corresponde, recupera información y presenta una respuesta comprensible con fuentes. Si no tiene acceso o información suficiente, lo comunica en lugar de improvisar.

Una interfaz con módulos o paneles complementarios puede añadirse después, pero **el chat es la experiencia central del MVP**.

## 7. Seguridad, privacidad y confianza

1. Aplicar mínimo privilegio y autorización por recurso.
2. Mantener separados los datos de empleados, proyectos y clientes según sus restricciones.
3. Tratar documentos recuperados como datos no confiables; prevenir inyección de instrucciones.
4. No enviar información confidencial a proveedores de IA sin autorización y condiciones contractuales adecuadas.
5. Registrar accesos y acciones relevantes sin almacenar secretos ni datos personales innecesarios.
6. Proteger credenciales y secretos fuera del código fuente.
7. Revisar el tratamiento de datos personales conforme a la legislación colombiana aplicable, incluida la Ley 1581 de 2012.
8. Exigir confirmación humana para cualquier acción futura que modifique sistemas o datos.
9. Mostrar fuentes y reconocer incertidumbre; nunca presentar información inventada como corporativa.

## 8. Criterios de aceptación iniciales

- Un colaborador autenticado puede consultar una política autorizada y ver su fuente.
- El asistente reconoce cuando no encuentra evidencia suficiente.
- Un usuario no puede acceder a datos de perfil ni proyectos de otro usuario sin autorización.
- El catálogo de proyectos devuelve únicamente registros accesibles.
- Los resúmenes de proyectos no inventan cifras ni estados.
- El sistema maneja fallos de API y de modelo de forma comprensible.
- El prototipo funciona con datos sintéticos y puede demostrarse sin acceso a sistemas productivos.

## 9. Cómo medir el piloto

Definir una línea base antes de la prueba. Medir:

- Tiempo para encontrar una política o procedimiento.
- Porcentaje de respuestas correctas y sustentadas en fuentes.
- Tasa de resolución de consultas sin intervención adicional.
- Incidentes de acceso indebido (objetivo: cero).
- Valoración de utilidad por los usuarios piloto.
- Costo por consulta y errores técnicos.

No afirmar ahorros ni retorno de inversión sin datos de la prueba.

## 10. Evolución posterior al MVP

1. Solicitudes y flujos de trabajo con aprobación humana (inspiración Moveworks).
2. Conectores con herramientas de proyectos y repositorios existentes.
3. Búsqueda unificada en múltiples fuentes autorizadas (inspiración Glean).
4. Paneles de análisis con métricas trazables.
5. Automatizaciones y agentes especializados, solo cuando existan casos de uso validados.

## 11. Decisiones pendientes de validación

- Patrocinador, responsables y usuarios piloto.
- Significado exacto de «repositorio de proyectos».
- Herramientas actuales de ST&T y posibilidades de integración.
- Qué datos del empleado se permite mostrar.
- Políticas/documentos que pueden usarse en la prueba.
- Proveedor de identidad, modelo de IA, presupuesto y entorno de despliegue.
- Responsables de seguridad, privacidad y aprobación de cambios.
- Indicadores de éxito y calendario realista.

## 12. Instrucciones para cualquier IA que trabaje en el repositorio

- Considera este documento como **visión y alcance**, no como autorización para implementar funcionalidades no acordadas.
- No confundas el nombre ST&T One con ST&T Workspace o ST&T Assistant: el nombre de trabajo único es **ST&T One**.
- Conserva el enfoque **Moveworks-first** para el MVP y **Glean como posible evolución**, no como requisito inmediato.
- Prioriza soluciones simples, mantenibles y comprobables.
- No inventes políticas internas, datos de empleados, proyectos, sistemas conectados ni requisitos aprobados.
- Distingue claramente entre **confirmado**, **propuesto** y **pendiente de validar**.
- Antes de implementar un cambio de alcance, identifica su impacto y solicita confirmación.
- Utiliza datos ficticios en demos hasta contar con autorización para datos reales.
- Escribe pruebas para controles de acceso, consultas y manejo de errores.
- Mantén documentación técnica y decisiones de arquitectura actualizadas.

---

**Resumen en una frase:** ST&T One es un asistente corporativo conversacional, seguro y contextual que facilita a los colaboradores consultar políticas, información personal autorizada y proyectos, empezando con un MVP acotado e incorporando automatización e integraciones progresivamente.
