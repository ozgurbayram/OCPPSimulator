import { configureStore } from '@reduxjs/toolkit'

// Example UI slice: theme and sidebar state
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

type Theme = 'light' | 'dark'

interface UiState {
  theme: Theme
  sidebarOpen: boolean
}

const initialState: UiState = {
  theme: 'light',
  sidebarOpen: true,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
  },
})

export const { setTheme, toggleTheme, setSidebarOpen, toggleSidebar } = uiSlice.actions

import ocppReducer from '../features/ocpp/ocppSlice'
import { loadOcppState, saveOcppState } from '../features/ocpp/storage'

const preloadedOcpp = loadOcppState()

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    ocpp: ocppReducer,
  },
  preloadedState: preloadedOcpp ? { ocpp: preloadedOcpp } : undefined,
})

// Persist ocpp slice to localStorage (simple throttle)
let persistTimer: number | undefined
store.subscribe(() => {
  if (persistTimer) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    const state = store.getState() as any
    const ocpp = state.ocpp
    saveOcppState({ items: ocpp.items, order: ocpp.order, selectedId: ocpp.selectedId })
  }, 250)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
