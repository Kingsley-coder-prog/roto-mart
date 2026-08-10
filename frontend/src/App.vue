<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './components/AppHeader.vue';

// Admin pages have their own AdminNav — hide the storefront header there.
const route = useRoute();
const isAdmin = computed(() => route.path.startsWith('/admin'));
</script>

<template>
  <AppHeader v-if="!isAdmin" />
  <router-view />
</template>
