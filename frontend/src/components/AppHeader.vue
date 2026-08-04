<script setup>
</script>

<template>
  <header class="header">
    <div class="container bar">
      <RouterLink to="/" class="logo">Roto<span>Mart</span></RouterLink>
      <nav>
        <RouterLink to="/" class="nav-link">Shop</RouterLink>
        <!-- Cart link lands in F5 -->
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header { background: var(--green); color: #fff; }
.bar { display: flex; align-items: center; justify-content: space-between; height: 60px; }
.logo { font-size: 1.35rem; font-weight: 800; letter-spacing: -0.5px; }
.logo span { color: var(--amber); }
.nav-link { font-weight: 600; opacity: 0.9; }
.nav-link:hover { opacity: 1; }
</style>
