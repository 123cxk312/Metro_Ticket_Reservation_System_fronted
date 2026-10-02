<template>
  <RouterView />
</template>

<script setup lang="ts"></script>

<style>
:root {
  color-scheme: light;
  font-family:
    "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Helvetica Neue", Arial, sans-serif;
  color: #17252c;
  background: #f3f6f5;
  font-synthesis: none;
  text-rendering: optimizeLegibility;

  --app-bg: #f3f6f5;
  --app-surface: #ffffff;
  --app-surface-soft: #f8faf9;
  --app-text: #17252c;
  --app-text-secondary: #5f6f76;
  --app-border: #dce5e3;
  --app-primary: #0f8b8d;
  --app-primary-dark: #096d6f;
  --app-accent: #e4572e;
  --app-warning: #d99b17;
  --app-danger: #c53b32;
  --app-radius: 8px;
  --app-shadow: 0 10px 30px rgb(22 48 54 / 8%);

  --el-color-primary: #0f8b8d;
  --el-color-primary-light-3: #56afb1;
  --el-color-primary-light-5: #87c6c7;
  --el-color-primary-light-7: #b8dddd;
  --el-color-primary-light-8: #d0e8e8;
  --el-color-primary-light-9: #e7f3f3;
  --el-color-primary-dark-2: #0c7071;
  --el-color-success: #2f8f63;
  --el-color-warning: #d99b17;
  --el-color-danger: #c53b32;
  --el-color-info: #66767d;
  --el-border-radius-base: 6px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#app {
  min-width: 320px;
  min-height: 100%;
  margin: 0;
}

body {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgb(15 139 141 / 5%), transparent 240px),
    var(--app-bg);
  color: var(--app-text);
}

button,
input,
textarea,
select {
  font: inherit;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

a {
  color: inherit;
  text-decoration: none;
}

:focus-visible {
  outline: 2px solid var(--app-primary);
  outline-offset: 2px;
}
</style>
