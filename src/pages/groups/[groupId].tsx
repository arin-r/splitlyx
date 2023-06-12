import { FC, useState } from "react";
import { Header } from "~/components/Header";
import { api } from "~/utils/api";

import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "~/server/db";
import AddExpenseModal from "~/components/AddExpenseModal";
import ExpenseDetailsModal from "~/components/ExpenseDetailsModal";

type Group = {
  name: string;
  id: string;
};

type Participant = {
  id: string;
  name: string | null;
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

const dashboard = ({ groups, participants, groupId }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [showExpenseDetailsModel, setShowExpenseDetailsModal] = useState<boolean>(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>("");
  const {
    data: expenses,
    refetch: refetchExpenses,
    isLoading: expensesIsLoading,
    isRefetching: expensesIsRefetching,
  } = api.group.getAllExpenses.useQuery({ groupId: groupId }, { refetchOnWindowFocus: false });

  const { data: balances, isLoading: balancesIsLoading, refetch: refetchBalances, isRefetching: balancesIsRefetching } = api.group.getGroupBalances.useQuery(
    { groupId: groupId },
    { refetchOnWindowFocus: false }
  );

  const expenseCreator = api.expense.create.useMutation({
    onSuccess: () => {
      void refetchExpenses();
      void refetchBalances();
    },
  });

  const expenseDeletor = api.expense.delete.useMutation({
    onSuccess(data, variables, context) {
      void refetchExpenses();
      void refetchBalances();
    },
  });

  const addExpenseHandler = () => {
    setShowAddExpenseModal(true);
  };

  return (
    <div>
      <div>
        <AddExpenseModal
          participants={participants}
          isOpen={showAddExpenseModal}
          message="Configure The expense"
          onCancel={() => {
            setShowAddExpenseModal(false);
          }}
          handleExpenseCreation={(expenseName, expenseContributions, totalExpense) => {
            setShowAddExpenseModal(false);
            expenseCreator.mutate({
              expenseContributions: expenseContributions,
              expenseName: expenseName,
              groupId: groupId,
              totalExpense: totalExpense,
            });
          }}
        />
        {showExpenseDetailsModel && (
          <ExpenseDetailsModal
            expenseId={selectedExpenseId}
            onCancel={() => {
              setShowExpenseDetailsModal(false);
            }}
            onDelete={() => {
              expenseDeletor.mutate({
                expenseId: selectedExpenseId,
                groupId: groupId,
              });
              setShowExpenseDetailsModal(false);
              setSelectedExpenseId("");
            }}
          />
        )}
      </div>
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
                      <li className="rounded-md px-2 py-1 hover:cursor-pointer hover:bg-neutral-focus" key={group.id}>
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
                  <button className="btn-primary btn mr-2 px-2" onClick={addExpenseHandler}>
                    Add an Expense
                  </button>
                  <button className="btn-primary btn px-2 ">Settle up</button>
                </div>
              </div>
            </div>

            {(!expenses || expensesIsLoading || expensesIsRefetching) && (
              <div className="mb-4 mt-4 flex items-center justify-center">
                <progress className="progress w-56"></progress>
              </div>
            )}
            {expenses && (
              <ul className="mx-2">
                {expenses.map((expense) => {
                  return (
                    <li
                      key={expense.id}
                      className="mb-2 hover:cursor-pointer"
                      onClick={() => {
                        setSelectedExpenseId(expense.id);
                        setShowExpenseDetailsModal(true);
                      }}
                    >
                      <div className="rounded-md bg-neutral-focus p-4 shadow-md">
                        <div className="text-lg font-bold">{expense.name}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="">Total expense</div>
                          <div className="">${expense.totalExpense.toFixed(2)}</div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="col-span-2">
            <div className="mt-16 pl-4">
              <p className="py-2 text-xl">Group Balances</p>
              <ul>
                {(balancesIsLoading || balancesIsRefetching) && (
                  <div className="mb-4 mt-4 flex items-center justify-center">
                    <progress className="progress w-56"></progress>
                  </div>
                )}
                {balances &&
                  balances.map((balance, idx) => {
                    return (
                      <li key= {idx} className="border-b-[1px] border-[#272d35] pb-2">
                        <div className="text-left">
                          <div className="text-lg font-bold">{balance.user.name}</div>
                          <div className="text-base italic">
                            {balance.balance < 0 ? "gets back " : "owes "} {Math.abs(balance.balance)}
                          </div>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default dashboard;
