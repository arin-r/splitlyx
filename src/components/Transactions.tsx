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
      {transactions &&
        transactions.map((t, idx) => {
          const payerIndex = members.findIndex((m) => m.id === t.payerId);
          const payerName = members[payerIndex]?.name!;
          const receiverIndex = members.findIndex((m) => m.id === t.receiverId);
          const receiverName = members[receiverIndex]?.name!;
          return (
            <div key={idx}>
              <p>
                {payerName} paid {receiverName} ${t.transactionAmount}
              </p>
            </div>
          );
        })}
    </div>
  );
};

export default Transactions;
