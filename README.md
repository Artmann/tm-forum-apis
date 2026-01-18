# TM Forum APIs

Implementation of TM Forum Open APIs as microservices for educational purposes.

## APIs Implemented

| API | Name | Port |
|-----|------|------|
| TMF620 | Product Catalog Management | 3620 |
| TMF629 | Customer Management | 3629 |
| TMF632 | Party Management | 3632 |
| TMF673 | Geographic Address Management | 3673 |

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Docker](https://www.docker.com) & Docker Compose

## Getting Started

### Install Dependencies

```bash
bun install
```

### Start Infrastructure

```bash
cd docker
docker compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### Development

```bash
bun run dev
```

### Testing

```bash
bun run test
```

### Build

```bash
bun run build
```

## Project Structure

```
tm-forum-apis/
├── apps/
│   ├── tmf620-product-catalog/
│   ├── tmf629-customer/
│   ├── tmf632-party/
│   └── tmf673-geographic-address/
├── packages/
│   ├── shared/          # Common types and interfaces
│   ├── tmf-common/      # Hono middleware and utilities
│   └── database/        # Database utilities
├── docker/
│   ├── docker-compose.yml
│   └── init-databases.sql
└── turbo.json
```

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Message Broker**: Redis (pub/sub)
- **Monorepo**: Turborepo
