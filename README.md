# HatunBus App (Expo)

## Descripcion
Aplicacion movil construida con Expo y React Native para HatunBus. Permite a clientes buscar viajes, seleccionar asientos, pagar, recibir boletos con QR y consultar detalles de su viaje; los conductores pueden validar tickets desde la app usando la camara.

## Tecnologias
- React Native 0.81 + Expo SDK 54
- TypeScript, Expo Router 6 y React Navigation
- Modulos Expo: Camera, Notifications, SecureStore, FileSystem, Haptics, Image Picker
- STOMP + SockJS para actualizaciones en tiempo real
- Integracion con la API REST de HatunBus

## Instalacion
1. Requisitos: Node.js 18+, npm, Expo Go o emulador Android/iOS.
2. Clona el repositorio e instala dependencias:
   ```bash
   git clone https://github.com/TU-USUARIO/hatunbus-front.git
   cd hatunbus-front
   npm install
   ```
3. Configura la URL del backend en `constants/api.ts` (usa la IP local si pruebas en dispositivo fisico).

## Ejecucion
```bash
npm start        # menu interactivo de Expo
npm run android  # abre emulador Android
npm run ios      # abre simulador iOS
npm run web      # vista web
```
Escanea el codigo QR con Expo Go o usa el emulador correspondiente.

## Calidad
```bash
npm run lint
```

## Contribuciones
Revisa `CONTRIBUTING.md` y usa la plantilla de PR para proponer cambios.

## Licencia
Este proyecto usa la licencia MIT incluida en `LICENSE`.

## Mantenimiento
- El backend debe ser accesible desde el dispositivo (ajusta `API_BASE_URL`).
- Usa ramas `feature/*` y `fix/*` para cambios.
- Manten actualizada la version de Expo CLI si desarrollas en local.
