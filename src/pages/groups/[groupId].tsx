import { FC } from "react";
import { Header } from "~/components/Header";
import { api } from "~/utils/api";

import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "~/server/db";

type Group = {
  name: string;
  id: string;
};

type Participant = {
  id: string;
};

export const getServerSideProps: GetServerSideProps<{
  groups: Group[];
  participants: Participant[];
  groupId: string;
}> = async (ctx) => {
  const session = await getSession(ctx);
  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  const groupId = ctx.params?.groupId;

  if (Array.isArray(groupId) || !groupId) {
    throw new Error("Invalid Path");
  }
  await prisma.group.findUniqueOrThrow({
    where: {
      id: groupId,
    },
  });
  const groupsOfUser = await prisma.user.findFirst({
    where: {
      name: session.user.name,
    },
    select: {
      groups: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });
  console.log(ctx.params?.groupId);

  const participants = await prisma.user.findMany({
    where: {
      groups: {
        some: {
          id: groupId,
        },
      },
    },
    select: {
      name: true,
      id: true,
    },
  });

  return {
    props: {
      groups:
        groupsOfUser?.groups.map((group) => ({
          name: group.name,
          id: group.id,
        })) || [],
      participants: participants,
      groupId: groupId,
    },
  };
};

const dashboard = ({
  groups,
  participants,
  groupId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  console.log("groups = ", groups);
  console.log("participants = ", participants);

  const { data: expenses } = api.group.getAllExpenses.useQuery(
    { groupId: groupId },
    {
      refetchOnWindowFocus: false,
    }
  );

  const expenseCreator = api.expense.create.useMutation();
  const addExpenseHandler = async () => {
    expenseCreator.mutate({
      expenseContributions: [
        {
          userId: participants[0]?.id!,
          paid: 10,
          actualShare: 20,
        },
        {
          userId: participants[1]?.id!,
          paid: 90,
          actualShare: 80,
        },
      ],
      expenseName: "Drinks",
      groupId: groupId,
      totalExpense: 100,
    });
  };
  return (
    <div>
      <Header />
      <div className="flex justify-center">
        <div className="grid grid-cols-8">
          <div className="col-span-2 border-r-[1px] border-[#272d35]">
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
                <li>Friends</li>
                <ul className="ml-1 text-lg">
                  <li>- Alpha</li>
                  <li>- Beta</li>
                </ul>
              </ul>
            </div>
          </div>
          <div className="col-span-4 border-r-[1px] border-[#272d35] p-0">
            <div className="mx-auto mt-8 w-max">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="mr-20 text-3xl font-bold">Hong Kong</div>
                <div>
                  <button
                    className="btn-primary btn mr-2 px-2"
                    onClick={addExpenseHandler}
                  >
                    Add an Expense
                  </button>
                  <button className="btn-primary btn px-2 ">Settle up</button>
                </div>
              </div>
            </div>

            <ul className="mx-2">
              {expenses ? (
                expenses.map((expense) => {
                  return (
                    <li className="mb-2">
                      <div className="rounded-md bg-neutral-focus p-4 shadow-md">
                        <div className="text-lg font-bold">{expense.name}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-gray-500">Total expense</div>
                          <div className="text-gray-500">${expense.totalExpense.toFixed(2)}</div>
                        </div>
                      </div>
                    </li>
                  );
                })
              ) : (
                <progress className="progress w-56"></progress>
              )}
            </ul>
          </div>
          <div className="col-span-2">
            <div className="mt-16 pl-4">
              <p className="py-2 text-xl">Group Balances</p>
              <ul>
                <li className="border-b-[1px] border-[#272d35] pb-2">
                  <div className="text-left">
                    <div className="text-lg font-bold">Alpha</div>
                    <div className="text-base italic">gets back $20.00</div>
                  </div>
                </li>

                <li className="border-b-[1px] border-[#272d35] pb-2 pt-2">
                  <div className="text-left">
                    <div className="text-lg font-bold">Beta</div>
                    <div className="text-base italic">owes $40.00</div>
                  </div>
                </li>
                <li className="border-b-[1px] border-[#272d35] pb-2 pt-2">
                  <div className="text-left">
                    <div className="text-lg font-bold">Arin Roday</div>
                    <div className="text-base italic">gets back $20.00</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default dashboard;
