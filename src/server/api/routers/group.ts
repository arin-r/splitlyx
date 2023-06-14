import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const groupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        members: z.string().array().nonempty(),
        groupName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userName = ctx.session.user.name;
      if (userName === null || userName === undefined) {
        throw new Error("Unexpected Behaviour of ctx.session.user.name");
      }
      input.members.push(userName);
      const userIds = await ctx.prisma.user.findMany({
        where: {
          name: {
            in: input.members,
          },
        },
        select: {
          id: true,
        },
      });
      const groupCreationResponse = await ctx.prisma.group.create({
        data: {
          name: input.groupName,
          members: {
            connect: userIds,
          },
        },
        select: {
          expenses: true,
          name: true,
          members: true,
          groupContributions: true,
        },
      });
    }),

  getAll: protectedProcedure.query(({ ctx, input }) => {
    return ctx.prisma.user.findFirst({
      where: {
        name: ctx.session.user.name,
      },
      select: {
        groups: {
          select: {
            name: true,
          },
        },
      },
    });
  }),

  getAllExpenses: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // await pause(2000);
      return ctx.prisma.expense.findMany({
        where: {
          groupId: input.groupId,
        },
        select: {
          name: true,
          id: true,
          totalExpense: true,
        },
      });
    }),

  getAllGroupContributions: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.groupContribution.findMany({
        where: {
          groupId: input.groupId,
        },
      });
    }),

  getGroupBalances: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const repayments = await ctx.prisma.repayment.findMany({
        where: {
          groupId: input.groupId,
        },
        select: {
          payer: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
          repaymentAmount: true,
        },
      });

      const balances: {
        user: {
          id: string;
          name: string;
        };
        balance: number;
      }[] = [];

      for (const tr of repayments) {
        const payerIndex = balances.findIndex((b) => b.user.id === tr.payer.id);
        if (payerIndex === -1) {
          balances.push({
            user: {
              id: tr.payer.id,
              name: tr.payer.name || "user",
            },
            balance: tr.repaymentAmount,
          });
        } else {
          balances[payerIndex]!.balance += tr.repaymentAmount;
        }
        const receiverIndex = balances.findIndex(
          (b) => b.user.id === tr.receiver.id
        );
        if (receiverIndex === -1) {
          balances.push({
            user: {
              id: tr.receiver.id,
              name: tr.receiver.name || "user",
            },
            balance: -tr.repaymentAmount,
          });
        } else {
          balances[receiverIndex]!.balance -= tr.repaymentAmount;
        }
      }

      return balances;
    }),

  settleAllExpense: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const groupContributions = await ctx.prisma.groupContribution.findMany({
        where: {
          groupId: input.groupId,
        },
        select: {
          userId: true,
          paid: true,
          actualShare: true,
          groupId: true,
        },
      });

      await ctx.prisma.groupContribution.deleteMany({
        where: {
          groupId: input.groupId,
        },
      });
    }),
  //dev only
  deleteAll: protectedProcedure.mutation(async ({ ctx, input }) => {
    return ctx.prisma.group.deleteMany({});
  }),
});
