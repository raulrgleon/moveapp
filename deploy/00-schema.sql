-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "phone" TEXT,
    "google_id" TEXT,
    "apple_id" TEXT,
    "email_reminders" BOOLEAN NOT NULL DEFAULT true,
    "sms_reminders" BOOLEAN NOT NULL DEFAULT false,
    "active_move_id" TEXT,
    "locale" TEXT DEFAULT 'en',
    "plan_tier" TEXT NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMP(3),
    "plan_paid_at" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "suspended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_announcements" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "register_token" TEXT,
    "register_token_expires_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moves" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "destination_address" TEXT,
    "destination_lat" DOUBLE PRECISION,
    "destination_lon" DOUBLE PRECISION,
    "origin_lat" DOUBLE PRECISION,
    "origin_lon" DOUBLE PRECISION,
    "move_date" DATE NOT NULL,
    "household" TEXT NOT NULL,
    "pet_details" TEXT,
    "pets" BOOLEAN NOT NULL DEFAULT false,
    "budget" INTEGER NOT NULL DEFAULT 0,
    "rental_preference" TEXT NOT NULL,
    "needs_housing_help" BOOLEAN NOT NULL DEFAULT false,
    "needs_vehicle_transport" BOOLEAN NOT NULL DEFAULT false,
    "truck_choice" TEXT,
    "vehicle_transport_choice" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "partner_share_token" TEXT,
    "partner_share_enabled" BOOLEAN NOT NULL DEFAULT false,
    "selected_route_index" INTEGER NOT NULL DEFAULT 0,
    "route_alternatives" JSONB,
    "route_stops_by_index" JSONB,
    "routes_computed_at" TIMESTAMP(3),
    "utility_picks" JSONB,
    "supply_checks" JSONB,
    "shopping_selections" JSONB,
    "plan_share_token" TEXT,
    "plan_share_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_quotes" (
    "id" TEXT NOT NULL,
    "move_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "amount" INTEGER,
    "amount_min" INTEGER,
    "amount_max" INTEGER,
    "message" TEXT,
    "service_type" TEXT,
    "includes_packing" BOOLEAN NOT NULL DEFAULT false,
    "includes_insurance" BOOLEAN NOT NULL DEFAULT false,
    "usdot_number" TEXT,
    "available_date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moving_partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usdot" TEXT,
    "rating" DOUBLE PRECISION,
    "years_in_business" INTEGER,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "website" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moving_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "move_collaborators" (
    "id" TEXT NOT NULL,
    "move_id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "invite_token" TEXT,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "move_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "move_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "estimated" INTEGER NOT NULL,
    "actual" INTEGER NOT NULL DEFAULT 0,
    "cheapest_option" TEXT,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_id" TEXT,
    "channel" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "move_id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "make_id" INTEGER,
    "make" TEXT NOT NULL,
    "model_id" INTEGER,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "display_label" TEXT NOT NULL,
    "needs_transport" BOOLEAN NOT NULL DEFAULT false,
    "comb_mpg" DOUBLE PRECISION,
    "city_mpg" DOUBLE PRECISION,
    "highway_mpg" DOUBLE PRECISION,
    "fuel_type" TEXT,
    "epa_vehicle_id" TEXT,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_boxes" (
    "id" TEXT NOT NULL,
    "move_id" TEXT NOT NULL,
    "box_number" INTEGER NOT NULL,
    "room" TEXT NOT NULL,
    "destination_room" TEXT,
    "contents" TEXT NOT NULL,
    "photo_url" TEXT,
    "fragile" BOOLEAN NOT NULL DEFAULT false,
    "essentials" BOOLEAN NOT NULL DEFAULT false,
    "size_estimate" TEXT,
    "weight_lbs" DOUBLE PRECISION,
    "assignee_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'packed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_tasks" (
    "id" TEXT NOT NULL,
    "move_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_date" DATE,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "notes" TEXT,
    "assignee_email" TEXT,

    CONSTRAINT "checklist_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "move_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "file_name" TEXT,
    "storage_key" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "uploaded_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_reads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "move_activities" (
    "id" TEXT NOT NULL,
    "move_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "move_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "bucket_key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("bucket_key")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_apple_id_key" ON "users"("apple_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_admin_id_idx" ON "admin_audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "system_announcements_active_idx" ON "system_announcements"("active");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_register_token_key" ON "email_verifications"("register_token");

-- CreateIndex
CREATE INDEX "email_verifications_email_idx" ON "email_verifications"("email");

-- CreateIndex
CREATE UNIQUE INDEX "moves_partner_share_token_key" ON "moves"("partner_share_token");

-- CreateIndex
CREATE UNIQUE INDEX "moves_plan_share_token_key" ON "moves"("plan_share_token");

-- CreateIndex
CREATE INDEX "moves_user_id_idx" ON "moves"("user_id");

-- CreateIndex
CREATE INDEX "partner_quotes_move_id_idx" ON "partner_quotes"("move_id");

-- CreateIndex
CREATE INDEX "moving_partners_active_sort_order_idx" ON "moving_partners"("active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "move_collaborators_invite_token_key" ON "move_collaborators"("invite_token");

-- CreateIndex
CREATE INDEX "move_collaborators_move_id_idx" ON "move_collaborators"("move_id");

-- CreateIndex
CREATE UNIQUE INDEX "move_collaborators_move_id_email_key" ON "move_collaborators"("move_id", "email");

-- CreateIndex
CREATE INDEX "budget_items_move_id_idx" ON "budget_items"("move_id");

-- CreateIndex
CREATE INDEX "reminder_logs_user_id_task_id_channel_idx" ON "reminder_logs"("user_id", "task_id", "channel");

-- CreateIndex
CREATE INDEX "vehicles_move_id_idx" ON "vehicles"("move_id");

-- CreateIndex
CREATE INDEX "inventory_boxes_move_id_idx" ON "inventory_boxes"("move_id");

-- CreateIndex
CREATE INDEX "checklist_tasks_move_id_idx" ON "checklist_tasks"("move_id");

-- CreateIndex
CREATE INDEX "documents_move_id_idx" ON "documents"("move_id");

-- CreateIndex
CREATE INDEX "notification_reads_user_id_idx" ON "notification_reads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_reads_user_id_key_key" ON "notification_reads"("user_id", "key");

-- CreateIndex
CREATE INDEX "move_activities_move_id_idx" ON "move_activities"("move_id");

-- CreateIndex
CREATE INDEX "move_activities_user_id_idx" ON "move_activities"("user_id");

-- CreateIndex
CREATE INDEX "chat_messages_user_id_idx" ON "chat_messages"("user_id");

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moves" ADD CONSTRAINT "moves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_quotes" ADD CONSTRAINT "partner_quotes_move_id_fkey" FOREIGN KEY ("move_id") REFERENCES "moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_collaborators" ADD CONSTRAINT "move_collaborators_move_id_fkey" FOREIGN KEY ("move_id") REFERENCES "moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_collaborators" ADD CONSTRAINT "move_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_move_id_fkey" FOREIGN KEY ("move_id") REFERENCES "moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_move_id_fkey" FOREIGN KEY ("move_id") REFERENCES "moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_boxes" ADD CONSTRAINT "inventory_boxes_move_id_fkey" FOREIGN KEY ("move_id") REFERENCES "moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_tasks" ADD CONSTRAINT "checklist_tasks_move_id_fkey" FOREIGN KEY ("move_id") REFERENCES "moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_move_id_fkey" FOREIGN KEY ("move_id") REFERENCES "moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_activities" ADD CONSTRAINT "move_activities_move_id_fkey" FOREIGN KEY ("move_id") REFERENCES "moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_activities" ADD CONSTRAINT "move_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
