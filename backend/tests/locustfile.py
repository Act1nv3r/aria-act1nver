"""
Sprint 7-8 — Pruebas de carga/performance
Ejecutar: locust -f tests/locustfile.py --headless -u 10 -r 2 -t 30s --host http://localhost:8000
"""
from locust import HttpUser, task, between


class ArIAAPIUser(HttpUser):
    wait_time = between(0.5, 1.5)

    def on_start(self):
        """Login y guardar token para requests autenticados."""
        r = self.client.post(
            "/api/v1/auth/login",
            json={"email": "maria@actinver.com", "password": "Test123!"},
        )
        if r.status_code == 200:
            self.token = r.json()["access_token"]
        else:
            self.token = None

    @task(3)
    def health(self):
        """Health check - endpoint público."""
        self.client.get("/api/v1/health")

    @task(2)
    def list_clientes(self):
        """Lista clientes - requiere auth."""
        if self.token:
            self.client.get(
                "/api/v1/clientes",
                headers={"Authorization": f"Bearer {self.token}"},
            )

    @task(1)
    def create_cliente(self):
        """Crear cliente - carga moderada."""
        if self.token:
            self.client.post(
                "/api/v1/clientes",
                headers={"Authorization": f"Bearer {self.token}"},
                json={"nombre_alias": "LoadTest Cliente"},
            )
