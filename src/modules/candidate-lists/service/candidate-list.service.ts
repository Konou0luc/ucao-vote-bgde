import { AppError } from "../../../shared/errors/AppError";
import type { AdminJwtPayload } from "../../auth/interfaces/auth.types";
import type { CreateCandidateListRequestDto, UpdateCandidateListRequestDto } from "../dto/candidate-list.dto";
import { CandidateListRepository } from "../repository/candidate-list.repository";

export class CandidateListService {
  constructor(private readonly repository: CandidateListRepository) {}

  async create(payload: CreateCandidateListRequestDto, admin: AdminJwtPayload) {
    const scrutin = await this.repository.findScrutinById(payload.scrutinId);
    if (!scrutin) {
      throw new AppError("Scrutin introuvable", 404);
    }

    const existing = await this.repository.findByNameAndScrutin(payload.name, payload.scrutinId);
    if (existing) {
      throw new AppError(`Une liste nommée "${payload.name}" existe déjà pour ce scrutin`, 409);
    }

    const created = await this.repository.create({
      scrutinId: payload.scrutinId,
      name: payload.name,
      slogan: payload.slogan,
      description: payload.description,
      members: payload.members || [],
      actionPlan: payload.actionPlan || [],
      videoUrl: payload.videoUrl,
      imageUrl: payload.imageUrl,
      order: payload.order,
    });

    await this.repository.createAuditLog({
      adminId: admin.sub,
      action: "CANDIDATE_LIST_CREATED",
      entity: "CandidateList",
      entityId: created.id,
      metadata: { scrutinId: payload.scrutinId },
    });

    return created;
  }

  async listByScrutin(scrutinId: string) {
    return this.repository.listByScrutin(scrutinId);
  }

  async update(id: string, payload: UpdateCandidateListRequestDto, admin: AdminJwtPayload) {
    const item = await this.repository.findById(id);
    if (!item) throw new AppError("Liste candidate introuvable", 404);

    const updated = await this.repository.update(id, payload);

    await this.repository.createAuditLog({
      adminId: admin.sub,
      action: "CANDIDATE_LIST_UPDATED",
      entity: "CandidateList",
      entityId: updated.id,
    });

    return updated;
  }

  async deactivate(id: string, admin: AdminJwtPayload) {
    const item = await this.repository.findById(id);
    if (!item) throw new AppError("Liste candidate introuvable", 404);

    const updated = await this.repository.update(id, { isActive: false });

    await this.repository.createAuditLog({
      adminId: admin.sub,
      action: "CANDIDATE_LIST_DEACTIVATED",
      entity: "CandidateList",
      entityId: updated.id,
    });

    return updated;
  }
}
