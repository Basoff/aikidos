<template>
  <div class="page">
    <aikidos-game />
  </div>
</template>

<style>
.page {
  position: relative;
  width: inherit;
  height: inherit;
}
</style>
<script>
import "src/css/game.css";
import AikidosGame from "src/components/AikidosGame.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  components: {
    AikidosGame,
  },
});
</script>
