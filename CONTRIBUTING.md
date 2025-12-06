# Guía de Contribución

## Requisitos previos
- Node.js 18+ y npm instalados.
- Expo CLI (opcional) para desarrollo local.
- Emulador Android/iOS o dispositivo con Expo Go.
- Git configurado y cuenta en GitHub.

## Flujo para contribuir
1. Haz un **fork** del repositorio y clónalo.
2. Crea una rama descriptiva:  
   `git checkout -b feature/nombre-corto` o `git checkout -b fix/bug-descripcion`.
3. Actualiza `constants/api.ts` con la URL de tu backend y arranca el proyecto con `npm start`.
4. Implementa los cambios siguiendo la estructura de rutas en `app/` y componentes reutilizables en `components/`.
5. Ejecuta la verificación de estilo:
   ```bash
   npm run lint
   ```
6. Usa la convención de commits:
   - `feat:` nueva funcionalidad
   - `fix:` corrección de bug
   - `chore:` tareas de soporte
   - `docs:` documentación
   - `refactor:` cambios internos sin afectar comportamiento
   - `test:` adición/mejora de pruebas
7. Abre un Pull Request usando la plantilla incluida y enlaza el Issue correspondiente.

## Estandares del proyecto
- Usa TypeScript y evita `any` salvo justificación.
- Mantén lógica de datos en `services/` y hooks/contexts; deja las pantallas enfocadas en UI.
- No publiques credenciales ni URLs privadas en commits.
- Sincroniza con la rama `main` antes de abrir el PR para evitar conflictos.

## Dudas o soporte
Usa las plantillas de Issues para reportar errores o proponer mejoras. Para dudas rápidas, comenta en el PR.
