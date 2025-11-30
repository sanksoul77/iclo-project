<!-- src/App.vue -->
<template>
  <div class="app">
    <Header />
    <!-- 路由出口：所有页面将在这里渲染 -->
    <router-view />
  </div>
</template>

<script setup>
import Header from './components/Header.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Arial', sans-serif;
}

html, body {
  height: 100%;
  overflow-x: hidden;
  
}

.app {
  width: 100%;
}
</style>