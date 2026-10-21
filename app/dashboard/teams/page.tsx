import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import CreateTeamButton from "@/components/CreateTeamButton";
import TeamCard from "@/components/TeamCard";
import { UsersRound, Users } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  const memberships = await prisma.teamMembership.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          members: { include: { user: true } },
        },
      },
    },
    orderBy: { team: { name: 'asc' } },
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <UsersRound className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Teams & Groups</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {memberships.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Team members automatically inherit shared access to projects assigned to the team.
          </p>
        </div>
        <CreateTeamButton />
      </div>

      {memberships.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-16 text-center text-slate-400 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <p className="font-semibold text-slate-800 text-base">You haven&apos;t joined any teams yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create a team to manage collaborator permissions and grant instant access to entire project libraries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {memberships.map((m) => (
            <TeamCard
              key={m.team.id}
              teamId={m.team.id}
              teamName={m.team.name}
              description={m.team.description}
              isCurrentUserLead={m.role === 'LEAD'}
              members={m.team.members.map((member) => ({
                userId: member.userId,
                name: member.user.name || 'Unnamed',
                email: member.user.email || '',
                role: member.role,
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}