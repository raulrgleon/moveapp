/**
 * PostgreSQL schema reference (implemented via Prisma — see prisma/schema.prisma).
 * Static demo content in mock-data.ts seeds new users on first login.
 */

export const DB_TABLES = {
  users: {
    id: "uuid PRIMARY KEY",
    name: "varchar(255) NOT NULL",
    email: "varchar(255) UNIQUE NOT NULL",
    created_at: "timestamptz DEFAULT now()",
  },
  moves: {
    id: "uuid PRIMARY KEY",
    user_id: "uuid REFERENCES users(id)",
    origin: "varchar(255) NOT NULL",
    destination: "varchar(255) NOT NULL",
    destination_address: "varchar(500)",
    move_date: "date NOT NULL",
    household: "text",
    budget: "integer",
    pets: "boolean DEFAULT false",
    rental_preference: "varchar(100)",
    needs_housing_help: "boolean DEFAULT false",
    needs_vehicle_transport: "boolean DEFAULT false",
    created_at: "timestamptz DEFAULT now()",
  },
  vehicles: {
    id: "uuid PRIMARY KEY",
    move_id: "uuid REFERENCES moves(id)",
    description: "varchar(255) NOT NULL",
  },
  checklist_tasks: {
    id: "uuid PRIMARY KEY",
    move_id: "uuid REFERENCES moves(id)",
    title: "varchar(500) NOT NULL",
    category: "varchar(100) NOT NULL",
    status: "varchar(50) DEFAULT 'pending'",
    due_date: "date",
    priority: "varchar(20) DEFAULT 'medium'",
  },
  budget_items: {
    id: "uuid PRIMARY KEY",
    move_id: "uuid REFERENCES moves(id)",
    category: "varchar(100) NOT NULL",
    estimated: "integer DEFAULT 0",
    actual: "integer DEFAULT 0",
    cheapest_option: "text",
  },
  inventory_boxes: {
    id: "uuid PRIMARY KEY",
    move_id: "uuid REFERENCES moves(id)",
    box_number: "integer NOT NULL",
    room: "varchar(100) NOT NULL",
    contents: "text",
    photo_url: "varchar(500)",
    qr_code: "varchar(100)",
  },
  documents: {
    id: "uuid PRIMARY KEY",
    move_id: "uuid REFERENCES moves(id)",
    name: "varchar(255) NOT NULL",
    category: "varchar(100) NOT NULL",
    status: "varchar(50) DEFAULT 'pending'",
    file_url: "varchar(500)",
    uploaded_at: "timestamptz",
  },
} as const;
