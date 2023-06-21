import { FC, useState } from "react";
import { api } from "~/utils/api";
import ExpenseDetailsModal from "./modals/ExpenseDetailsModal";

interface ExpensesProps {
  groupId: string;
  updateStuff: () => void;
  expenses:
    | {
        id: string;
        name: string;
        totalExpense: number;
      }[]
    | undefined;
  isLoading: boolean;
}

const Expenses: FC<ExpensesProps> = ({
  groupId,
  updateStuff,
  expenses,
  isLoading,
}) => {
  const expenseDeletor = api.expense.delete.useMutation({
    onSuccess() {
      updateStuff();
    },
  });

  isLoading = isLoading || expenseDeletor.isLoading;
  const [showExpenseDetailsModel, setShowExpenseDetailsModal] =
    useState<boolean>(false);

  const [selectedExpenseId, setSelectedExpenseId] = useState<string>("");
  return (
    <>
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
      {isLoading && (
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
    </>
  );
};

export default Expenses;
