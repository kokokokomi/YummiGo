<template>
  <div class="container">
    <h2 class="homeTitle">
      注文<i>{{ days[1] }}</i>
      <div class="more">
        <router-link to="/order">注文一覧</router-link>
        <el-icon>
          <ArrowRight />
        </el-icon>
      </div>
    </h2>
    <div class="orderviewBox">
      <ul>
        <li>
          <span class="status">
            <el-icon>
              <DocumentAdd />
            </el-icon>
            受付待ち
          </span>
          <span class="num tip">
            <router-link to="/order?status=2">{{ orderviewData.waitingOrders }}</router-link>
          </span>
        </li>
        <li>
          <span class="status">
            <el-icon>
              <Bicycle />
            </el-icon>
            配達待ち
          </span>
          <span class="num tip">
            <router-link to="/order?status=3">{{ orderviewData.deliveredOrders }}</router-link>
          </span>
        </li>
        <li>
          <span class="status">
            <el-icon>
              <DocumentChecked />
            </el-icon>
            完了
          </span>
          <span class="num">
            <router-link to="/order?status=5">{{ orderviewData.completedOrders }}</router-link>
          </span>
        </li>
        <li>
          <span class="status">
            <el-icon>
              <DocumentDelete />
            </el-icon>
            キャンセル
          </span>
          <span class="num">
            <router-link to="/order?status=6">{{ orderviewData.cancelledOrders }}</router-link>
          </span>
        </li>
        <li>
          <span class="status">
            <el-icon>
              <Document />
            </el-icon>
            すべて
          </span>
          <span class="num">
            <router-link to="/order">{{ orderviewData.allOrders }}</router-link>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { getday } from '@/utils/date'

// Define props
const props = defineProps<{
  orderviewData: {
    waitingOrders: number,
    deliveredOrders: number,
    completedOrders: number,
    cancelledOrders: number,
    allOrders: number
  }
}>()

// Computed property for days
const days = computed(() => getday())
</script>

<style scoped>
</style>
