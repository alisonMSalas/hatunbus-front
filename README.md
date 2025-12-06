# HatunBus App (Expo)

## Descripcion
Aplicacion movil construida con Expo y React Native para HatunBus. Permite a clientes buscar viajes, seleccionar asientos, pagar, recibir boletos con QR y consultar detalles de su viaje; los conductores pueden validar tickets desde la app usando la camara.

## Caracteristicas principales
- Compra de boletos con seleccion visual de asientos.
- Flujos de registro/login con validacion de cedula ecuatoriana.
- Wallet de boletos con QR y estados (reservado, pagado, usado).
- Modo conductor: escaneo de QR, reporte de pasajeros y validacion offline-first.
- Push notifications para cambios de viaje y recordatorios de salida.

## Arquitectura mobile
- **Expo Router**: navegacion por archivos en `app/`.
- **Context/Stores**: hooks en `contexts/` y `services/` centralizan session y datos remotos.
- **UI**: componentes compartidos en `components/` y theming en `constants/theme`.
- **Networking**: `services/` usa fetch/axios (segun modulo) apuntando a `API_BASE_URL`.
- **Realtime**: STOMP + SockJS para actualizacion de pagos y asientos bloqueados.

## Tecnologias
- React Native 0.81 + Expo SDK 54
- TypeScript, Expo Router 6 y React Navigation
- Modulos Expo: Camera, Notifications, SecureStore, FileSystem, Haptics, Image Picker
- STOMP + SockJS para actualizaciones en tiempo real
- Integracion con APIs REST de HatunBus

## Instalacion
1. Requisitos: Node.js 18+, npm, Expo Go o emulador Android/iOS.
2. Clona el repositorio e instala dependencias:
   ```bash
   git clone https://github.com/TU-USUARIO/hatunbus-front.git
   cd hatunbus-front
   npm install
   ```
3. Configura la URL del backend en `constants/api.ts` (usa la IP local si pruebas en dispositivo fisico).

## Configuracion de entorno
| Archivo                    | Descripcion                                  |
|---------------------------|----------------------------------------------|
| `constants/api.ts`        | `API_BASE_URL` para backend (http/https).    |
| `app.json`                | deep links, iconos, permisos nativos.        |
| `expo-env.d.ts`           | Tipado de variables estaticas definidas via Expo. |

## Ejecucion y build
```bash
npm start        # menu interactivo de Expo
npm run android  # abre emulador Android
npm run ios      # abre simulador iOS
npm run web      # vista web
```
Escanea el codigo QR con Expo Go o usa el emulador correspondiente.

### Otros scripts
| Comando             | Funcion                                                     |
|---------------------|-------------------------------------------------------------|
| `npm run lint`      | ESLint con reglas Expo/TypeScript.                          |
| `npm run test`      | (Configurable) espacio para pruebas unitarias con Jest.     |
| `eas build`         | Requiere EAS CLI para builds nativos firmados.              |
| `eas submit`        | Subida a tiendas (Play Console / App Store).                |

## Estructura de carpetas
```
app/                  # Screens definidas por ruta (expo-router)
components/           # UI reutilizable (botones, inputs, modals)
constants/            # Temas, colores, definiciones globales
contexts/             # AuthContext, TripContext, etc
services/             # API clients (auth, trips, payments, sockets)
types/                # Tipos compartidos
assets/               # Iconos, imagenes, fuentes
```

## Contribuciones
Revisa `CONTRIBUTING.md` y usa la plantilla de PR para proponer cambios.

## Licencia
Este proyecto usa la licencia MIT incluida en `LICENSE`.

## Mantenimiento
- El backend debe ser accesible desde el dispositivo (ajusta `API_BASE_URL`).
- Usa ramas `feature/*` y `fix/*` para cambios.
- Manten actualizada la version de Expo CLI si desarrollas en local.
- Documenta nuevas variables/permisos en `app.json` y `README`.
