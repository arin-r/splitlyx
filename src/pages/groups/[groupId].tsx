import { useState } from "react";
import { Header } from "~/components/Header";
import { api } from "~/utils/api";

import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "~/server/db";
import AddExpenseModal from "~/components/AddExpenseModal";
import Expenses from "~/components/Expenses";
import TabSelector from "~/components/TabSelector";
import GroupBalances from "~/components/GroupBalances";
import Sidebar from "~/components/Sidebar";

export const getServerSideProps: GetServerSideProps<{
  groups: Group[];
  members: Member[];
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
  const groupsOfMember = await prisma.user.findFirst({
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

  const members = await prisma.user.findMany({
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
        groupsOfMember?.groups.map((group) => ({
          name: group.name,
          id: group.id,
        })) || [],
      members: members,
      groupId: groupId,
    },
  };
};

/**
 * TODO
 * Optimisation: members and balances contain repeated data of user.id and user.name
 *
 * This leads to rather incovenient data which has to be handled now. For instance, while finding selectedMemberIndex
 * I have to find the index in members array which has same userId as balance.user.id
 *
 * Solution
 * 1. change API end points, and only make one request similar to "api.group.getMemberData"
 *    which returns an object {id, name, balance} []
 * 2. Another solution could be that I sort both members and balances array lexicographically based on
 *    user.name which will make indexes for same user, the same
 *
 * However I want to display a list of Group Members which should be server side rendered. Every time an expense is added/removed
 * the balances change, which will cause weird loading state issues in the "Group Members" list.
 */
const groupsPage = ({
  groups,
  members,
  groupId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [showAddExpenseModal, setShowAddExpenseModal] =
    useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("expenses");

  /**
   * Why useQuery hook is used outside the component:
   *  Because I need the refetchBalances and refetchExpenses function in two places.
   *    1. When I delete an expense from Expense component
   *    2. When I add an expense from [groupId] component
   */
  const expensesQuery = api.group.getAllExpenses.useQuery(
    { groupId: groupId },
    { refetchOnWindowFocus: false }
  );

  const balancesQuery = api.group.getGroupBalances.useQuery(
    { groupId: groupId },
    { refetchOnWindowFocus: false }
  );

  const expenseCreator = api.expense.create.useMutation({
    onSuccess() {
      updateExpensesAndBalances();
    },
  });

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const updateExpensesAndBalances = () => {
    void expensesQuery.refetch();
    void balancesQuery.refetch();
  };
  return (
    <div>
      <div>
        {showAddExpenseModal && (
          <AddExpenseModal
            members={members}
            message="Configure The expense"
            onCancel={() => {
              setShowAddExpenseModal(false);
            }}
            handleExpenseCreation={(
              expenseName,
              expenseContributions,
              totalExpense
            ) => {
              setShowAddExpenseModal(false);
              expenseCreator.mutate({
                expenseContributions: expenseContributions,
                expenseName: expenseName,
                groupId: groupId,
                totalExpense: totalExpense,
              });
            }}
          />
        )}
      </div>
      <Header />

      <div className="flex justify-center">
        <div className="grid grid-cols-8">
          <div className="col-span-2 border-r-[1px] border-[#272d35]">
            <Sidebar groups={groups} />
          </div>
          <div className="col-span-4 border-r-[1px] border-[#272d35] p-0">
            <div className="mx-auto mt-8 w-max">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="mr-20 text-3xl font-bold">Hong Kong</div>
                <div>
                  <button
                    className="btn-primary btn mr-2 px-2"
                    onClick={() => {
                      setShowAddExpenseModal(true);
                    }}
                  >
                    Add an Expense
                  </button>
                  <button className="btn-primary btn px-2 ">Settle up</button>
                </div>
              </div>
            </div>
            <TabSelector
              activeTab={activeTab}
              handleTabClick={handleTabClick}
            />
            <Expenses
              expenses={expensesQuery.data}
              expensesIsLoading={expensesQuery.isLoading}
              expensesIsRefetching={expensesQuery.isRefetching}
              updateExpensesAndBalances={updateExpensesAndBalances}
              groupId={groupId}
            />
          </div>
          <div className="col-span-2">
            <GroupBalances
              balances={balancesQuery.data}
              balancesIsLoading={balancesQuery.isLoading}
              balancesIsRefetching={balancesQuery.isRefetching}
              groupId={groupId}
              members={members}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

type Group = {
  name: string;
  id: string;
};

type Member = {
  id: string;
  name: string | null;
};

export default groupsPage;
