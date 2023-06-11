import { ExpenseContribution, Transaction } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { areFloatsEqual } from "~/lib/floatComparison";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { prisma } from "~/server/db";

export const transactionRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ ctx, input }) => {
      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          groupId: input.groupId
        }
      })
      console.log("transactions = ", transactions)
      return transactions
    }),
});
