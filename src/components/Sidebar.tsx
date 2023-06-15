import { FC } from "react";

interface SidebarProps {
  groups: Group[];
}

const Sidebar: FC<SidebarProps> = ({ groups }) => {
  return (
    <div className="mt-16">
      <ul className="p-2 text-xl">
        <li className="py-2">Dasboard</li>
        <li>Recent</li>
        <div className="divider"></div>
        <li>Groups</li>
        <ul className="ml-1 text-lg">
          {groups.length === 0 ? (
            <li>No groups</li>
          ) : (
            groups.map((group) => (
              <li
                className="rounded-md px-2 py-1 hover:cursor-pointer hover:bg-neutral-focus"
                key={group.id}
              >
                - {group.name}
              </li>
            ))
          )}
        </ul>
        <div className="divider"></div>
      </ul>
    </div>
  );
};

type Group = {
  name: string;
  id: string;
};

export default Sidebar;
