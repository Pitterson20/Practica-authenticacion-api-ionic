// Así responde la API en cada orden (OrderResource)
export interface Orders {
    id: number;
    numero_orden: string;
    iva: number;
    total: number;
    customer: Customers;
}

export interface Customers {
    id: number;
    name: string;
}

// La API devuelve las órdenes paginadas (25 por página)
export interface OrdersResponse {
    data: Orders[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}
