import { FC, ReactNode } from "react";
import { api } from "~/utils/api";

interface ExpenseDetailsModalProps {
  expenseId: string;
  onCancel: () => void;
  onDelete: () => void;
}

const BaseLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center">
      <div className="fixed inset-0 bg-neutral opacity-50"></div>
      <div className="mx-auto">
        <div className="relative max-h-[37rem] w-[30rem] overflow-auto rounded-lg bg-base-100 p-6 shadow-lg">
          <div className="mx-auto w-[24rem]">{children}</div>
        </div>
      </div>
    </div>
  );
};

const ExpenseDetailsModal: FC<ExpenseDetailsModalProps> = ({ onCancel, expenseId, onDelete}) => {
  const { data: expense, isLoading: expenseIsLoading } = api.expense.get.useQuery(
    { expenseId: expenseId },
    { refetchOnWindowFocus: false }
  );
  return (
    <BaseLayout>
      {expenseIsLoading && (
        <div className="mb-4 mt-4 flex items-center justify-center">
          <progress className="progress w-56"></progress>
        </div>
      )}
      {expense && (
        <div>
          <h2 className="mb-4 text-xl font-bold">{expense.name}</h2>
          <div className="container mx-auto">
            <table className="min-w-full divide-y divide-neutral ">
              <thead className="">
                <tr>
                  <th className="w-2/6 px-6 py-3 text-left">User</th>
                  <th className="w-1/6 px-6 py-3 text-left">Paid</th>
                  <th className="w-1/6 px-6 py-3 text-left">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral">
                {expense.expenseContributions.map((expContri, index) => {
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4">{expContri.user.name}</td>
                      <td className="px-6 py-4">{expContri.paid}</td>
                      <td className="px-6 py-4">{expContri.actualShare}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="divider"></div>
          <div className="container mx-auto mt-7 mb-4">
            <div className="flex items-center justify-between ">
              <p className="text-lg font-bold">Total Expense</p>
              <p className="text-lg font-bold">{expense.totalExpense}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary btn-sm btn mr-3"
            onClick={() => {
              //Is this the right way to do it?
              //or onClick={onDelete}
              onDelete();
            }}>Delete</button>
            <button className="btn-primary btn-outline btn-sm btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </BaseLayout>
  );
};

export default ExpenseDetailsModal;
