import { ScrutinStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../../shared/errors/AppError";
import type { AdminJwtPayload } from "../../auth/interfaces/auth.types";
import type { CreateScrutinRequestDto, UpdateScrutinRequestDto } from "../dto/scrutin.admin.dto";
import { ScrutinAdminRepository } from "../repository/scrutin.admin.repository";

export class ScrutinAdminService {
  constructor(private readonly repository: ScrutinAdminRepository) {}

  async create(payload: CreateScrutinRequestDto, admin: AdminJwtPayload) {
    const startsAt = new Date(payload.startsAt);
    const endsAt = new Date(payload.endsAt);

    if (endsAt <= startsAt) {
      throw new AppError("La date de fin doit etre apres la date de debut", 400);
    }

    if ((payload.status ?? "DRAFT") === ScrutinStatus.OPEN) {
      const existingOpen = await this.repository.findOpenScrutin();
      if (existingOpen) {
        throw new AppError("Un scrutin est deja ouvert. Fermez-le avant d'en ouvrir un autre", 409);
      }
    }

    const scrutin = await this.repository.create({
      title: payload.title,
      description: payload.description,
      startsAt,
      endsAt,
      status: payload.status ?? ScrutinStatus.DRAFT,
      createdByAdminId: admin.sub,
    });

    await this.repository.createAuditLog({
      adminId: admin.sub,
      action: "SCRUTIN_CREATED",
      entity: "Scrutin",
      entityId: scrutin.id,
    });

    return scrutin;
  }

  list() {
    return this.repository.list();
  }

  async update(id: string, payload: UpdateScrutinRequestDto, admin: AdminJwtPayload) {
    const exists = await this.repository.findById(id);
    if (!exists) {
      throw new AppError("Scrutin introuvable", 404);
    }

    const startsAt = payload.startsAt ? new Date(payload.startsAt) : undefined;
    const endsAt = payload.endsAt ? new Date(payload.endsAt) : undefined;
    const nextStartsAt = startsAt ?? exists.startsAt;
    const nextEndsAt = endsAt ?? exists.endsAt;

    if (nextEndsAt <= nextStartsAt) {
      throw new AppError("La date de fin doit etre apres la date de debut", 400);
    }

    if (payload.status === ScrutinStatus.OPEN) {
      const existingOpen = await this.repository.findOpenScrutin(id);
      if (existingOpen) {
        throw new AppError("Un scrutin est deja ouvert. Fermez-le avant d'en ouvrir un autre", 409);
      }
    }

    const updated = await this.repository.update(id, {
      title: payload.title,
      description: payload.description,
      startsAt,
      endsAt,
      status: payload.status,
    });

    await this.repository.createAuditLog({
      adminId: admin.sub,
      action: "SCRUTIN_UPDATED",
      entity: "Scrutin",
      entityId: updated.id,
    });

    return updated;
  }

  async archive(id: string, admin: AdminJwtPayload) {
    const exists = await this.repository.findById(id);
    if (!exists) {
      throw new AppError("Scrutin introuvable", 404);
    }

    const archived = await this.repository.archive(id);

    await this.repository.createAuditLog({
      adminId: admin.sub,
      action: "SCRUTIN_ARCHIVED",
      entity: "Scrutin",
      entityId: archived.id,
    });

    return archived;
  }

  async publishResults(id: string, admin: AdminJwtPayload) {
    const scrutin = await this.repository.findById(id);
    if (!scrutin) {
      throw new AppError("Scrutin introuvable", 404);
    }

    if (scrutin.status !== ScrutinStatus.CLOSED && scrutin.status !== ScrutinStatus.ARCHIVED) {
      throw new AppError("La publication des resultats est possible uniquement apres cloture", 403);
    }

    const updated = await this.repository.publishResults(id);

    await this.repository.createAuditLog({
      adminId: admin.sub,
      action: "SCRUTIN_RESULTS_PUBLISHED",
      entity: "Scrutin",
      entityId: id,
    });

    return updated;
  }

  async getDashboard(admin: AdminJwtPayload) {
    const [
      eligibleStudents,
      totalVotes,
      draftCount,
      scheduledCount,
      openCount,
      closedCount,
      archivedCount,
    ] = await Promise.all([
      this.repository.countEligibleStudents(),
      this.repository.countTotalVotes(),
      this.repository.countScrutinsByStatus(ScrutinStatus.DRAFT),
      this.repository.countScrutinsByStatus(ScrutinStatus.SCHEDULED),
      this.repository.countScrutinsByStatus(ScrutinStatus.OPEN),
      this.repository.countScrutinsByStatus(ScrutinStatus.CLOSED),
      this.repository.countScrutinsByStatus(ScrutinStatus.ARCHIVED),
    ]);

    await this.repository.createAuditLog({
      adminId: admin.sub,
      action: "ADMIN_DASHBOARD_VIEWED",
      entity: "Dashboard",
      entityId: "global",
    });

    return {
      students: {
        eligible: eligibleStudents,
      },
      votes: {
        total: totalVotes,
      },
      scrutins: {
        draft: draftCount,
        scheduled: scheduledCount,
        open: openCount,
        closed: closedCount,
        archived: archivedCount,
      },
    };
  }

  async getParticipationStats(scrutinId: string, admin: AdminJwtPayload) {
    const scrutin = await this.repository.findById(scrutinId);
    if (!scrutin) {
      throw new AppError("Scrutin introuvable", 404);
    }

    const [eligibleStudents, participants, voters] = await Promise.all([
      this.repository.countEligibleStudents(),
      this.repository.countParticipations(scrutinId),
      this.repository.countVoters(scrutinId),
    ]);

    await this.repository.createAuditLog({
      adminId: admin.sub,
      action: "SCRUTIN_PARTICIPATION_VIEWED",
      entity: "Scrutin",
      entityId: scrutinId,
    });

    const participationRate = eligibleStudents > 0 ? Number(((voters / eligibleStudents) * 100).toFixed(2)) : 0;

    return {
      scrutinId,
      title: scrutin.title,
      status: scrutin.status,
      eligibleStudents,
      participants,
      voters,
      participationRate,
    };
  }

  async getResults(scrutinId: string, admin: AdminJwtPayload) {
    const scrutin = await this.repository.findById(scrutinId);
    if (!scrutin) {
      throw new AppError("Scrutin introuvable", 404);
    }

    if (scrutin.status !== ScrutinStatus.CLOSED && scrutin.status !== ScrutinStatus.ARCHIVED) {
      throw new AppError("Les resultats sont disponibles uniquement apres cloture du scrutin", 403);
    }

    const [candidateLists, groupedVotes] = await Promise.all([
      this.repository.listCandidateLists(scrutinId),
      this.repository.groupVotesByCandidateList(scrutinId),
    ]);

    const voteByListId = new Map(groupedVotes.map((entry) => [entry.candidateListId, entry._count._all]));
    const totalVotes = groupedVotes.reduce((acc, entry) => acc + entry._count._all, 0);

    const results = candidateLists.map((list) => {
      const votes = voteByListId.get(list.id) ?? 0;
      const percentage = totalVotes > 0 ? Number(((votes / totalVotes) * 100).toFixed(2)) : 0;

      return {
        candidateListId: list.id,
        name: list.name,
        order: list.order,
        isActive: list.isActive,
        votes,
        percentage,
      };
    });

    await this.repository.createAuditLog({
      adminId: admin.sub,
      action: "SCRUTIN_RESULTS_VIEWED",
      entity: "Scrutin",
      entityId: scrutinId,
    });

    return {
      scrutinId,
      title: scrutin.title,
      status: scrutin.status,
      resultsPublishedAt: scrutin.resultsPublishedAt,
      totalVotes,
      results,
    };
  }
}
