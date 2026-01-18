CREATE TABLE "contact_mediums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_id" uuid NOT NULL,
	"medium_type" varchar(100) NOT NULL,
	"preferred" boolean DEFAULT false,
	"characteristic" jsonb,
	"valid_for_start" timestamp,
	"valid_for_end" timestamp
);
--> statement-breakpoint
CREATE TABLE "event_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"callback" varchar(500) NOT NULL,
	"query" varchar(1000)
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"href" varchar(500),
	"party_type" varchar(50) NOT NULL,
	"type" varchar(100) NOT NULL,
	"base_type" varchar(100),
	"schema_location" varchar(500),
	"status" varchar(50),
	"status_reason" varchar(500),
	"valid_for_start" timestamp,
	"valid_for_end" timestamp,
	"gender" varchar(50),
	"place_of_birth" varchar(255),
	"country_of_birth" varchar(100),
	"nationality" varchar(100),
	"marital_status" varchar(50),
	"birth_date" date,
	"death_date" date,
	"title" varchar(50),
	"given_name" varchar(255),
	"family_name" varchar(255),
	"middle_name" varchar(255),
	"full_name" varchar(500),
	"formatted_name" varchar(500),
	"location" varchar(500),
	"is_head_office" boolean,
	"is_legal_entity" boolean,
	"name" varchar(255),
	"name_type" varchar(100),
	"organization_type" varchar(100),
	"trading_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "party_characteristics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"value" jsonb,
	"value_type" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "related_parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_party_id" uuid NOT NULL,
	"referenced_party_id" uuid,
	"referenced_party_href" varchar(500),
	"name" varchar(255),
	"role" varchar(100) NOT NULL,
	"referred_type" varchar(100) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_mediums" ADD CONSTRAINT "contact_mediums_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_characteristics" ADD CONSTRAINT "party_characteristics_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_parties" ADD CONSTRAINT "related_parties_source_party_id_parties_id_fk" FOREIGN KEY ("source_party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;