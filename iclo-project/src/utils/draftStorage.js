// src/utils/draftStorage.js
const STORAGE_KEY = 'iclo-drafts'

const defaultDrafts = [
  {
    id: 1,
    title: '夏季通勤搭配',
    desc: '白色衬衫+卡其裤+乐福鞋，适合办公室通勤',
    cover: 'https://picsum.photos/id/21/300/200',
    type: 'match',
    itemCount: 3,
    updateTime: '2024-11-08'
  },
  {
    id: 2,
    title: '周末休闲装',
    desc: '印花T恤+牛仔短裤+帆布鞋，适合周末出行',
    cover: 'https://picsum.photos/id/26/300/200',
    type: 'match',
    itemCount: 3,
    updateTime: '2024-11-05'
  },
  {
    id: 3,
    title: '冬季外套收藏',
    desc: '羽绒服、毛呢大衣等冬季保暖外套',
    cover: 'https://picsum.photos/id/91/300/200',
    type: 'collect',
    itemCount: 5,
    updateTime: '2024-11-01'
  }
]

export const getDefaultDrafts = () => JSON.parse(JSON.stringify(defaultDrafts))

export function loadDrafts() {
  try {
    const cache = localStorage.getItem(STORAGE_KEY)
    if (cache) {
      return JSON.parse(cache)
    }
  } catch (error) {
    console.warn('Failed to load drafts:', error)
  }
  return getDefaultDrafts()
}

export function saveDrafts(drafts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch (error) {
    console.warn('Failed to save drafts:', error)
  }
}

export function addDraft(draft) {
  const drafts = loadDrafts()
  drafts.unshift(draft)
  saveDrafts(drafts)
  return drafts
}

export function deleteDraft(id) {
  const drafts = loadDrafts().filter(item => item.id !== id)
  saveDrafts(drafts)
  return drafts
}

export function getDraftById(id) {
  const targetId = String(id)
  return loadDrafts().find(item => String(item.id) === targetId) || null
}

export function upsertDraft(draft) {
  const drafts = loadDrafts()
  const index = drafts.findIndex(item => String(item.id) === String(draft.id))
  if (index > -1) {
    drafts[index] = draft
  } else {
    drafts.unshift(draft)
  }
  saveDrafts(drafts)
  return drafts
}

