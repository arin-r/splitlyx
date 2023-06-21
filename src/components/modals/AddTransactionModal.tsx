import { FC, ReactNode, useState } from "react";
import useGroupStore from "~/store/useGroupStore";
import { api } from "~/utils/api";

interface AddTransactionModalProps {
  initialPayerId: string;
  initialReceiverId: string;
  defaultAmount: number;
  onCancel: () => void;
  // onSubmitCallback: () => void;
  onTransactionCreationSuccess: () => void;
}

const AddTransactionModal: FC<AddTransactionModalProps> = ({
  initialPayerId,
  initialReceiverId,
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

  const [payerId, setPayerId] = useState<string>(initialPayerId);
  const [receiverId, setReceiverId] = useState<string>(initialReceiverId);

  const payerIndex = members.findIndex((m) => m.id === payerId);
  const payerName = members[payerIndex]?.name;
  const receiverIndex = members.findIndex((m) => m.id === receiverId);
  const receiverName = members[receiverIndex]?.name;

  if (!payerName || !receiverName) {
    throw new Error(
      "Unexpected condition. Every element of members array is expected to have an id and name field"
    );
  }
  return (
    <BaseLayout>
      {/* <div className="flex flex-col"> */}
      <div>
        <h1 className="text-2xl font-bold">Record a transaction</h1>
        <h2 className="my-3 text-xl">Confirm the following transaction</h2>
        <div className="mb-6 mt-2 flex items-center text-lg">
          <label className="mr-2">
            {/* <span className="badge badge-neutral p-3">{payerName}</span> paid{" "} */}
            <span>
              <div className="dropdown-bottom dropdown">
                <label
                  tabIndex={0}
                  className="badge badge-neutral p-3 text-lg hover:cursor-pointer"
                >
                  {payerName}
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow"
                >
                  {members.map((m, idx) => {
                    return (
                      <li
                        key={idx}
                        className="my-1 hover:cursor-pointer"
                        onClick={() => {
                          const elem =
                            document.activeElement as HTMLLabelElement;
                          if (elem) {
                            elem.blur();
                          }
                          setPayerId(m.id);
                        }}
                      >
                        {m.name}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </span>
            {" paid "}
            <span>
              <div className="dropdown-bottom dropdown">
                <label
                  tabIndex={0}
                  className="badge badge-neutral p-3 text-lg hover:cursor-pointer"
                >
                  {receiverName}
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow"
                >
                  {members.map((m, idx) => {
                    return (
                      <li
                        key={idx}
                        className="my-1 hover:cursor-pointer"
                        onClick={() => {
                          const elem =
                            document.activeElement as HTMLLabelElement;
                          if (elem) {
                            elem.blur();
                          }
                          setReceiverId(m.id);
                        }}
                      >
                        {m.name}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </span>
          </label>
          <input
            onWheel={(e) => e.currentTarget.blur()}
            type="number"
            value={amount.toString()}
            onChange={(event) => {
              if (!event.target.value || event.target.value.length === 0) {
                setAmount(0);
              } else {
                setAmount(
                  parseFloat(parseFloat(event.target.value).toFixed(2))
                );
              }
            }}
            className="input-group-sm input-primary input ml-auto"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className={`btn-primary btn-sm btn mr-3 ${
            transactionCreator.isLoading ? "loading loading-spinner" : ""
          }`}
          onClick={() => {
            transactionCreator.mutate({
              groupId: groupId,
              payerId: payerId,
              receiverId: receiverId,
              transactionAmount: amount,
            });
          }}
          disabled={transactionCreator.isLoading}
        >
          {transactionCreator.isLoading && (
            <span className="loading loading-spinner"></span>
          )}
          Confirm Transaction
        </button>
        <button
          className="btn-primary btn-outline btn-sm btn"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>

      {/* </div> */}
    </BaseLayout>
  );
};
const BaseLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="fixed inset-0 z-10 flex items-start justify-center">
      <div className="fixed inset-0 bg-neutral opacity-50"></div>
      <div className="mx-auto mt-20">
        <div className="relative max-h-[37rem] min-h-[15rem] w-[40rem] overflow-auto rounded-lg bg-base-100 p-6 shadow-lg">
          <div className=" mx-auto flex min-h-[13rem] w-[35rem] flex-col justify-between">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
