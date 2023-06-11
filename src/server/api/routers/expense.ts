import { ExpenseContribution, Transaction } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { group } from "console";
import { z } from "zod";
import { areFloatsEqual } from "~/lib/floatComparison";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { prisma } from "~/server/db";

const getGroupConrtibutions = () => {};
export const expenseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        expenseName: z.string(),
        expenseContributions: z
          .object({
            userId: z.string(),
            paid: z.number(),
            actualShare: z.number(),
          })
          .array(),
        totalExpense: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const totalPaid = input.expenseContributions.reduce(
        (accumulator, ec) => accumulator + ec.paid,
        0
      );
      const totalActualShare = input.expenseContributions.reduce(
        (accumulator, ec) => accumulator + ec.actualShare,
        0
      );
      if (
        !(
          areFloatsEqual(totalPaid, totalActualShare) &&
          areFloatsEqual(totalPaid, input.totalExpense)
        )
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "The total amount paid should equal the total value of actualShares which should also be equal to totalExpense. One or many of these conditions have failed.",
        });
      }
      const expenseCreationResponse = await ctx.prisma.expense.create({
        data: {
          groupId: input.groupId,
          expenseContributions: {
            // if any expenseContributions.userId is invalid, operation fails
            create: input.expenseContributions,
          },
          totalExpense: input.totalExpense,
          name: input.expenseName,
        },
      });

      let groupContributions = await prisma.groupContribution.findMany({
        where: {
          groupId: input.groupId,
        },
        select: {
          actualShare: true,
          groupId: true,
          paid: true,
          userId: true,
        },
      });
      await prisma.groupContribution.deleteMany({
        where: {
          groupId: input.groupId,
        },
      });

      for (const expContri of input.expenseContributions) {
        const index = groupContributions.findIndex(
          (grpContri) => grpContri.userId === expContri.userId
        );
        if (index === -1) {
          groupContributions.push({
            actualShare: expContri.actualShare,
            groupId: input.groupId,
            paid: expContri.paid,
            userId: expContri.userId,
          });
        } else {
          groupContributions[index] = {
            ...groupContributions[index]!,
            actualShare:
              groupContributions[index]?.actualShare! + expContri.actualShare,
            paid: groupContributions[index]?.paid! + expContri.paid,
          };
        }
      }

      await prisma.groupContribution.createMany({
        data: groupContributions,
      });

      console.log("groupContributions = ", groupContributions);
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
                  groupId: input.groupId,
                  payerId: at.userId,
                  receiverId: grpContri.userId,
                  transactionAmount: canGive,
                });
                groupContributions[k]!.paid += canGive;
                break;
              } else if (mustGet > canGive) {
                transactions.push({
                  groupId: input.groupId,
                  payerId: at.userId,
                  receiverId: grpContri.userId,
                  transactionAmount: canGive,
                });
                groupContributions[k]!.paid += canGive;
                mustGet -= canGive;
                k++;
              } else {
                transactions.push({
                  groupId: input.groupId,
                  payerId: at.userId,
                  receiverId: grpContri.userId,
                  transactionAmount: mustGet,
                });
                groupContributions[k]!.paid += mustGet;
                break;
              }
            } else {
              k ++;
            }
          }
        }
      }

      await prisma.transaction.deleteMany({
        where: {
          groupId: input.groupId,
        }
      })
      await prisma.transaction.createMany({
        data: transactions
      })
      
      // console.log("here");
      // let k = 0;
      // let transactions: {
      //   payerId: string;
      //   receiverId: string;
      //   transactionAmount: number;
      // }[] = [];
      // const n = group.netExpenseContributions.length;
      // for (let i = 0; i < n; ++i) {
      //   const contri = group.netExpenseContributions[i]!;
      //   let mustGet = contri.paid - contri.actualShare;
      //   if (mustGet > 0) {
      //     while (k < n) {
      //       console.log("while");
      //       const at = group.netExpenseContributions[k]!;
      //       const canGive = at.actualShare - at.paid;
      //       if (canGive > 0) {
      //         if (mustGet === canGive) {
      //           transactions.push({
      //             payerId: at.userId,
      //             receiverId: contri.userId,
      //             transactionAmount: canGive,
      //           });
      //           group.netExpenseContributions[k]!.paid += canGive;
      //           break;
      //         } else if (mustGet > canGive) {
      //           transactions.push({
      //             payerId: at.userId,
      //             receiverId: contri.userId,
      //             transactionAmount: canGive,
      //           });
      //           group.netExpenseContributions[k]!.paid += canGive;
      //           mustGet -= canGive;
      //           k++;
      //         } else {
      //           transactions.push({
      //             payerId: at.userId,
      //             receiverId: contri.userId,
      //             transactionAmount: canGive,
      //           });
      //           group.netExpenseContributions[k]!.paid += mustGet;
      //           break;
      //         }
      //       } else {
      //         k++;
      //       }
      //     }
      //   }
      // }

      // console.log("here 2");
      // // await prisma.transaction.deleteMany({
      // //   where: {
      // //     groupId: input.groupId,
      // //   },
      // // });

      // await prisma.group.update({
      //   where: {
      //     id: input.groupId,
      //   },
      //   data: {
      //     transaction: {
      //       create: transactions,
      //     },
      //   },
      // });

      // console.log("ExpenseCreationResponse = ", expenseCreationResponse);
    }),
});
