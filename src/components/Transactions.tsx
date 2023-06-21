import { FC } from "react";
import useGroupStore from "~/store/useGroupStore";

interface TransactionsProps {
  transactions:
    | {
        payerId: string;
        receiverId: string;
        transactionAmount: number;
      }[]
    | undefined;

  transactionsIsLoading: boolean;
  transactionsIsRefetching: boolean;
}

const Transactions: FC<TransactionsProps> = ({
  transactions,
  transactionsIsLoading,
  transactionsIsRefetching,
}) => {
  const groupId = useGroupStore((state) => state.groupId);
  const members = useGroupStore((state) => state.members);

  return (
    <div>
      {(!transactions || transactionsIsLoading || transactionsIsRefetching) && (
        <div className="mb-4 mt-4 flex items-center justify-center">
          <progress className="progress w-56"></progress>
        </div>
      )}
      {transactions && (
        <ul className="mx-2">
          {transactions.map((t, idx) => {
            const payerIndex = members.findIndex((m) => m.id === t.payerId);
            const payerName = members[payerIndex]?.name;
            const receiverIndex = members.findIndex(
              (m) => m.id === t.receiverId
            );
            const receiverName = members[receiverIndex]?.name;
            if (!payerName || !receiverName) {
              throw new Error(
                "Unexpected condition. Every element of members array is expected to have an id and name field"
              );
            }
            return (
              <li key={idx} className="mb-2 hover:cursor-pointer">
                <div className="rounded-md bg-neutral-focus p-4 shadow-md">
                  <div className="flex justify-between">
                    <p>
                      <span className="font-bold">{payerName}</span>
                      <span> paid </span>
                      <span className="font-bold">{receiverName}</span>
                    </p>
                    <p className="font-bold">${t.transactionAmount}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Transactions;
