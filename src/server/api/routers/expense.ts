import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { areFloatsEqual } from "~/lib/floatComparison";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

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
          .array()
          .nonempty(),
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
            create: input.expenseContributions,
          },
          totalExpense: input.totalExpense,
          name: input.expenseName
        },
      });
      console.log("ExpenseCreationResponse = ", expenseCreationResponse);
    }),
});
