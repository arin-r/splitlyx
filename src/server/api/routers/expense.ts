import { ExpenseContribution} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { areFloatsEqual } from "~/lib/floatComparison";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { prisma } from "~/server/db";

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
            //if any expenseContributions.userId is invalid, operation fails
            //I don't like these kind of array.map statements. Seems very inefficient
            create: input.expenseContributions.map((ec) => ({
              actualShare: ec.actualShare,
              groupId: input.groupId,
              paid: ec.paid,
              userId: ec.userId,
            })),
          },
          totalExpense: input.totalExpense,
          name: input.expenseName,
        },
      });

      // let group = await prisma.group.findUnique({
      //   where: {
      //     id: input.groupId,
      //   },
      //   select: {
      //     netExpenseContributions: {
      //       select: {
      //         id: true,
      //         actualShare: true,
      //         expenseId: true,
      //         paid: true,
      //         groupId: true,
      //         userId: true,
      //       },
      //     },
      //   },
      // });

      // console.log(
      //   "group.netExpenseContributions",
      //   group?.netExpenseContributions
      // );
      // console.log("group.netExpenseContributions = ", group?.netExpenseContributions);
      // if (!group) {
      //   throw new Error("Impossible Case");
      // }
      // for (const expContri of input.expenseContributions) {
      //   const index = group?.netExpenseContributions.findIndex(
      //     (netExpContri) => netExpContri.userId === expContri.userId
      //   );
      //   if (index === -1) {
      //     group.netExpenseContributions.push({
      //       userId: expContri.userId,
      //       expenseId: expenseCreationResponse.id,
      //       actualShare: expContri.actualShare,
      //       groupId: input.groupId,
      //       id: "PLACEHOLDER",
      //       paid: expContri.paid,
      //     });
      //   } else {
      //     //TODO workaround for these "!" to handle the undefined case
      //     group.netExpenseContributions[index] = {
      //       ...group.netExpenseContributions[index]!,
      //       paid: group.netExpenseContributions[index]?.paid! + expContri.paid,
      //       actualShare:
      //         group.netExpenseContributions[index]?.actualShare! +
      //         expContri.actualShare,
      //     };
      //   }
      // }

      // await ctx.prisma.group.update({
      //   where: {
      //     id: input.groupId,
      //   },
      //   data: {
      //     netExpenseContributions: {
      //       create: group.netExpenseContributions.map((netExpContri) => ({
      //         actualShare: netExpContri.actualShare,
      //         expenseId: netExpContri.expenseId,
      //         paid: netExpContri.paid,
      //         userId: netExpContri.userId,
      //       })),
      //     },
      //   },
      // });
      //TODO: Change to deleteMany
      // await prisma.expenseContribution.deleteMany({
      //   where: {
      //     id: {
      //       in: group.netExpenseContributions.map(
      //         (netExpContri) => netExpContri.id
      //       ),
      //     },
      //   },
      // });

      /**
       * Transaction Calculation Below
       */
      /** 
      console.log("here");
      let k = 0;
      let transactions: {
        payerId: string;
        receiverId: string;
        transactionAmount: number;
      }[] = [];
      const n = group.netExpenseContributions.length;
      for (let i = 0; i < n; ++i) {
        const contri = group.netExpenseContributions[i]!;
        let mustGet = contri.paid - contri.actualShare;
        if (mustGet > 0) {
          while (k < n) {
            console.log("while");
            const at = group.netExpenseContributions[k]!;
            const canGive = at.actualShare - at.paid;
            if (canGive > 0) {
              if (mustGet === canGive) {
                transactions.push({
                  payerId: at.userId,
                  receiverId: contri.userId,
                  transactionAmount: canGive,
                });
                group.netExpenseContributions[k]!.paid += canGive;
                break;
              } else if (mustGet > canGive) {
                transactions.push({
                  payerId: at.userId,
                  receiverId: contri.userId,
                  transactionAmount: canGive,
                });
                group.netExpenseContributions[k]!.paid += canGive;
                mustGet -= canGive;
                k++;
              } else {
                transactions.push({
                  payerId: at.userId,
                  receiverId: contri.userId,
                  transactionAmount: canGive,
                });
                group.netExpenseContributions[k]!.paid += mustGet;
                break;
              }
            } else {
              k++;
            }
          }
        }
      }

      console.log("here 2");
      // await prisma.transaction.deleteMany({
      //   where: {
      //     groupId: input.groupId,
      //   },
      // });

      await prisma.group.update({
        where: {
          id: input.groupId,
        },
        data: {
          transaction: {
            create: transactions,
          },
        },
      });

      console.log("ExpenseCreationResponse = ", expenseCreationResponse);
      */
    }),
});
