import type { OrdersResponse } from '@/interfaces/orders';

// URL base de la API, definida en el archivo .env (VITE_API_URL)
const API_URL = import.meta.env.VITE_API_URL || 'https://ds4-demo-5w8lmtds.on-forge.com/api';

// Clave con la que se guarda el token en el almacenamiento del navegador
const TOKEN_KEY = 'pedidos_app_token';

// Error propio para saber el código de estado de la respuesta
export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

/* ------------------------------------------------------------------ */
/* Token                                                               */
/* ------------------------------------------------------------------ */

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

/* ------------------------------------------------------------------ */
/* Llamadas a la API                                                   */
/* ------------------------------------------------------------------ */

/**
 * Inicia sesión en la API.
 * Recibe el correo y la contraseña, y devuelve el bearer token
 * que autoriza las peticiones siguientes.
 */
export async function login(email: string, password: string): Promise<string> {
    const response = await fetch(`${API_URL}/sanctum/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        // Si las credenciales fallan, la API responde 422 con errors.email
        const mensaje =
            data?.errors?.email?.[0] || data?.message || 'No se pudo iniciar sesión';

        throw new ApiError(mensaje, response.status);
    }

    return data.token as string;
}

/**
 * Obtiene las órdenes de la API.
 * Esta ruta está protegida: el token debe ir en el encabezado
 * "Authorization: Bearer <token>".
 */
export async function getOrders(token: string, page = 1): Promise<OrdersResponse> {
    const response = await fetch(`${API_URL}/orders?page=${page}`, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const mensaje =
            response.status === 401
                ? 'La sesión ha caducado. Vuelve a iniciar sesión.'
                : 'No se pudieron cargar las órdenes';

        throw new ApiError(mensaje, response.status);
    }

    return (await response.json()) as OrdersResponse;
}
