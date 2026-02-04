# Estructura de Estilos

Esta carpeta contiene todos los estilos CSS del proyecto, organizados por tipo de componente.

## Organización

```
styles/
├── components/     # Estilos de componentes reutilizables
│   ├── Navbar.css
│   ├── Hero.css
│   ├── ProductCard.css
│   └── ProductsSection.css
└── pages/          # Estilos específicos de páginas
    ├── Home.css
    ├── Login.css
    └── Register.css
```

## Variables CSS

Todas las variables de color están definidas en `src/index.css`:

```css
:root {
  --bg-primary: #FCF9F2;       /* Fondo principal */
  --bg-white: #ffffff;          /* Fondo blanco */
  --color-cta: #E29595;         /* Color de botones y enlaces */
  --color-cta-hover: #d47d7d;   /* Color hover de CTA */
  --color-secondary: #84A98C;   /* Color secundario */
  --color-text: #353535;        /* Color de texto principal */
  --color-premium: #D4AF37;     /* Color premium (dorado) */
  --color-error: #dc3545;       /* Color de errores */
}
```

## Uso de Variables

En lugar de usar códigos hex directamente:

```css
/* ❌ No hacer esto */
color: #353535;

/* ✅ Hacer esto */
color: var(--color-text);
```

Esto facilita:
- Mantenimiento del código
- Cambios globales de tema
- Consistencia visual
- Lectura y comprensión del código
