
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // 기존 카운터
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }


  // ===========================
  // 반환
  // ===========================
  return {
    count,
    doubleCount,
    increment,
  }
})
