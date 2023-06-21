import { useRouter } from "next/router";
import React, { useState } from "react";
import { api } from "~/utils/api";

const NewGroupForm: React.FC = () => {
  const [groupName, setGroupName] = useState("");
  const [user, setUser] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser(e.target.value);
  };

  const handleAddUser = () => {
    setGroupMembers([...groupMembers, user]);
    setUser("");
  };

  const router = useRouter();
  const groupCreator = api.group.create.useMutation({
    onSuccess(data, _variables, _context) {
      void router.push(`/groups/${data.groupId}`);
    },
  });
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Perform form submission logic here
    console.log("Submitted:", groupName, groupMembers);
    groupCreator.mutate({
      members: groupMembers,
      groupName: groupName,
    });
    // Reset form fields
  };

  return (
    <div className="flex h-screen items-center justify-center text-xl">
      <div className="w-[40rem]">
        <form
          className="mx-auto w-[30rem] rounded-lg bg-neutral-focus p-6 shadow-md"
          onSubmit={handleSubmit}
        >
          <div className="px-auto mb-6">
            <label className="mb-4 block font-bold" htmlFor="groupName">
              Group Name
            </label>
            <input
              className="input-bordered input-primary input w-full max-w-xs"
              id="groupName"
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={handleGroupNameChange}
            />
          </div>
          <div className="mb-4 mt-3">
            <label className="mb-4 block font-bold" htmlFor="user">
              Add User
            </label>
            <input
              className="input-bordered input-primary input w-full max-w-xs"
              id="user"
              type="text"
              placeholder="Enter username"
              value={user}
              onChange={handleUserChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  console.log("this");
                  handleAddUser();
                }
              }}
            />
          </div>
          <button
            className="btn-primary btn-sm btn mt-2"
            onClick={(e) => {
              //weird, hitting this was causing the form to submit. Hence e.preventDefault
              e.preventDefault();
              handleAddUser();
            }}
          >
            Add User
          </button>
          <ul className="mt-4 list-disc pl-6">
            {groupMembers.map((member, index) => (
              <li key={index}>{member}</li>
            ))}
          </ul>
          <button className="btn-primary btn-sm btn mt-4" type="submit">
            {groupCreator.isLoading && (
              <span className="loading loading-spinner"></span>
            )}
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewGroupForm;
