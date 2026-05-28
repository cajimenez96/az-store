# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/02-checkout.spec.ts >> Checkout Flow >> cannot checkout with empty cart
- Location: tests/e2e/specs/02-checkout.spec.ts:123:7

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - link "Marder Hombres logo Marder Hombres" [ref=e6] [cursor=pointer]:
          - /url: /
          - img "Marder Hombres logo" [ref=e7]
          - generic [ref=e8]: Marder Hombres
        - generic [ref=e11]:
          - img
          - searchbox "Buscar productos..." [ref=e12]
        - navigation [ref=e14]:
          - link "Ver carrito" [ref=e15] [cursor=pointer]:
            - /url: /cart
            - img
          - button "Cambiar a modo oscuro" [ref=e16] [cursor=pointer]:
            - img
          - link "Iniciar Sesión" [ref=e17] [cursor=pointer]:
            - /url: /sign-in
            - img
            - text: Iniciar Sesión
    - main [ref=e18]:
      - generic [ref=e19]:
        - img [ref=e21]
        - heading "Tu carrito está vacío" [level=1] [ref=e24]
        - paragraph [ref=e25]: Explorá nuestro catálogo y encontrá lo que buscás.
        - link "Ir a comprar" [ref=e26] [cursor=pointer]:
          - /url: /
          - button "Ir a comprar" [ref=e27]
    - contentinfo [ref=e29]:
      - generic [ref=e30]: © 2026 Marder Hombres. Todos los derechos reservados.
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e36] [cursor=pointer]:
    - img [ref=e37]
  - alert [ref=e40]
```