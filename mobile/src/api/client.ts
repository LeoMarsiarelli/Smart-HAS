import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ---------------------------------------------------------------------------
 * BASE URL — EDIT THIS depending on where you run the Spring Boot backend.
 * ---------------------------------------------------------------------------
 * - Web / iOS Simulator (macOS):     http://localhost:8080/api
 * - Android Emulator (AVD):          http://10.0.2.2:8080/api
 *     (the emulator's virtual device cannot see the host machine as
 *      "localhost" — 10.0.2.2 is a special alias Android provides that
 *      routes back to the host machine running the backend)
 * - Physical device (Expo Go / dev build) on the same Wi-Fi as your
 *   computer:                       http://<YOUR_MACHINE_LAN_IP>:8080/api
 *     (find it with `ipconfig getifaddr en0` on macOS, `ipconfig` on
 *      Windows, or `hostname -I` on Linux — e.g. http://192.168.1.42:8080/api)
 *
 * Swap the line below for whichever environment you are testing against.
 */
export const API_BASE_URL = 'http://localhost:8080/api';

export const AUTH_TOKEN_STORAGE_KEY = '@smart_has:auth_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT (when present) to every outgoing request.
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Extracts a human-readable message from an axios error, falling back
 * gracefully when the backend is unreachable or returns an unexpected shape.
 * Matches the standard error envelope documented in api-contract.md:
 * { timestamp, status, error, message, path }
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (error.code === 'ECONNABORTED') return 'A requisição demorou demais (timeout).';
    if (!error.response) {
      return 'Não foi possível conectar ao servidor. Verifique o endereço da API e sua conexão.';
    }
    return `Erro ${error.response.status}: ${error.response.statusText}`;
  }
  if (error instanceof Error) return error.message;
  return 'Ocorreu um erro inesperado.';
}

export default apiClient;
