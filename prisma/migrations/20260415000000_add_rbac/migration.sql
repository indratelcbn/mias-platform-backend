-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SOSIAL';
ALTER TYPE "Role" ADD VALUE 'DAKWAH';
ALTER TYPE "Role" ADD VALUE 'PENDIDIKAN';
ALTER TYPE "Role" ADD VALUE 'USAHA';

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "menu_key" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_menu_key_key" ON "role_permissions"("role", "menu_key");
