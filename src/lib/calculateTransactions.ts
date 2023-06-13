const calculateTransactions = (
  groupContributions: {
    userId: string;
    groupId: string;
    paid: number;
    actualShare: number;
  }[],
  groupId: string
) => {
  let transactions: {
    payerId: string;
    receiverId: string;
    transactionAmount: number;
    groupId: string;
  }[] = [];

  let k = 0;
  const N = groupContributions.length;
  for (let i = 0; i < N; ++i) {
    // why does typescript think this is undefined ?
    const grpContri = groupContributions[i]!;
    let mustGet = grpContri.paid - grpContri.actualShare;
    if (mustGet > 0) {
      while (k < N) {
        const at = groupContributions[k]!;
        const canGive = at.actualShare - at.paid;
        if (canGive > 0) {
          if (mustGet === canGive) {
            transactions.push({
              groupId: groupId,
              payerId: at.userId,
              receiverId: grpContri.userId,
              transactionAmount: canGive,
            });
            groupContributions[k]!.paid += canGive;
            break;
          } else if (mustGet > canGive) {
            transactions.push({
              groupId: groupId,
              payerId: at.userId,
              receiverId: grpContri.userId,
              transactionAmount: canGive,
            });
            groupContributions[k]!.paid += canGive;
            mustGet -= canGive;
            k++;
          } else {
            transactions.push({
              groupId: groupId,
              payerId: at.userId,
              receiverId: grpContri.userId,
              transactionAmount: mustGet,
            });
            groupContributions[k]!.paid += mustGet;
            break;
          }
        } else {
          k++;
        }
      }
    }
  }

  return transactions;
};

export default calculateTransactions;
