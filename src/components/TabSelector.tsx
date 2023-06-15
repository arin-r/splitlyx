import { FC } from "react";

interface TabSelectorProps {
  handleTabClick: (tab: string) => void;
  activeTab: string;
}

const TabSelector: FC<TabSelectorProps> = ({ activeTab, handleTabClick }) => {
  return (
    <div className="mx-2 mb-4 flex items-center justify-around">
      <div
        className={`flex-1 cursor-pointer rounded-b-md rounded-t-lg py-3 text-center ${
          activeTab === "expenses"
            ? "bg-neutral-focus font-bold"
            : "font-normal"
        }`}
        onClick={() => handleTabClick("expenses")}
      >
        Expenses
      </div>
      <div
        className={`flex-1 cursor-pointer rounded-b-md rounded-t-lg py-3 text-center ${
          activeTab === "transactions"
            ? "bg-neutral-focus font-bold"
            : "font-normal"
        }`}
        onClick={() => handleTabClick("transactions")}
      >
        Transactions
      </div>
    </div>
  );
};

export default TabSelector;
