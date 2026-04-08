import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080/api",
    timeout: 10000, // ✅ prevent hanging requests
    headers: {
        "Content-Type": "application/json",
    },
});

// ✅ Attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ✅ Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            localStorage.removeItem("token");

            // ✅ better SPA handling
            window.location.replace("/login");
        }

        return Promise.reject(error);
    }
);

export default api;