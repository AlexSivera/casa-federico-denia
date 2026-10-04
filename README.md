# Casa Federico · Restaurant Les Marines (Dénia)

Propuesta de web para **Casa Federico**, restaurante familiar desde 1980 en la playa de Les Marines (Dénia): arroces de recetas de antaño, pescado de la Lonja de Dénia y una terraza bajo el cañizo.

**Vista previa:** https://alexsivera.github.io/casa-federico-denia/

## Concepto: «Bajo el cañizo»

La web es el recetario de la casa abierto sobre una mesa bajo el cañizo. El papel cálido, la tinta roja del grabado de su carta, el valenciano primero (como en su carta) y las fotografías reales de la casa. Las dos piezas firma son:

- **Portada:** la terraza de cañizo con la paella recortada en círculo, que gira con el scroll.
- **«Sec, melós o caldós»:** gráfico interactivo que explica las tres texturas del arroz y los arroces filtrables por familia.

## Páginas

| Página | Contenido |
|---|---|
| `index.html` | Relato completo: la casa, arroces, lonja, tapas de la Marina, reseñas, historia, espacios, bodega, preguntas, ubicación |
| `carta.html` | Carta completa de 2025 en **valenciano, castellano e inglés** (129 platos), con precios |
| `reservas.html` | Módulo oficial de reservas (CoverManager), teléfono y normas |

## Desarrollo

```bash
npm install        # solo sharp (devDependency) para imágenes y dimensiones
npm run dev        # http://localhost:4173
npm run build      # genera index/carta/reservas.html desde _plantillas/
npm run images     # regenera assets/img desde _src/img (originales, no versionados)
npm run check      # comprobación estática
```

Las fotografías y los textos son de Casa Federico (web oficial casafederico.es). La carta procede del PDF oficial de 2025.
