import { create } from 'zustand'

const useChatStore = create((set) => ({
  open: false,
  activeConvUuid: null,
  activeOther: null,
  openWith: (convUuid, other) => set({ open: true, activeConvUuid: convUuid, activeOther: other }),
  openPanel: () => set({ open: true }),
  close: () => set({ open: false, activeConvUuid: null, activeOther: null }),
}))

export default useChatStore
