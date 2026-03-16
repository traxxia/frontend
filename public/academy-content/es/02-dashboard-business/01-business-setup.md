# Creando tu Negocio

El Dashboard es donde tu camino realmente comienza. Desde aquí, puedes ver todos tus negocios registrados y su progreso actual.

## 1. Comprender los Límites de Workspace
Un "Workspace" en Traxxia representa una sola Entidad de Negocio. El número de workspaces que puedes mantener está determinado por tu plan:
-   **Essential**: Límite estricto de **1 Workspace**.
-   **Advanced**: Límite estricto de **3 Workspaces**.

> [!NOTE] Estos límites se aplican a nivel del backend. Intentar agregar un segundo negocio en Essential o un cuarto en Advanced activará un aviso para actualizar el plan o contactar con ventas.

## 2. Anti-Abuso e Integridad del Workspace
Para mantener la integridad de nuestro sistema de gestión de workspaces, Traxxia implementa reglas de seguridad específicas:
-   **Límite de Eliminación**: Los usuarios están restringidos a **1 eliminación de workspace por período de 30 días**. Esto evita que se eludan los límites de workspace mediante ciclos frecuentes de "eliminar y reemplazar".
-   **Eliminación Suave (Soft Deletion)**: Cuando eliminas un workspace, este se **elimina/archiva de forma interna**. Esto permite auditoría y seguimiento interno mientras libera tu espacio de workspace.

## 3. Creando un Nuevo Negocio
Para crear un negocio, haz clic en el botón **"New Business"** en el dashboard. Deberás proporcionar el Nombre del Negocio, Descripción e Industria.

> [!TIP] Si ya alcanzaste tu límite, considera **Archivar** tu negocio actual para conservar sus datos antes de iniciar uno nuevo (si tu plan permite múltiples espacios).