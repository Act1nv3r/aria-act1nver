# PROMPT 19 - Conectar Frontend al Backend Real
# Sprint 7 | 2 dias

Reemplazar TODOS los mocks del frontend por calls al backend.

1. Auth: login mock -> POST /api/v1/auth/login. Token en Zustand (memoria), refresh en httpOnly cookie.
2. /lib/api-client.ts: fetch wrapper con interceptor auth (401 -> refresh -> retry, cola de requests).
3. Data fetching: Zustand store lecturas -> TanStack Query con queryKeys tipados.
4. Mutations: updateFlujoMensual -> useMutation POST/PUT al backend. Outputs vienen en response.
5. Auto-save: useAutoSave hace PUT real cada 30s + IndexedDB fallback si falla.
6. Dashboard: GET /api/v1/clientes (real). Crear cliente: POST /api/v1/clientes.
7. Motores en frontend (lib/motors/) ya no se usan directamente - los ejecuta el backend.
   Output panel lee de TanStack Query cache en vez de Zustand.
