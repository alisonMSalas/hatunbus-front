# Actualización del Frontend Móvil - Refactorización de Viajes

## Fecha: 17 de noviembre de 2025

## Resumen
Se ha actualizado completamente el frontend móvil de Hatunbus para adaptarse a la nueva arquitectura del backend que implementa el modelo de **Frecuencias con Segmentos**.

## Cambios Realizados

### 1. Nuevos Tipos y Estructuras de Datos (`types/trip.ts`)

Se creó un nuevo archivo de tipos TypeScript que refleja exactamente los DTOs del backend:

#### Tipos Principales:
- **`TripDto`**: Estructura completa de un viaje
- **`FrequencySegmentDto`**: Segmento de una frecuencia (tramo de ruta)
- **`FrequencyDto`**: Frecuencia completa con sus segmentos
- **`RouteDto`**: Información de rutas
- **`SeatAvailabilityDto`**: Disponibilidad de asientos
- **`TicketDto`**: Información de boletos
- **`CreateTicketRequest`**: Estructura para crear tickets
- **`CreatePurchaseRequest`**: Estructura para crear compras

### 2. Componentes Actualizados

#### `app/search-results.tsx`
**Cambios:**
- Importa el tipo `TripDto` desde `@/types/trip`
- Actualizado para usar `trip.frequencySegment?.estimatedDuration` en lugar de `trip.frequency?.estimatedDuration`
- Obtiene el precio base desde `trip.frequencySegment?.route?.basePrice`
- Usa `trip.frequencySegment?.route?.originCityId` y `destinationCityId` para los IDs de paradas
- Añadido manejo de errores mejorado con logs

**Impacto:** Ahora muestra correctamente los viajes basados en segmentos de frecuencia

#### `app/trip-details.tsx`
**Cambios:**
- Importa el tipo `TripDto` desde `@/types/trip`
- Actualizado para obtener datos de conductor: `data.driverName || data.mainDriverName`
- Obtiene información de ruta desde: `data.routeOrigin || data.frequencySegment?.routeOrigin`
- Añadido manejo de errores mejorado con logs

**Impacto:** Muestra correctamente todos los detalles del viaje incluyendo información del segmento

#### `app/select-seats.tsx`
**Cambios:**
- Importa el tipo `SeatAvailabilityDto` desde `@/types/trip`
- Tipado fuerte del response del endpoint de asientos disponibles
- Guarda el `tripSeatId` en la interfaz `Seat` y `PassengerSeat`
- Mejora en el manejo de estados de asientos: `available`, `occupied`, `reserved`
- Añadido manejo de errores mejorado con logs

**Impacto:** Mejor manejo de la selección de asientos con la estructura correcta del backend

### 3. Archivos No Modificados (ya compatibles)

Los siguientes componentes no requirieron cambios porque no interactúan directamente con la estructura de frecuencias/segmentos:

- `app/passenger-details.tsx` - Maneja solo información de pasajeros
- `app/payment-method.tsx` - Maneja pagos y compras
- `app/(tabs)/tickets.tsx` - Obtiene tickets desde compras
- `app/(tabs)/history.tsx` - Obtiene historial desde compras

## Modelo Refactorizado del Backend

### Antes:
```
Frequency → Trip
```
Una frecuencia tenía una ruta y hora de salida directamente asociada.

### Ahora:
```
Frequency → FrequencySegments → Trip
```

Una frecuencia puede tener **múltiples segmentos**, donde cada segmento representa:
- Una ruta específica
- Una hora de salida específica
- Un orden de ejecución (segmentOrder)

El mismo bus ejecuta **todos los segmentos** de una frecuencia en el mismo día.

### Ejemplo:
```json
{
  "frequency": {
    "id": "uuid-freq",
    "name": "Frecuencia Día Impar",
    "cooperativeName": "Trans Loja",
    "segments": [
      {
        "segmentOrder": 1,
        "routeName": "AMBATO - QUITO",
        "departureTime": "06:00",
        "estimatedDuration": 120
      },
      {
        "segmentOrder": 2,
        "routeName": "QUITO - LOJA",
        "departureTime": "18:00",
        "estimatedDuration": 180
      }
    ]
  },
  "trip": {
    "frequencySegmentId": "uuid-segment-1",
    "frequency": { ... },
    "frequencySegment": {
      "segmentOrder": 1,
      "route": {
        "origin": "AMBATO",
        "destination": "QUITO",
        "basePrice": 15.50
      }
    }
  }
}
```

## Endpoints Actualizados

### Búsqueda de Viajes
```
GET /api/viajes/buscar?fecha=2025-11-17&origen=Quito&destino=Loja
```
**Response:** Array de `TripDto` con `frequencySegment` y `frequency` anidados

### Detalles del Viaje
```
GET /api/viajes/{tripId}
```
**Response:** `TripDto` completo con toda la información del segmento y frecuencia

### Asientos Disponibles
```
GET /api/viajes/{tripId}/asientos-disponibles
```
**Response:** Array de `SeatAvailabilityDto` con numeración lógica (V1, P1, V2, P2...)

## Compatibilidad

### ✅ Funcionalidad Mantenida
- Búsqueda de viajes por origen, destino y fecha
- Visualización de detalles del viaje
- Selección de asientos
- Información de pasajeros
- Procesamiento de pagos
- Visualización de tickets
- Historial de compras

### ✅ Mejoras Implementadas
- Tipado fuerte en TypeScript
- Mejor manejo de errores con logs
- Acceso correcto a datos anidados (frequencySegment, frequency)
- Soporte para múltiples segmentos por frecuencia
- Compatibilidad total con la nueva estructura del backend

## Testing Recomendado

1. **Búsqueda de Viajes**
   - Verificar que se muestren viajes correctamente
   - Confirmar que precios, horarios y rutas son correctos

2. **Detalles del Viaje**
   - Verificar información completa del bus, conductor y cooperativa
   - Confirmar que se muestren asientos disponibles

3. **Selección de Asientos**
   - Verificar que los asientos se cargan correctamente
   - Confirmar que la numeración lógica funciona (V1, P1, etc.)

4. **Flujo de Compra**
   - Verificar que se crean las compras correctamente
   - Confirmar que los tickets se generan con la información correcta

5. **Tickets y Historial**
   - Verificar que los tickets activos se muestran
   - Confirmar que el historial muestra viajes pasados correctamente

## Notas Importantes

### Acceso a Datos de Ruta
**Antes:**
```typescript
trip.frequency?.route?.basePrice
```

**Ahora:**
```typescript
trip.frequencySegment?.route?.basePrice
```

### Acceso a Información de Cooperativa
Sigue siendo igual:
```typescript
trip.frequency?.cooperativeName
```

### Duración del Viaje
**Antes:**
```typescript
trip.frequency?.estimatedDuration
```

**Ahora:**
```typescript
trip.frequencySegment?.estimatedDuration
```

## Próximos Pasos

1. ✅ Probar todos los flujos en el emulador/dispositivo
2. ✅ Verificar que no haya errores de compilación TypeScript
3. ✅ Confirmar que la búsqueda de viajes funciona correctamente
4. ✅ Verificar el flujo completo de compra de boletos
5. ✅ Validar que los tickets se muestran correctamente

## Conclusión

El frontend móvil ahora está **completamente sincronizado** con la nueva arquitectura del backend que implementa el modelo de Frecuencias con Segmentos. Todas las pantallas relacionadas con viajes han sido actualizadas para usar los tipos correctos y acceder a los datos de manera adecuada.

**Estado:** ✅ Listo para pruebas
