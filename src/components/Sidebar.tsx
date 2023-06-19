import Link from "next/link";
import { useRouter } from "next/router";
import { FC } from "react";
import useGroupStore from "~/store/useGroupStore";

interface SidebarProps {
  groups: Group[];
}

const Sidebar: FC<SidebarProps> = ({ groups }) => {
  //This may be suboptimal as compared to using Link component, but I had styling issues with that, hence I'm using this approach for now
  const router = useRouter();
  //some issue while using useGroupStore(state => state.groupId);
  const curGroupId = router.query.groupId;
  // const curGroupId = useGroupStore(state => state.groupId);
  return (
    <div className="mt-16">
      <div className="p-2 text-xl">
        {/* <li className="py-2">Dasboard</li>
        <li>Recent</li>
        <div className="divider"></div> */}
        <div className="mb-3 flex justify-between">
          <div>Groups</div>
          <div className="rounded-md px-2 hover:cursor-pointer hover:bg-neutral-focus">
            <Link href="/groups/new">+</Link>
          </div>
        </div>
        <ul className="ml-1 text-lg">
          {groups.length === 0 ? (
            <li>No groups</li>
          ) : (
            groups.map((group) => (
              <Link
                key={group.id}
                className={`block box-content rounded-md px-2 py-1 hover:cursor-pointer hover:bg-neutral-focus ${
                  group.id === curGroupId && "bg-neutral-focus"
                }`}
                href={`/groups/${group.id}`}
              >
                - {group.name}
              </Link>
            ))
          )}
        </ul>
        <div className="divider"></div>
      </div>
    </div>
  );
};

type Group = {
  name: string;
  id: string;
};

export default Sidebar;
