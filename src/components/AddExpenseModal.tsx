import React, { FC, ReactNode, useRef, useState } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  participants: { id: string; name: string | null }[];
  handleExpenseCreation: (expenseName: string, expenseContributions: {userId: string, paid: number, actualShare: number}[], totalExpense: number) => void;
  onCancel: () => void;
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

const NameAndTotal = () => {
  return <></>;
};

const ShareModeDropDown = ({
  onModeClick,
  sharedEqually,
}: {
  onModeClick: () => void;
  sharedEqually: boolean;
}) => {
  const dropDownDivRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={dropDownDivRef} className="dropdown">
      <label tabIndex={0} className="btn-sm btn m-1">
        {sharedEqually ? "Equally" : "Unequally"}
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow"
      >
        <li>
          <a onClick={onModeClick}>Equally</a>
        </li>
        <li>
          <a onClick={onModeClick}>Unequally</a>
        </li>
      </ul>
    </div>
  );
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  handleExpenseCreation,
  onCancel,
  participants,
}) => {
  if (!isOpen) {
    return null;
  }
  const [sharedEqually, setSharedEqually] = useState<boolean>(true);
  const [expenseContributions, setExpenseContributions] = useState<
    { userId: string; paid: number; actualShare: number }[]
  >(
    participants.map((participant) => ({
      userId: participant.id,
      paid: 0.0,
      actualShare: 0.0,
    }))
  );
  const [expenseName, setExpenseName] = useState<string>("Expense Name");
  const [totalExpense, setTotalExpense] = useState<number>(0);
  console.log("1 expenseContributions = ", expenseContributions);
  return (
    <BaseLayout>
      <h2 className="mb-4 text-xl font-bold">Configure the expense</h2>
      <div className="mb-5 mt-5">
        <label htmlFor="expenseName" className="mb-2 block text-lg font-medium">
          Expense Name
        </label>
        <input
          type="text"
          value={expenseName}
          onChange={(event) => {
            setExpenseName(event.target.value);
          }}
          className="input-bordered input-primary input w-full"
        />
      </div>
      <div className="mb-5 mt-5">
        <label htmlFor="expenseName" className="mb-2 block text-lg font-medium">
          Total Expense
        </label>
        <input
          onWheel={(e) => e.currentTarget.blur()}
          type="number"
          value={totalExpense.toString()}
          onChange={(event) => {
            setTotalExpense(
              parseFloat(parseFloat(event.target.value).toFixed(2))
            );
          }}
          className="input-bordered input-primary input w-full"
        />
      </div>
      <div className="text-lg">
        <p className="font-bold">Amount paid by: </p>
        {participants.map((participant) => {
          const index = expenseContributions.findIndex(
            (expenseContribution) =>
              expenseContribution.userId === participant.id
          );
          return (
            <div key={participant.id} className="my-2 flex items-center">
              <label htmlFor={`${participant.id}-amt-paid`} className="mr-2">
                {participant.name}
              </label>
              <input
                onWheel={(e) => e.currentTarget.blur()}
                type="number"
                value={expenseContributions[index]!.paid.toString()}
                onChange={(event) => {
                  console.log("value = ", event.target.value);
                  setExpenseContributions((prevExpenseContributions) => {
                    const t1 = [...prevExpenseContributions];
                    const t2 = t1[index];
                    if (!t2) {
                      throw new Error("Impossible Case");
                    }
                    if (
                      !event.target.value ||
                      event.target.value.length === 0
                    ) {
                      t1[index] = {
                        paid: 0,
                        actualShare: t2.actualShare,
                        userId: t2.userId,
                      };
                    } else {
                      t1[index] = {
                        paid: parseFloat(
                          parseFloat(event.target.value).toFixed(2)
                        ),
                        actualShare: t2.actualShare,
                        userId: t2.userId,
                      };
                    }
                    return t1;
                  });
                }}
                id={`${participant.id}-amt-paid`}
                className="input-group-sm input-primary input ml-auto"
              />
            </div>
          );
        })}
        and shared
        <ShareModeDropDown
          onModeClick={() => {
            setSharedEqually((prev) => !prev);
            const elem = document.activeElement as any;
            if (elem) {
              elem.blur();
            }
          }}
          sharedEqually={sharedEqually}
        />
        {!sharedEqually && (
          <>
            <h2 className="text-lg font-bold">
              Enter the actual share of each participant
            </h2>
            {participants.map((participant) => {
              const index = expenseContributions.findIndex(
                (expenseContribution) =>
                  expenseContribution.userId === participant.id
              );
              return (
                <div key={participant.id} className="my-2 flex items-center">
                  <label
                    htmlFor={`${participant.id}-amt-paid`}
                    className="mr-2"
                  >
                    {participant.name}
                  </label>
                  <input
                    onWheel={(e) => e.currentTarget.blur()}
                    type="number"
                    value={expenseContributions[index]!.actualShare.toString()}
                    onChange={(event) => {
                      console.log("value = ", event.target.value);
                      setExpenseContributions((prevExpenseContributions) => {
                        const t1 = [...prevExpenseContributions];
                        const t2 = t1[index];
                        if (!t2) {
                          throw new Error("Impossible Case");
                        }
                        if (
                          !event.target.value ||
                          event.target.value.length === 0
                        ) {
                          t1[index] = {
                            paid: t2.paid,
                            actualShare: 0,
                            userId: t2.userId,
                          };
                        } else {
                          t1[index] = {
                            paid: t2.paid,
                            actualShare: parseFloat(
                              parseFloat(event.target.value).toFixed(2)
                            ),
                            userId: t2.userId,
                          };
                        }
                        return t1;
                      });
                    }}
                    id={`${participant.id}-amt-paid`}
                    className="input-group-sm input-primary input ml-auto"
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
      <div className="flex justify-end">
        <button className="btn-primary btn-sm btn mr-3" onClick={() => {
          handleExpenseCreation(expenseName, expenseContributions, totalExpense);
        }}>
          Confirm
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

export default ConfirmationModal;
