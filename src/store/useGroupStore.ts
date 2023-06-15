import { create } from "zustand";

type Member = {
  name: string | null;
  id: string;
};

interface GroupState {
  members: Member[];
  groupId: string;
  setGroupId: (groupId: string) => void;
  setMembers: (members: Member[]) => void;
}

const useGroupStore = create<GroupState>()((set) => ({
  groupId: "",
  members: [],
  setGroupId: (_groupId) =>
    set((state) => ({
      ...state,
      groupId: _groupId,
    })),
  setMembers: (_members) =>
    set((state) => ({
      ...state,
      members: _members,
    })),
}));

export default useGroupStore;
