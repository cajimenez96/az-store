# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/02-checkout.spec.ts >> Checkout Flow >> cart persists across navigation
- Location: tests/e2e/specs/02-checkout.spec.ts:92:7

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - link "Marder Hombres logo Marder Hombres" [ref=e5] [cursor=pointer]:
          - /url: /
          - img "Marder Hombres logo" [ref=e6]
          - generic [ref=e7]: Marder Hombres
        - generic [ref=e10]:
          - img
          - searchbox "Buscar productos..." [ref=e11]
        - navigation [ref=e13]:
          - link "Ver carrito" [ref=e14] [cursor=pointer]:
            - /url: /cart
            - img
          - button "Cambiar a modo oscuro" [ref=e15] [cursor=pointer]:
            - img
          - link "Iniciar Sesión" [ref=e16] [cursor=pointer]:
            - /url: /sign-in
            - img
            - text: Iniciar Sesión
    - main [ref=e17]:
      - generic [ref=e19]:
        - paragraph [ref=e20]: Nueva Colección
        - heading "Estilo que habla por vos" [level=1] [ref=e21]
        - link "Explorar colección" [ref=e22] [cursor=pointer]:
          - /url: /search
      - generic [ref=e25]:
        - generic [ref=e26]:
          - paragraph [ref=e27]: Envíos
          - heading "Comprá con confianza" [level=2] [ref=e28]
          - paragraph [ref=e29]: Envíos a todo el país · Pagá en cuotas · Atención personalizada
        - link "Explorar catálogo" [ref=e30] [cursor=pointer]:
          - /url: /search
    - contentinfo [ref=e31]:
      - generic [ref=e32]:
        - generic [ref=e33]:
          - generic [ref=e34]:
            - paragraph [ref=e35]: Marder Hombres
            - paragraph [ref=e36]: Tu tienda online de confianza. Calidad, variedad y la mejor atención al cliente.
          - generic [ref=e37]:
            - paragraph [ref=e38]: Tienda
            - list [ref=e39]:
              - listitem [ref=e40]:
                - link "Todos los productos" [ref=e41] [cursor=pointer]:
                  - /url: /search
              - listitem [ref=e42]:
                - link "Destacados" [ref=e43] [cursor=pointer]:
                  - /url: /search?isFeatured=true
              - listitem [ref=e44]:
                - link "Mi carrito" [ref=e45] [cursor=pointer]:
                  - /url: /cart
          - generic [ref=e46]:
            - paragraph [ref=e47]: Mi Cuenta
            - list [ref=e48]:
              - listitem [ref=e49]:
                - link "Perfil" [ref=e50] [cursor=pointer]:
                  - /url: /user/profile
              - listitem [ref=e51]:
                - link "Mis pedidos" [ref=e52] [cursor=pointer]:
                  - /url: /user/orders
              - listitem [ref=e53]:
                - link "Iniciar sesión" [ref=e54] [cursor=pointer]:
                  - /url: /sign-in
        - generic [ref=e55]:
          - paragraph [ref=e56]: © 2026 Marder Hombres. Todos los derechos reservados.
          - generic [ref=e57]:
            - link "Privacidad" [ref=e58] [cursor=pointer]:
              - /url: "#"
            - link "Términos" [ref=e59] [cursor=pointer]:
              - /url: "#"
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e65] [cursor=pointer]:
    - img [ref=e66]
  - alert [ref=e69]
```