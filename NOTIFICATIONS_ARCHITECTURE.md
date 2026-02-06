# 📧 Arquitectura de Sistema de Notificaciones por Vencimiento

## 🎯 Objetivo

Implementar un sistema de notificaciones automáticas por correo electrónico cuando las ventas con pagos pendientes estén próximas a vencer.

---

## 🏗️ Arquitectura Propuesta

### 📦 COMPONENTES DEL SISTEMA

#### 1️⃣ **Frontend (React)**
**Responsabilidad:** Mostrar alertas visuales y disparar solicitudes de notificación

**Archivos afectados:**
- `SalesPage.jsx` - Ya implementado con alertas visuales
- Nuevo: `NotificationService.js`

#### 2️⃣ **Backend (FastAPI)**
**Responsabilidad:** Procesar solicitudes y enviar correos electrónicos

**Archivos a crear:**
- `app/services/email_service.py` - Lógica de envío de correos
- `app/api/v1/endpoints/notifications.py` - Endpoints de notificaciones
- `app/core/email_config.py` - Configuración de SMTP

---

## 🔧 IMPLEMENTACIÓN FRONTEND

### **Servicio de Notificaciones**

Crear: `/frontend/src/services/notificationService.js`

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const notificationService = {
  // Enviar recordatorio de pago por vencer
  sendDueReminder: async (saleId) => {
    const response = await api.post(`/notifications/send-due-reminder/${saleId}`);
    return response.data;
  },

  // Enviar recordatorio a múltiples ventas
  sendBatchReminders: async (saleIds) => {
    const response = await api.post('/notifications/send-batch-reminders', {
      sale_ids: saleIds
    });
    return response.data;
  },

  // Programar notificación automática
  scheduleNotification: async (saleId, sendDate) => {
    const response = await api.post('/notifications/schedule', {
      sale_id: saleId,
      send_date: sendDate
    });
    return response.data;
  }
};

export default notificationService;
```

### **Integración en SalesPage.jsx**

Agregar botón de envío manual en la tabla de ventas:

```javascript
// Importar el servicio
import notificationService from '../services/notificationService';

// Función para enviar recordatorio
const handleSendReminder = async (saleId, productName) => {
  if (window.confirm(`¿Enviar recordatorio de pago para "${productName}"?`)) {
    try {
      setError(null);
      await notificationService.sendDueReminder(saleId);
      setSuccessMessage('Recordatorio enviado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al enviar recordatorio:', err);
      setError('Error al enviar el recordatorio. Intenta de nuevo.');
    }
  }
};

// Agregar botón en la tabla (columna de acciones)
{isAlert && (
  <button
    className="btn-action btn-notify"
    onClick={() => handleSendReminder(sale.id, sale.product?.name)}
    title="Enviar recordatorio de pago"
  >
    📧 Notificar
  </button>
)}
```

---

## 🎨 ESTILOS CSS

Agregar en `SalesPage.css`:

```css
.btn-notify {
  background-color: #d1ecf1;
  color: #0c5460;
}

.btn-notify:hover {
  background-color: #bee5eb;
  transform: translateY(-1px);
}
```

---

## ⚙️ IMPLEMENTACIÓN BACKEND

### **1. Configuración de Email**

Crear: `/backend/app/core/email_config.py`

```python
from pydantic_settings import BaseSettings

class EmailSettings(BaseSettings):
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""
    FROM_NAME: str = "Flores Artesanales - Sistema POS"
    
    class Config:
        env_file = ".env"

email_settings = EmailSettings()
```

### **2. Servicio de Email**

Crear: `/backend/app/services/email_service.py`

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional
from app.core.email_config import email_settings
from app.models.sales import Sales
from sqlalchemy.orm import Session

class EmailService:
    """Servicio para envío de correos electrónicos"""
    
    @staticmethod
    def send_due_reminder(sale: Sales, db: Session) -> bool:
        """
        Envía un recordatorio de pago por vencer
        
        Args:
            sale: Objeto de venta con información completa
            db: Sesión de base de datos
            
        Returns:
            bool: True si se envió exitosamente, False en caso contrario
        """
        try:
            # Validar que la venta tenga información de contacto
            if not sale.seller or not sale.seller.contact_info:
                return False
            
            # Extraer email del contacto (asumiendo formato: "email@example.com, tel...")
            contact_parts = sale.seller.contact_info.split(',')
            recipient_email = contact_parts[0].strip()
            
            # Verificar formato de email básico
            if '@' not in recipient_email:
                return False
            
            # Calcular días restantes
            days_remaining = (sale.due_date - datetime.now().date()).days
            
            # Construir mensaje
            subject = f"⚠️ Recordatorio: Pago Pendiente - Venta #{sale.id}"
            
            html_body = f"""
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                  <h2 style="color: #84A98C;">Recordatorio de Pago Pendiente</h2>
                  
                  <p>Estimado/a <strong>{sale.seller.name}</strong>,</p>
                  
                  <p>Le recordamos que tiene un pago pendiente que vence en <strong>{days_remaining} días</strong>.</p>
                  
                  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #353535;">Detalles de la Venta</h3>
                    <p><strong>ID de Venta:</strong> #{sale.id}</p>
                    <p><strong>Producto:</strong> {sale.product.name}</p>
                    <p><strong>Cantidad:</strong> {sale.quantity}</p>
                    <p><strong>Total:</strong> ${sale.total_price:.2f}</p>
                    <p><strong>Pagado:</strong> ${sale.amount_paid:.2f}</p>
                    <p style="color: #E29595; font-size: 1.2em;"><strong>Monto Pendiente:</strong> ${sale.amount_remaining:.2f}</p>
                    <p><strong>Fecha de Vencimiento:</strong> {sale.due_date.strftime('%d/%m/%Y')}</p>
                  </div>
                  
                  <p>Por favor, proceda a completar el pago antes de la fecha indicada.</p>
                  
                  <p style="margin-top: 30px;">Gracias por su preferencia,<br>
                  <strong>Flores Artesanales</strong></p>
                </div>
              </body>
            </html>
            """
            
            # Crear mensaje
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{email_settings.FROM_NAME} <{email_settings.FROM_EMAIL}>"
            message['To'] = recipient_email
            
            html_part = MIMEText(html_body, 'html')
            message.attach(html_part)
            
            # Enviar email
            with smtplib.SMTP(email_settings.SMTP_HOST, email_settings.SMTP_PORT) as server:
                server.starttls()
                server.login(email_settings.SMTP_USER, email_settings.SMTP_PASSWORD)
                server.send_message(message)
            
            return True
            
        except Exception as e:
            print(f"Error al enviar email: {str(e)}")
            return False
```

### **3. Endpoint de Notificaciones**

Crear: `/backend/app/api/v1/endpoints/notifications.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.database import get_db
from app.models.sales import Sales as SalesModel
from app.services.email_service import EmailService
from app.core.dependencies import get_current_active_user
from app.models.user import User as UserModel

router = APIRouter()

@router.post(
    "/send-due-reminder/{sale_id}",
    summary="Enviar recordatorio de pago por vencer",
    description="Envía un correo electrónico al vendedor recordando el pago pendiente"
)
def send_due_reminder(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Envía un recordatorio de pago para una venta específica.
    
    - **sale_id**: ID de la venta
    
    Validaciones:
    - La venta debe existir
    - Debe estar en estado PENDING o PARTIAL
    - Debe tener fecha de vencimiento
    - El vendedor debe tener información de contacto
    """
    # Cargar venta con relaciones
    sale = db.query(SalesModel).options(
        joinedload(SalesModel.product),
        joinedload(SalesModel.seller)
    ).filter(SalesModel.id == sale_id).first()
    
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venta con ID {sale_id} no encontrada"
        )
    
    # Validar estado
    if sale.status not in ['PENDING', 'PARTIAL']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden enviar recordatorios para ventas PENDING o PARTIAL"
        )
    
    # Validar fecha de vencimiento
    if not sale.due_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La venta no tiene fecha de vencimiento"
        )
    
    # Enviar email
    email_service = EmailService()
    success = email_service.send_due_reminder(sale, db)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al enviar el recordatorio. Verifica la información de contacto."
        )
    
    return {
        "message": "Recordatorio enviado exitosamente",
        "sale_id": sale_id,
        "recipient": sale.seller.name
    }

@router.post(
    "/send-batch-reminders",
    summary="Enviar recordatorios a múltiples ventas",
    description="Envía recordatorios masivos a todas las ventas especificadas"
)
def send_batch_reminders(
    sale_ids: List[int],
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Envía recordatorios a múltiples ventas.
    
    Útil para envíos masivos programados.
    """
    results = {
        "sent": 0,
        "failed": 0,
        "errors": []
    }
    
    email_service = EmailService()
    
    for sale_id in sale_ids:
        try:
            sale = db.query(SalesModel).options(
                joinedload(SalesModel.product),
                joinedload(SalesModel.seller)
            ).filter(SalesModel.id == sale_id).first()
            
            if sale and sale.status in ['PENDING', 'PARTIAL'] and sale.due_date:
                if email_service.send_due_reminder(sale, db):
                    results["sent"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append(f"Sale {sale_id}: Error al enviar")
            else:
                results["failed"] += 1
                results["errors"].append(f"Sale {sale_id}: No cumple requisitos")
                
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"Sale {sale_id}: {str(e)}")
    
    return results
```

### **4. Registrar Router en API**

Actualizar: `/backend/app/api/v1/api.py`

```python
from app.api.v1.endpoints import notifications

# ... código existente ...

api_router.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["Notifications"]
)
```

### **5. Variables de Entorno**

Agregar en `/backend/.env`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
FROM_EMAIL=tu-email@gmail.com
FROM_NAME=Flores Artesanales POS
```

---

## 🔄 ESTRATEGIAS DE DISPARO

### **Opción 1: Manual (Ya implementado)**
Usuario hace clic en botón "📧 Notificar" en la tabla de ventas.

**Ventajas:**
- Control total del usuario
- Sin configuración adicional
- Inmediato

**Desventajas:**
- Requiere intervención manual
- Puede olvidarse

---

### **Opción 2: Automático al cargar la página**

En `SalesPage.jsx`, agregar:

```javascript
useEffect(() => {
  const autoSendReminders = async () => {
    if (dueAlerts.length > 0) {
      // Solo enviar una vez al día (guardar en localStorage)
      const lastSent = localStorage.getItem('last_reminder_sent');
      const today = new Date().toDateString();
      
      if (lastSent !== today) {
        try {
          const saleIds = dueAlerts.map(alert => alert.id);
          await notificationService.sendBatchReminders(saleIds);
          localStorage.setItem('last_reminder_sent', today);
          console.log('Recordatorios automáticos enviados');
        } catch (err) {
          console.error('Error en recordatorios automáticos:', err);
        }
      }
    }
  };

  autoSendReminders();
}, [dueAlerts]);
```

---

### **Opción 3: Cron Job en el Servidor (Recomendado para producción)**

Crear script de Python que se ejecute diariamente:

```python
# /backend/scripts/send_due_reminders.py

import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from app.db.database import SessionLocal
from app.models.sales import Sales as SalesModel
from app.services.email_service import EmailService

def send_daily_reminders():
    """Envía recordatorios diarios para ventas que vencen en 2 días o menos"""
    db = SessionLocal()
    
    try:
        # Calcular fecha límite (2 días desde hoy)
        threshold_date = datetime.now().date() + timedelta(days=2)
        
        # Buscar ventas que cumplan condiciones
        sales = db.query(SalesModel).options(
            joinedload(SalesModel.product),
            joinedload(SalesModel.seller)
        ).filter(
            SalesModel.status.in_(['PENDING', 'PARTIAL']),
            SalesModel.due_date <= threshold_date,
            SalesModel.due_date >= datetime.now().date()
        ).all()
        
        email_service = EmailService()
        sent_count = 0
        
        for sale in sales:
            if email_service.send_due_reminder(sale, db):
                sent_count += 1
        
        print(f"✅ Recordatorios enviados: {sent_count}/{len(sales)}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    send_daily_reminders()
```

**Configurar Crontab (Linux/Mac):**

```bash
# Ejecutar diariamente a las 9:00 AM
0 9 * * * /ruta/a/python /ruta/a/backend/scripts/send_due_reminders.py
```

---

## 📊 DATOS QUE DEBE ENVIAR EL FRONTEND

```javascript
// Recordatorio individual
{
  "sale_id": 123
}

// Recordatorios masivos
{
  "sale_ids": [123, 124, 125]
}

// Programar notificación (futuro)
{
  "sale_id": 123,
  "send_date": "2026-02-10T09:00:00Z"
}
```

---

## 🧪 TESTING

### **Probar endpoint manualmente:**

```bash
# Con token JWT
curl -X POST "http://localhost:8000/api/v1/notifications/send-due-reminder/1" \
  -H "Authorization: Bearer <tu-token-jwt>"
```

### **Desde el frontend:**

```javascript
// En la consola del navegador
import notificationService from './services/notificationService';
await notificationService.sendDueReminder(1);
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

1. **Gmail App Passwords:** Si usas Gmail, necesitas crear una "App Password" en lugar de usar tu contraseña normal.

2. **Rate Limiting:** Implementar límite de envíos para evitar spam.

3. **Logs:** Registrar todos los envíos en una tabla `email_logs` para auditoría.

4. **Templates:** Usar plantillas HTML más sofisticadas (ej: MJML o similar).

5. **Proveedores profesionales:** Para producción, considerar:
   - SendGrid
   - Amazon SES
   - Mailgun
   - Twilio SendGrid

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear `notificationService.js` en frontend
- [ ] Agregar botón de notificación en `SalesPage.jsx`
- [ ] Crear estilos para botón de notificación
- [ ] Crear `email_config.py` en backend
- [ ] Crear `email_service.py` en backend
- [ ] Crear `notifications.py` endpoints en backend
- [ ] Registrar router de notificaciones en API
- [ ] Configurar variables de entorno SMTP
- [ ] Probar envío manual desde frontend
- [ ] (Opcional) Implementar cron job para envíos automáticos
- [ ] (Opcional) Crear tabla de logs para auditoría

---

## 🎯 RESULTADO FINAL

Un sistema completo de notificaciones que:

✅ Detecta ventas próximas a vencer
✅ Permite envío manual desde el frontend
✅ Envía correos profesionales con HTML
✅ Puede automatizarse con cron jobs
✅ Mantiene trazabilidad de notificaciones enviadas
✅ Es extensible para SMS u otros canales

---

**Nota:** Este documento describe la arquitectura completa. La implementación del código backend (email_service.py y notifications.py) debe realizarse por el desarrollador backend siguiendo estas especificaciones.
