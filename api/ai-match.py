"""
Vercel Serverless Function para AI Matching
Esta función se ejecuta en el runtime de Python de Vercel
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

# Agregar el path del servicio Python
# En Vercel, intentar múltiples paths posibles
current_dir = Path(__file__).parent
matching_service_dir = current_dir / 'matching_service'
project_root = current_dir.parent
services_python = project_root / 'services' / 'python'

# Intentar múltiples paths
possible_paths = [
    matching_service_dir,  # Primero intentar en api/matching_service
    services_python,  # Luego en services/python
    current_dir / 'services' / 'python',
]

for path in possible_paths:
    if path.exists():
        sys.path.insert(0, str(path))
        print(f"✅ Agregado al path: {path}")

try:
    from matching_service import calculate_and_save_match
    print(f"✅ matching_service importado exitosamente")
except ImportError as e:
    print(f"❌ Error importing matching_service: {e}")
    print(f"   Python path: {sys.path}")
    print(f"   Current dir: {current_dir}")
    print(f"   Matching service dir: {matching_service_dir}")
    print(f"   Services Python: {services_python}")
    import traceback
    traceback.print_exc()
    calculate_and_save_match = None


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Leer el body de la request
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            if not post_data:
                self._send_error(400, "No se recibieron datos")
                return
            
            data = json.loads(post_data.decode('utf-8'))
            
            job_id = data.get('job_id')
            candidate_id = data.get('candidate_id')
            
            if not job_id or not candidate_id:
                self._send_error(400, "job_id y candidate_id son requeridos")
                return
            
            if calculate_and_save_match is None:
                self._send_error(500, "Servicio de matching no disponible")
                return
            
            # Ejecutar el matching
            result = calculate_and_save_match(job_id, candidate_id)
            
            # Retornar resultado
            self._send_response(200, result)
            
        except json.JSONDecodeError as e:
            self._send_error(400, f"Error parseando JSON: {str(e)}")
        except Exception as e:
            print(f"Error en ai-match: {str(e)}")
            import traceback
            traceback.print_exc()
            self._send_error(500, f"Error interno: {str(e)}")
    
    def _send_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _send_error(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

