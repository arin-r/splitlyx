import { TRPCError } from "@trpc/server";
import { z } from "zod";
import calculateTransactions from "~/lib/calculateTransactions";
import { areFloatsEqual } from "~/lib/floatComparison";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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
          code: "UNPROCESSABLE_CONTENT",
          message:
            "The total amount paid should equal the total value of actualShares which should also be equal to totalExpense. One or many of these conditions have failed.",
        });
      }
      if (areFloatsEqual(input.totalExpense, 0.0)) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: "Total Expense should be greater than 0",
        });
      }
      await ctx.prisma.expense.create({
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

      let groupContributions = await ctx.prisma.groupContribution.findMany({
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

      await ctx.prisma.groupContribution.deleteMany({
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

      await ctx.prisma.groupContribution.createMany({
        data: groupContributions,
      });

      //groupContributions is modified in the calculationTransactions(). As of now, using structuredClone
      //does not make a difference, however it is the emphasize that groupContributions is modified in the function.
      const repayments = calculateTransactions(
        structuredClone(groupContributions),
        input.groupId
      );
      await ctx.prisma.repayment.deleteMany({
        where: {
          groupId: input.groupId,
        },
      });

      await ctx.prisma.repayment.createMany({
        data: repayments,
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        expenseId: z.string(),
        /** I don't HAVE to accept this as a parameter, I can easily get this within the function
         * using ctx.prisma.expense.findUnique({where: {id: input.expenseId}, select: {groupId: true}})
         * */
        groupId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      /**
       * 0. Get curExpenseContributions
       * 1. Delete the expense, and its expenseContributions
       * 1. Modify groupContributions
       * 2. Delete existing repayments
       * 3. Recalculate repayments
       * 4. Add new repayments
       *
       * TODO: Build efficient aglorithm to avoid deleteing all repayments & adding them again (step 2 & 4)
       */

      const expenseContributions =
        await ctx.prisma.expenseContribution.findMany({
          where: {
            expenseId: input.expenseId,
          },
          select: {
            paid: true,
            userId: true,
            actualShare: true,
          },
        });

      /**
       * Schema.prisma
       * expense     Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
       * onDelete: Cascade should delete all the expenses.
       */
      await ctx.prisma.expense.delete({
        where: {
          id: input.expenseId,
        },
      });

      const groupContributions = await ctx.prisma.groupContribution.findMany({
        where: {
          groupId: input.groupId,
        },
        select: {
          paid: true,
          actualShare: true,
          userId: true,
          groupId: true,
        },
      });

      await ctx.prisma.groupContribution.deleteMany({
        where: {
          groupId: input.groupId,
        },
      });

      for (const expContri of expenseContributions) {
        const index = groupContributions.findIndex(
          (grpContri) => grpContri.userId === expContri.userId
        );
        if (index === -1) {
          throw new Error(
            "Index of existing user not found in expense.delete. This is impossible."
          );
        }
        const curGrpContri = groupContributions[index]!;
        groupContributions[index] = {
          ...curGrpContri,
          paid: curGrpContri.paid - expContri.paid,
          actualShare: curGrpContri.actualShare - expContri.actualShare,
        };
      }

      await ctx.prisma.groupContribution.createMany({
        data: groupContributions,
      });

      const repayments = calculateTransactions(
        structuredClone(groupContributions),
        input.groupId
      );

      await ctx.prisma.repayment.deleteMany({
        where: {
          groupId: input.groupId,
        },
      });

      await ctx.prisma.repayment.createMany({
        data: repayments,
      });
    }),
  get: protectedProcedure
    .input(
      z.object({
        expenseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.expense.findUnique({
        where: { id: input.expenseId },
        select: {
          expenseContributions: {
            select: {
              user: { select: { name: true, id: true } },
              paid: true,
              actualShare: true,
            },
          },
          totalExpense: true,
          name: true,
        },
      });
    }),
});
