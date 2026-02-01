#!/usr/bin/env python
"""
Script para ejecutar seeders de base de datos.
Uso: python seed.py
"""
import sys
from pathlib import Path

# Agregar el directorio backend al path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.db.seeders import seed_database

if __name__ == "__main__":
    seed_database()
