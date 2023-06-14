import { FC, useState } from "react";
import { Header } from "~/components/Header";
import { api } from "~/utils/api";

import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "~/server/db";
import AddExpenseModal from "~/components/AddExpenseModal";
import ExpenseDetailsModal from "~/components/ExpenseDetailsModal";
import RepaymentDetailsModal from "~/components/RepaymentDetailsModal";

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
const dashboard = ({
  groups,
  members,
  groupId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [showAddExpenseModal, setShowAddExpenseModal] =
    useState<boolean>(false);
  const [showExpenseDetailsModel, setShowExpenseDetailsModal] =
    useState<boolean>(false);
  const [showMemberRepaymentDetailsModal, setShowMemberRepaymentDetailsModal] =
    useState<boolean>(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(-1);

  const [selectedExpenseId, setSelectedExpenseId] = useState<string>("");

  const {
    data: expenses,
    refetch: refetchExpenses,
    isLoading: expensesIsLoading,
    isRefetching: expensesIsRefetching,
  } = api.group.getAllExpenses.useQuery(
    { groupId: groupId },
    { refetchOnWindowFocus: false }
  );

  const {
    data: balances,
    isLoading: balancesIsLoading,
    refetch: refetchBalances,
    isRefetching: balancesIsRefetching,
  } = api.group.getGroupBalances.useQuery(
    { groupId: groupId },
    { refetchOnWindowFocus: false }
  );

  const expenseCreator = api.expense.create.useMutation({
    onSuccess() {
      void refetchExpenses();
      void refetchBalances();
    },
  });

  const expenseDeletor = api.expense.delete.useMutation({
    onSuccess() {
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
          members={members}
          isOpen={showAddExpenseModal}
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
        {showExpenseDetailsModel && (
          <ExpenseDetailsModal
            expenseId={selectedExpenseId}
            onCancel={() => {
              setShowExpenseDetailsModal(false);
              setSelectedMemberIndex(-1);
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
        {showMemberRepaymentDetailsModal && (
          <RepaymentDetailsModal
            groupId={groupId}
            onClose={() => {
              setShowMemberRepaymentDetailsModal(false);
            }}
            //not change of naming convention. from "member" to "user"
            user={members[selectedMemberIndex]!}
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
                {/* <li>Friends</li>
                <ul className="ml-1 text-lg">
                  <li>- Alpha</li>
                  <li>- Beta</li>
                </ul> */}
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
                          <div className="">
                            ${expense.totalExpense.toFixed(2)}
                          </div>
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
                    const owes: boolean = balance.balance > 0;
                    // const style = owes ? "text-error italic " : "text-success italic ";
                    return (
                      <li
                        key={idx}
                        className="border-b-[1px] border-[#272d35] pb-2 hover:cursor-pointer"
                        onClick={() => {
                          //This weird stuff is being done beacuse of the unoptimal data fetching described above.
                          const idxInMembersArray = members.findIndex(
                            (m) => m.id === balance.user.id
                          );
                          setSelectedMemberIndex(idxInMembersArray);
                          setShowMemberRepaymentDetailsModal(true);
                        }}
                      >
                        <div className="text-left">
                          <div className="text-lg font-bold">
                            {balance.user.name}
                          </div>
                          <div className="text-base italic">
                            {owes ? "owes " : "gets back "}{" "}
                            {Math.abs(balance.balance).toFixed(2)}
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

type Group = {
  name: string;
  id: string;
};

type Member = {
  id: string;
  name: string | null;
};

export default dashboard;
