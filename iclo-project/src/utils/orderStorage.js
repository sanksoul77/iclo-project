// src/utils/orderStorage.js
const STORAGE_KEY = 'iclo_orders'

export function getAllOrders() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addOrder(order) {
  const orders = getAllOrders()
  orders.unshift(order)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  return order
}

export function updateOrder(orderId, updates) {
  const orders = getAllOrders()
  const index = orders.findIndex(o => o.id === orderId)
  if (index >= 0) {
    orders[index] = { ...orders[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    return orders[index]
  }
  return null
}

export function getOrderById(orderId) {
  const orders = getAllOrders()
  return orders.find(o => o.id === orderId) || null
}

export function deleteOrder(orderId) {
  const orders = getAllOrders()
  const filtered = orders.filter(o => o.id !== orderId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return filtered.length < orders.length
}

