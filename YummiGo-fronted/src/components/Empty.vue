<template>
  <div class="empty-box">
    <div class="img-box">
      <img v-if="!props.isSearch" src="../assets/image/table_empty.png" alt="">
      <img v-else src="../assets/image/search_table_empty.png">
      <p>{{ !props.isSearch ? 'ここは空っぽです' : '申し訳ありません、お探しのコンテンツが見つかりませんでした' }}</p>
    </div>
  </div>
</template>

<script setup lang='ts'>
const props = defineProps({
  isSearch: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped lang="less">
.empty-box {
  text-align: center;
  margin: 20px 0;

  img {
    margin: 0 atuo;
    width: 238px;
    height: 184px;
    margin-top: 20px;
    margin-bottom: 26px;
  }

  p {
    color: #818693;
  }
}
</style>
