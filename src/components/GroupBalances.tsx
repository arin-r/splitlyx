import { FC, useState } from "react";
import RepaymentDetailsModal from "./modals/RepaymentDetailsModal";
import useGroupStore from "~/store/useGroupStore";

interface GroupBalancesProps {
  balances:
    | {
        user: {
          id: string;
          name: string;
        };
        balance: number;
      }[]
    | undefined;
  balancesIsLoading: boolean;
  balancesIsRefetching: boolean;
  updateBalances: () => void;
  updateTransactions: () => void;
  members: Member[];
}

const GroupBalances: FC<GroupBalancesProps> = ({
  balances,
  balancesIsLoading,
  balancesIsRefetching,
  updateBalances,
  updateTransactions,
  //encountered an error if I used useGroupStore(state => state.members);
  //hence I had to pass it as a prop
  members,
}) => {
  const [showMemberRepaymentDetailsModal, setShowMemberRepaymentDetailsModal] =
    useState<boolean>(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(-1);

  return (
    <>
      {showMemberRepaymentDetailsModal && (
        <RepaymentDetailsModal
          onClose={() => {
            setShowMemberRepaymentDetailsModal(false);
            setSelectedMemberIndex(-1);
          }}
          //not change of naming convention. from "member" to "user"
          user={members[selectedMemberIndex]!}
          updateBalances={updateBalances}
          updateTransactions={updateTransactions}
          // setShowMemberRepaymentDetailsModal={setShowMemberRepaymentDetailsModal}
        />
      )}
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
                    //This weird stuff is being done beacuse of the unoptimal data fetching described at the top of this component
                    const idxInMembersArray = members.findIndex(
                      (m) => m.id === balance.user.id
                    );
                    setSelectedMemberIndex(idxInMembersArray);
                    setShowMemberRepaymentDetailsModal(true);
                  }}
                >
                  <div className="py-3 text-left">
                    <div className="text-lg font-bold">{balance.user.name}</div>
                    <div className="text-base italic">
                      {`${owes ? "owes " : "gets back "} ${Math.abs(
                        balance.balance
                      ).toFixed(2)}`}
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
      </div>
    </>
  );
};

type Member = {
  id: string;
  name: string | null;
};

export default GroupBalances;
