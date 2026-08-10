<template>
  <main class="container wrap">
    <div class="panel">
      <p class="big">404</p>
      <h1>Page not found</h1>
      <p class="note">The page you're looking for doesn't exist or has moved.</p>
      <RouterLink to="/"><button class="btn btn-buy">Back to the shop</button></RouterLink>
    </div>
  </main>
</template>

<style scoped>
.wrap { min-height: 60vh; display: grid; place-items: center; text-align: center; }
.big { font-size: 3.5rem; font-weight: 800; color: var(--green); margin: 0; letter-spacing: -1px; }
h1 { margin: 0.25rem 0 0.5rem; letter-spacing: -0.5px; }
.note { color: var(--muted); margin: 0 0 1.25rem; }
</style>
