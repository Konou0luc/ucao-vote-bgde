import { AdminManagementRepository } from "../repository/admin-management.repository";
import { hashPassword } from "../../auth/utils/password.util";
import { AppError } from "../../../shared/errors/AppError";
import { mailer } from "../../../infrastructure/mail/mailer";
import { env } from "../../../config/env";

export class AdminManagementService {
  constructor(private readonly repository: AdminManagementRepository) {}

  async listAdmins() {
    return this.repository.findAll();
  }

  async createAdmin(data: any) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new AppError("Cet email est déjà utilisé", 409);
    }

    const passwordHash = await hashPassword(data.password);
    const admin = await this.repository.create({
      email: data.email,
      passwordHash,
      role: data.role,
      permissions: data.permissions || [],
      needsPasswordChange: true, // Forcer le changement au premier login
    });

    // Envoi de l'email avec les identifiants
    try {
      await mailer.sendMail({
        from: `"VoteBGDE" <${env.MAIL_FROM}>`,
        to: admin.email,
        subject: "Création de votre compte administrateur - VoteBGDE",
        text: `Bonjour,

Votre compte administrateur sur la plateforme VoteBGDE a été créé avec succès.

Voici vos identifiants de connexion :
- Email : ${admin.email}
- Mot de passe temporaire : ${data.password}

IMPORTANT : Pour des raisons de sécurité, veuillez modifier votre mot de passe dès votre première connexion depuis votre tableau de bord dans la section "Mon Profil".

Cordialement,
L'équipe VoteBGDE`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
            <h2>Bienvenue sur VoteBGDE</h2>
            <p>Bonjour,</p>
            <p>Votre compte administrateur sur la plateforme <strong>VoteBGDE</strong> a été créé avec succès.</p>
            <p>Voici vos identifiants de connexion :</p>
            <ul style="background: #f4f4f4; padding: 15px; border-radius: 5px; list-style: none;">
              <li><strong>Email :</strong> ${admin.email}</li>
              <li><strong>Mot de passe temporaire :</strong> ${data.password}</li>
            </ul>
            <p style="color: #d32f2f; font-weight: bold;">
              ⚠️ IMPORTANT : Pour des raisons de sécurité, veuillez modifier votre mot de passe dès votre première connexion depuis votre tableau de bord dans la section "Mon Profil".
            </p>
            <p>Cordialement,<br>L'équipe VoteBGDE</p>
          </div>
        `,
      });
    } catch (error) {
      // On ne bloque pas la création de l'admin si l'email échoue, mais on log l'erreur
      console.error("Erreur lors de l'envoi de l'email de création d'admin:", error);
    }

    return admin;
  }

  async updateAdmin(id: string, data: any) {
    if (data.password) {
      data.passwordHash = await hashPassword(data.password);
      delete data.password;
    }
    return this.repository.update(id, data);
  }

  async deleteAdmin(id: string) {
    return this.repository.delete(id);
  }
}
