import { FC, ReactNode, useState } from "react";
import useGroupStore from "~/store/useGroupStore";
import { api } from "~/utils/api";

interface AddTransactionModalProps {
  payerId: string;
  receiverId: string;
  defaultAmount: number;
  onCancel: () => void;
  // onSubmitCallback: () => void;
  onTransactionCreationSuccess: () => void;
}

const AddTransactionModal: FC<AddTransactionModalProps> = ({
  payerId,
  receiverId,
  defaultAmount,
  onCancel,
  // onSubmitCallback,
  onTransactionCreationSuccess,
}) => {
  const [amount, setAmount] = useState<number>(defaultAmount);

  const transactionCreator = api.group.addTransaction.useMutation({
    onSuccess() {
      onTransactionCreationSuccess();
    },
  });

  const groupId = useGroupStore((state) => state.groupId);
  const members = useGroupStore((state) => state.members);
  const payerIndex = members.findIndex((m) => m.id === payerId);
  const payerName = members[payerIndex]?.name!;
  const receiverIndex = members.findIndex((m) => m.id === receiverId);
  const receiverName = members[receiverIndex]?.name!;
  return (
    <BaseLayout>
      <h1 className="text-2xl font-bold">Record a transaction</h1>
      <h2 className="my-3 text-xl">Confirm the following transaction</h2>
      <div className="mb-6 mt-2 flex items-center">
        <label className="mr-2">
          <span className="badge badge-neutral p-3">{payerName}</span> paid{" "}
          <span className="badge badge-neutral p-3">{receiverName}</span>
        </label>
        <input
          onWheel={(e) => e.currentTarget.blur()}
          type="number"
          value={amount.toString()}
          onChange={(event) => {
            if (!event.target.value || event.target.value.length === 0) {
              setAmount(0);
            } else {
              setAmount(parseFloat(parseFloat(event.target.value).toFixed(2)));
            }
          }}
          className="input-group-sm input-primary input ml-auto"
        />
      </div>

      <div className="flex justify-end">
        <button
          className="btn-primary btn-sm btn mr-3"
          onClick={() => {
            transactionCreator.mutate({
              groupId: groupId,
              payerId: payerId,
              receiverId: receiverId,
              transactionAmount: amount,
            });
          }}
        >
          Confirm Transaction
        </button>
        <button
          className="btn-primary btn-outline btn-sm btn"
          onClick={onCancel}
        >
          Cancel
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

export default AddTransactionModal;
