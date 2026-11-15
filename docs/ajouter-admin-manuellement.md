# Ajouter un autre administrateur manuellement

Ce guide explique comment ajouter un nouvel administrateur dans ce projet sans utiliser d’IA, uniquement avec des étapes simples et propres.

## 1. Préparer les informations du nouvel administrateur

Rassemblez :
- l’email du nouvel admin
- le mot de passe choisi
- le rôle souhaité : `SUPER_ADMIN` ou `STANDARD_ADMIN`

## 2. Générer le hash du mot de passe

Depuis la racine du projet, exécutez :

```bash
npm run admin:hash -- "VOTRE_MOT_DE_PASSE"
```

Exemple :

```bash
npm run admin:hash -- "MonMotDePasse123!"
```

Cette commande affiche un hash bcrypt que vous allez utiliser dans le fichier d’environnement.

## 3. Ajouter les variables d’environnement

Ouvrez le fichier `.env` et ajoutez ces lignes :

```env
THIRD_ADMIN_EMAIL=votre@email.com
THIRD_ADMIN_PASSWORD_HASH=LE_HASH_GENERE
```

Si vous voulez ajouter un quatrième admin, vous pouvez aussi utiliser un autre nom de variable, par exemple :

```env
FOURTH_ADMIN_EMAIL=votre@email.com
FOURTH_ADMIN_PASSWORD_HASH=LE_HASH_GENERE
```

## 4. Mettre à jour le seed Prisma

Le projet utilise le fichier [prisma/seed.ts](../prisma/seed.ts) pour créer ou mettre à jour les comptes admins automatiquement.

Pour ajouter un nouvel admin, il faut ajouter une nouvelle section dans ce fichier, par exemple :

```ts
if (env.FOURTH_ADMIN_EMAIL && env.FOURTH_ADMIN_PASSWORD_HASH) {
  await prisma.admin.upsert({
    where: { email: env.FOURTH_ADMIN_EMAIL },
    update: {
      passwordHash: env.FOURTH_ADMIN_PASSWORD_HASH,
      role: AdminRole.STANDARD_ADMIN,
      isActive: true,
    },
    create: {
      email: env.FOURTH_ADMIN_EMAIL,
      passwordHash: env.FOURTH_ADMIN_PASSWORD_HASH,
      role: AdminRole.STANDARD_ADMIN,
      isActive: true,
    },
  });
}
```

## 5. Exécuter le seed

Puis lancez :

```bash
npm run prisma:seed
```

Cette commande crée ou met à jour l’admin dans la base de données.

## 6. Vérifier que le compte existe

Si vous voulez vérifier, vous pouvez ouvrir la base via Prisma Studio :

```bash
npm run prisma:studio
```

Puis aller dans la table `admins`.

## 7. Exemple concret

Si vous voulez ajouter un admin avec :
- email : `admin2@example.com`
- mot de passe : `Admin123!`

Faites :

```bash
npm run admin:hash -- "Admin123!"
```

Puis dans `.env` :

```env
THIRD_ADMIN_EMAIL=admin2@example.com
THIRD_ADMIN_PASSWORD_HASH=LE_HASH_GENERE
```

Et exécutez :

```bash
npm run prisma:seed
```

## 8. Astuce utile

Pour un admin plus puissant, utilisez :

```ts
role: AdminRole.SUPER_ADMIN
```

Pour un admin classique, utilisez :

```ts
role: AdminRole.STANDARD_ADMIN
```

## 9. Résumé rapide

La méthode simple est :
1. générer le hash du mot de passe
2. ajouter les variables dans `.env`
3. ajouter la logique de création dans `prisma/seed.ts`
4. lancer `npm run prisma:seed`

C’est la façon la plus simple pour ajouter un autre admin plus tard, sans dépendre de l’IA.
