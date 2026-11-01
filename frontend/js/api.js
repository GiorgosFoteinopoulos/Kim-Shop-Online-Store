import { getToken, clearSession } from "./auth.js";

const API_BASE = 'http://localhost:8080/api';


export class ApiError extends Error {
    constructor(status, problem) {
        super(problem?.detail ?? `Request failed (${status}).`);
        this.status = status;
        this.problem = problem ?? {};
    }
}


async function request(method, path, { params = {}, body, auth = true } = {}) {
    const url = new URL(API_BASE + path);
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
        }
    }

    const options = { method, headers: {} };
    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const token = auth ? getToken() : null;
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(url, options);
    } catch {
        throw new Error('Cannot reach the server. Is the backend running?');
    }

    if (!response.ok) {
        let problem = null;
        try {
            problem = await response.json();
        } catch {

        }
        if (response.status === 401 && token) {
            clearSession();
        }
        throw new ApiError(response.status, problem);
    }
    return response.status === 204 ? null : response.json();
}

export const fetchCategories = () => request('GET', '/categories');
export const fetchProducts = (params) => request('GET', '/products', { params });
export const fetchProduct = (id) => request('GET', `/products/${id}`);
export const placeOrder = (order) => request('POST', '/orders', { body: order });
export const fetchOrder = (id) => request('GET', `/orders/${encodeURIComponent(id)}`);

export const login = (credentials) => request('POST', '/auth/login', {body: credentials, auth: false});
export const register = (account) => request('POST', '/auth/register', {body: account, auth: false });
export const fetchMe = () => request('GET', '/auth/me');
export const fetchMyOrders = () => request('GET', '/orders/mine');

export const fetchAdminProducts = (params) => request('GET', '/admin/products', {params});
export const fetchAdminProduct = (id) => request('GET', `/admin/products/${id}`);
export const createProduct = (product) => request('POST', '/admin/products', { body: product });
export const updateProduct = (id, product) => request('PUT', `/admin/products/${id}`, { body: product });
export const archiveProduct = (id) => request('DELETE', `/admin/products/${id}`);
export const restoreProduct = (id) => request('POST', `/admin/products/${id}/restore`);

export const fetchAdminOrders = (params) => request('GET', '/admin/orders', { params });
export const fetchAdminOrder = (id) => request('GET', `/admin/orders/${encodeURIComponent(id)}`);
export const changeOrderStatus = (id, status) =>
    request('PUT', `/admin/orders/${encodeURIComponent(id)}/status`, { body: { status }});