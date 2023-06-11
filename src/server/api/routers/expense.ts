import { ExpenseContribution, Transaction } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { group } from "console";
import { z } from "zod";
import calculateTransactions from "~/lib/calculateTransactions";
import { areFloatsEqual } from "~/lib/floatComparison";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
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
      const totalPaid = input.expenseContributions.reduce((accumulator, ec) => accumulator + ec.paid, 0);
      const totalActualShare = input.expenseContributions.reduce((accumulator, ec) => accumulator + ec.actualShare, 0);
      if (!(areFloatsEqual(totalPaid, totalActualShare) && areFloatsEqual(totalPaid, input.totalExpense))) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "The total amount paid should equal the total value of actualShares which should also be equal to totalExpense. One or many of these conditions have failed.",
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
        const index = groupContributions.findIndex((grpContri) => grpContri.userId === expContri.userId);
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
            actualShare: groupContributions[index]?.actualShare! + expContri.actualShare,
            paid: groupContributions[index]?.paid! + expContri.paid,
          };
        }
      }

      await prisma.groupContribution.createMany({
        data: groupContributions,
      });

      //groupContributions is modified in the calculationTransactions(). As of now, using structuredClone
      //does not make a difference, however it is the emphasize that groupContributions is modified in the function.
      const transactions = calculateTransactions(structuredClone(groupContributions), input.groupId);
      await prisma.transaction.deleteMany({
        where: {
          groupId: input.groupId,
        },
      });

      await prisma.transaction.createMany({
        data: transactions,
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
              user: { select: { name: true, id: true }, },
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
