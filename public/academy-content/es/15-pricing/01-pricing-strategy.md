# Estrategia de Precios y Requisitos Funcionales

## 1. Resumen Ejecutivo
Traxxia Fase 3 pasa de ser una herramienta basada en proyectos a un modelo SaaS por niveles optimizado para el mercado LATAM. El enfoque está en dos niveles: **Essential** (enfocado en insights para propietarios individuales) y **Advanced** (enfocado en ejecución para equipos de liderazgo).

El objetivo es proporcionar momentos inmediatos de **"¡Aha!"** en el nivel Essential mientras se reserva el valor de **"Entrega y Ejecución"** para el nivel Advanced.

---

## 2. Definición de Niveles

### Nivel 1: Essential
*   **Objetivo:** Owner-CEOs, gerentes de pequeñas empresas.
*   **Precio:** USD $29.00 – $39.00 / mes.
*   **Propuesta de Valor:** Obtener claridad estratégica y validar el Product-Market Fit (PMF) sin el costo de un consultor.

**Conjunto de Funcionalidades Principales:**
*   **Strategic Insights:** Acceso completo al motor de generación de insights.
*   **PMF Flow:** Flujo de trabajo dedicado para validar el posicionamiento del negocio.
*   **Iniciativas Ilimitadas:** Los usuarios pueden crear tantas iniciativas como necesiten dentro de su único workspace.
*   **Límites:** 1 Workspace (una sola entidad de negocio).
*   **Restricción:** Cero Proyectos. Los usuarios Essential no pueden convertir iniciativas estratégicas en proyectos ni acceder a flujos de trabajo relacionados con la ejecución.

### Nivel 2: Advanced
*   **Objetivo:** Ejecutivos con conocimiento estratégico, PYMES en crecimiento, CEOs que han actualizado su plan.
*   **Precio:** USD $89.00 – $129.00 / mes.
*   **Propuesta de Valor:** Convertir la estrategia en ejecución rigurosa con alineación de todo el equipo.

**Conjunto de Funcionalidades Principales:**
*   **Todo lo incluido en Essential.**
*   **Workspaces:** Hasta 3 workspaces activos por cuenta.
*   **Ciclo Completo:** Convertir iniciativas estratégicas en proyectos accionables.
*   **Gestión de Portafolio:** Matriz de priorización y comparaciones de escenarios.
*   **Colaboración:** Incluye 3 asientos de colaboradores en el precio base (total de 4 usuarios incluyendo el Admin).
*   **Rigor de Ejecución:** Monitoreo, mantenimiento y seguimiento del estado de los proyectos.

---

## 3. Control de Funcionalidades y Lógica de Flujo de Trabajo

| Categoría de Funcionalidad | Essential | Advanced |
| :--- | :--- | :--- |
| **Workspaces (Límite Máximo)** | 1 Negocio | 3 Negocios |
| **Motor Estratégico** | Acceso Completo | Acceso Completo |
| **PMF Flow** | Incluido | Incluido |
| **Conversión de Iniciativa a Proyecto** | Bloqueado | Acceso Completo |
| **Kickoff de Proyectos / Flujos de Trabajo** | Bloqueado | Acceso Completo |
| **Colaboradores** | 0 | 3 incluidos (Admin + 3) |
| **Medición de IA** | Solo Interno | Solo Interno |

### 3.1 Disparadores de Actualización
Las solicitudes de actualización aparecen en puntos lógicos de extensión de valor:

*   **Finalización de Iniciativa:** Cuando un usuario termina un plan estratégico en el nivel Essential, aparece un botón **"Convert to Project"** con una llamada a la acción **"Upgrade to Execute"**.
*   **Solicitud de Colaboración:** Intentar añadir un miembro del equipo activa el modal de actualización.
*   **Límite de Workspace:** Intentar añadir un segundo negocio en Essential o un cuarto en Advanced activa una solicitud de actualización o contacto con ventas.

---

## 4. Requisitos Funcionales

### Suscripción y Control de Acceso
*   **Límites de Workspace:** El sistema debe aplicar un límite estricto de 1 workspace para Essential y 3 para Advanced.
*   **Control de Funcionalidades:** El sistema debe desactivar todos los módulos relacionados con **Proyectos** (Kickoff, Monitoring, Maintenance) para usuarios Essential.
*   **Gestión de Colaboradores:** Las cuentas Advanced están limitadas a 3 invitaciones de colaboradores.

### Protocolo de Downgrade
*   **Retención de Datos:** Al realizar un downgrade, el sistema debe conservar todos los datos pero revocar el acceso de **escritura** a las funciones Advanced.
*   **Selección de Workspace:** Si un usuario tiene más de un workspace y realiza un downgrade, la interfaz debe obligarlo a elegir un negocio para conservar.
*   **Eliminación de Colaboradores:** Todo acceso de colaboradores se revoca inmediatamente al realizar el downgrade.
*   **Bloqueo de Proyectos:** Los proyectos existentes permanecen en la base de datos pero pasan a estado **solo lectura**.

### Integridad del Workspace y Prevención de Abuso
*   **Límite de Eliminación:** Los usuarios están limitados a **1 eliminación de workspace cada 30 días**.
*   **Eliminación Suave:** Los workspaces eliminados se archivan internamente (soft delete).

### Uso y Medición de IA
*   **Medición Silenciosa:** No existe interfaz visible de tokens de IA ni advertencias para el usuario.
*   **Restricciones Internas:** El backend registra todas las llamadas a LLM por UID para monitoreo de costos de infraestructura.

---

## 5. Arquitectura y Valores Predeterminados de UX
*   **Actualización Predeterminada:** Al hacer clic en una función bloqueada se muestra un modal de **propuesta de valor** explicando los beneficios del nivel Advanced.
*   **Sensibilidad LATAM:** Los precios están anclados en USD pero ofrecen mayor valor en Advanced (colaboración/workspaces) para reconocer la sensibilidad regional.