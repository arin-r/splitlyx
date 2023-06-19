import { TRPCError } from "@trpc/server";
import { z } from "zod";
import calculateTransactions from "~/lib/calculateTransactions";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const groupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        //add check for non empty members list
        members: z.string().array(),
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
          id: true,
          // expenses: true,
          // name: true,
          // members: true,
          // groupContributions: true,
        },
      });

      return {
        groupId: groupCreationResponse.id,
      };
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

  addTransaction: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        payerId: z.string(),
        receiverId: z.string(),
        transactionAmount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if(input.payerId === input.receiverId) {
            throw new TRPCError({ code: "UNPROCESSABLE_CONTENT" });
      }
      const transactionCreationResponse =
        await ctx.prisma.recordedTransaction.create({
          data: {
            transactionAmount: input.transactionAmount,
            groupId: input.groupId,
            payerId: input.payerId,
            receiverId: input.receiverId,
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

      const payerIndex = groupContributions.findIndex(
        (gp) => gp.userId === input.payerId
      );
      console.log("🚀 ~ file: group.ts ~ .mutation ~ payerIndex:", payerIndex);

      const receiverIndex = groupContributions.findIndex(
        (gp) => gp.userId === input.receiverId
      );
      console.log(
        "🚀 ~ file: group.ts ~ .mutation ~ receiverIndex:",
        receiverIndex
      );

      //TODO: error handling if payerIndex of receiverIndex is -1

      groupContributions[payerIndex]!.paid += input.transactionAmount;
      groupContributions[receiverIndex]!.paid -= input.transactionAmount;

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

  getTransactions: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const transactions = await ctx.prisma.recordedTransaction.findMany({
        where: {
          groupId: input.groupId,
        },
        select: {
          payerId: true,
          receiverId: true,
          transactionAmount: true,
        },
      });

      return transactions;
    }),
  //dev only
  deleteAll: protectedProcedure.mutation(async ({ ctx, input }) => {
    return ctx.prisma.group.deleteMany({});
  }),
});
