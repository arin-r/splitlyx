import { FC, ReactNode, useState } from "react";
import { api } from "~/utils/api";
import AddTransactionModal from "./AddTransactionModal";
import useGroupStore from "~/store/useGroupStore";

interface RepaymentDetailsModalProps {
  user: { id: string; name: string | null };
  onClose: () => void;
  updateBalances: () => void;
  updateTransactions: () => void;
}

const RepaymentDetailsModal: FC<RepaymentDetailsModalProps> = ({
  user,
  onClose,
  updateBalances,
  updateTransactions,
}) => {
  const groupId = useGroupStore((state) => state.groupId);
  const {
    data: repaymentData,
    isLoading: repaymentIsLoading,
    refetch: refetchRepayment,
  } = api.repayment.getSuggested.useQuery(
    {
      groupId: groupId,
      userId: user.id,
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const [showAddTransactionModal, setShowAddTrasactionModal] =
    useState<boolean>(false);
  const [transactionData, setTransactionData] = useState<null | {
    receiverId: string;
    payerName: string | null;
    payerId: string;
    receiverName: string | null;
    amount: number;
  }>(null);
  if (repaymentIsLoading) {
    return (
      <BaseLayout>
        <div className="mb-4 mt-4 flex items-center justify-center">
          <progress className="progress w-56"></progress>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      {showAddTransactionModal && transactionData !== null && (
        <AddTransactionModal
          defaultAmount={transactionData.amount}
          onCancel={() => {
            setShowAddTrasactionModal(false);
            setTransactionData(null);
          }}
          payerId={transactionData.payerId}
          receiverId={transactionData.receiverId}
          onTransactionCreationSuccess={() => {
            setShowAddTrasactionModal(false);
            void updateBalances();
            void updateTransactions();
            void refetchRepayment();
          }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <h2 className="mt-4 text-xl uppercase">Suggested Repayments:</h2>
        {repaymentData && (
          <ul className="px-4">
            {repaymentData.map((rp, idx) => {
              return (
                <li key={idx} className="my-6 list-disc text-lg">
                  <div className="flex justify-between">
                    <div>
                      {`${rp.payer.name} owes $${rp.repaymentAmount} to ${rp.receiver.name}`}
                    </div>
                    <div>
                      <button
                        className="btn-primary btn-sm btn"
                        onClick={() => {
                          setTransactionData({
                            amount: rp.repaymentAmount,
                            payerId: rp.payer.id,
                            receiverId: rp.receiver.id,
                            payerName: rp.payer.name,
                            receiverName: rp.receiver.name,
                          });
                          setShowAddTrasactionModal(true);
                        }}
                      >
                        Settle
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="flex justify-end">
        <button
          className="btn-primary btn-outline btn-sm btn"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </BaseLayout>
  );
};

const BaseLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="fixed inset-0 z-10 flex items-start justify-center">
      <div className="fixed inset-0 bg-neutral opacity-50"></div>
      <div className="mx-auto mt-20">
        <div className="relative max-h-[37rem] w-[40rem] overflow-auto rounded-lg bg-base-100 p-6 shadow-lg">
          <div className="mx-auto w-[35rem]">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default RepaymentDetailsModal;
