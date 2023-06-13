import { FC, useState } from "react";
import { api } from "~/utils/api";

interface homeProps {}

const Comp: FC<{ expenseId: string }> = ({ expenseId }) => {
  const { data: expense, isLoading: expenseIsLoading } =
    api.expense.get.useQuery(
      { expenseId: expenseId },
      { refetchOnWindowFocus: false }
    );
  return (
    <div>
      Welcome
      <div>{expense?.name}</div>
    </div>
  );
};
const home: FC<homeProps> = ({}) => {
  const [show, setShow] = useState<boolean>(false);
  return (
    <div>
      <button
        className="p-6"
        onClick={() => {
          setShow(!show);
        }}
      >
        Toggle
      </button>
      {show && <Comp expenseId="clira0t3i0014vbdeg7e9l79c" />}
    </div>
  );
};

export default home;
