<template>
  <aikidos-game />
</template>

<script>
import AikidosGame from "src/components/AikidosGame.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  components: {
    AikidosGame,
  },
});
</script>
