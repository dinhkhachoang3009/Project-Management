# TaskManager — Quản Lý Dự Án & Công Việc Nhóm / Team Project & Task Management

> **Live Demo:** [https://taskmanager.qzz.io](https://taskmanager.qzz.io)

---

## 🇻🇳 Giới Thiệu / 🇺🇸 Introduction

**TaskManager** là nền tảng quản lý công việc và dự án trực tuyến, giúp các nhóm làm việc cùng nhau một cách hiệu quả thông qua workspace (không gian làm việc), project (dự án) và task (công việc) có hệ thống.

**TaskManager** is a full-stack web application for team project and task management. It helps teams collaborate efficiently through workspaces, projects, and structured task tracking.

---

## ✨ Tính Năng Chính / Key Features

| # | Tiếng Việt | English |
|---|-----------|---------|
| 1 | **Workspace** — Tạo không gian làm việc riêng cho từng nhóm, mỗi workspace có thể chứa nhiều dự án | Create dedicated workspaces for different teams, each holding multiple projects |
| 2 | **Quản lý thành viên** — Mời thành viên qua email, phân quyền Owner / Admin / Member / Viewer | Invite members via email with role-based access: Owner, Admin, Member, Viewer |
| 3 | **Dự án (Project)** — Tạo dự án trong workspace với trạng thái, tiến độ, ngày bắt đầu & hạn chót | Create projects with status, progress, start date & due date |
| 4 | **Công việc (Task)** — Tạo task với trạng thái (To Do / In Progress / Done), mức độ ưu tiên (High / Medium / Low), người phụ trách | Create tasks with status, priority, assignees, and due dates |
| 5 | **Subtask** — Chia nhỏ task thành các subtask có thể đánh dấu hoàn thành | Break tasks into subtasks with completion toggles |
| 6 | **Bình luận** — Thảo luận trực tiếp trên từng task | Comment directly on tasks |
| 7 | **Theo dõi (Watch)** — Theo dõi task để nhận cập nhật | Watch tasks to receive updates |
| 8 | **Lưu trữ (Archive)** — Lưu trữ task/dự án thay vì xóa vĩnh viễn | Archive tasks/projects instead of permanent deletion |
| 9 | **Dashboard & Biểu đồ** — Thống kê task trends, project status, task priority, workspace productivity | Dashboard with task trends, project status, priority, and productivity charts |
| 10 | **Xác thực Email** — Đăng ký tài khoản yêu cầu xác thực email qua SendGrid | Email verification required for registration via SendGrid |
| 11 | **Quên mật khẩu** — Gửi email reset password với token có hạn 15 phút | Forgot password flow with 15-minute reset token |
| 12 | **Bảo mật** — Tích hợp Arcjet chống bot, rate limiting, validate email | Arcjet integration for bot detection, rate limiting, and email validation |
| 13 | **Logging** — Ghi log bằng Winston với format JSON, timestamp, level | Structured JSON logging with Winston |
| 14 | **Metrics & Monitoring** — Endpoint `/metrics` cho Prometheus, dashboard Grafana | Prometheus metrics endpoint + Grafana dashboards |

---

## 🛠️ Công Nghệ / Tech Stack

### Backend
| Công nghệ | Mục đích |
|-----------|----------|
| Node.js 20 + Express | Web server |
| MongoDB + Mongoose | Database |
| JWT | Authentication tokens |
| bcrypt | Password hashing |
| Zod + zod-express-middleware | Schema validation |
| SendGrid | Transactional emails |
| Arcjet | Security (bot detection, rate limiting) |
| Winston | Structured logging (JSON, timestamp, levels) |
| prom-client | Prometheus metrics collection |
| Morgan | HTTP logging |
| CORS | Cross-origin requests |
| Jest | Unit testing |
| ESLint | Code linting |

### Frontend
| Công nghệ | Mục đích |
|-----------|----------|
| React 19 | UI library |
| React Router 7 | Routing + SSR |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| @tailwindcss/vite | Tailwind Vite integration |
| tw-animate-css | Tailwind animations |
| Vite | Build tool |
| TanStack Query | Server state management |
| Axios | HTTP client |
| React Hook Form + Zod | Form handling & validation |
| Recharts | Charts & visualization |
| shadcn/ui + Radix UI | UI components |
| Sonner | Toast notifications |
| date-fns | Date formatting |
| Vitest | Unit testing |
| Testing Library | Component testing |
| jsdom | DOM environment for tests |
| ESLint | Code linting |

### DevOps & Infrastructure
| Công nghệ | Mục đích |
|-----------|----------|
| Docker + Docker Compose | Containerization & local orchestration |
| GitHub Actions | CI/CD pipeline (lint → test → build → push → scan) |
| GitHub Container Registry (GHCR) | Docker image registry |
| Trivy | Container vulnerability scanning |
| SonarCloud | Code quality & coverage analysis |
| Prometheus | Metrics collection |
| Grafana | Metrics visualization |
| Terraform | Infrastructure as Code (Cloudflare DNS) |
| Uptime Kuma | Uptime monitoring |

---

## 📁 Cấu Trúc Dự Án / Project Structure

```
Project-Management/
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI/CD pipeline
├── infrastructure/                 # Terraform IaC (Cloudflare DNS)
│   ├── main.tf
│   ├── provider.tf
│   ├── variables.tf
│   └── README.md
├── backend/                        # Backend (Node.js + Express)
│   ├── index.js                    # Express server entry point
│   ├── Dockerfile                  # Optimized Docker image (Alpine)
│   ├── .dockerignore
│   ├── .env                        # Local env
│   ├── .env.example                # Environment variables template
│   ├── .env.docker                 # Docker local env
│   ├── .env.docker.example         # Docker env template
│   ├── package.json
│   ├── jest.config.mjs             # Jest test config
│   ├── eslint.config.mjs
│   ├── controllers/                # Route handlers
│   │   ├── auth-controller.js      # Authentication (register, login, verify, reset)
│   │   ├── workspace-controller.js # Workspace CRUD + invites + stats
│   │   ├── project-controller.js   # Project CRUD
│   │   ├── task-controller.js      # Task CRUD + subtasks + archive + watchers
│   │   ├── comment-controller.js   # Comments
│   │   └── user.js                 # Profile & password change
│   ├── models/                     # Mongoose schemas
│   │   ├── user.js
│   │   ├── workspace.js
│   │   ├── project.js
│   │   ├── task.js
│   │   ├── comment.js
│   │   ├── activity.js
│   │   ├── verification.js
│   │   └── workspace-invite.js
│   ├── routes/                     # Express routes
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── workspace.js
│   │   ├── project.js
│   │   ├── task.js
│   │   └── user.js
│   ├── middleware/
│   │   └── auth-middleware.js      # JWT verification
│   ├── libs/
│   │   ├── index.js                # Activity recording helper
│   │   ├── send-email.js           # SendGrid wrapper
│   │   ├── arcjet.js               # Arcjet security config
│   │   ├── validate-schema.js      # Zod schemas
│   │   ├── logger.js               # Winston logger
│   │   └── metrics.js              # Prometheus metrics
│   └── __tests__/                  # Jest tests
│       ├── setup.test.js
│       └── health.test.js
│
├── frontend/                       # Frontend (React Router + Vite)
│   ├── Dockerfile                  # Multi-stage Docker image
│   ├── .dockerignore
│   ├── .env                        # Local env
│   ├── .env.example
│   ├── .env.docker                 # Docker local env
│   ├── .env.docker.example
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── react-router.config.ts
│   ├── vitest.config.ts            # Vitest test config
│   ├── vitest.setup.ts
│   ├── eslint.config.mjs
│   ├── app/
│   │   ├── root.tsx                # Root layout
│   │   ├── app.css
│   │   ├── routes.ts               # Route configuration
│   │   ├── routes/
│   │   │   ├── auth/               # Sign-in, sign-up, verify, forgot/reset password
│   │   │   ├── dashboard/          # App pages (workspaces, projects, tasks, settings)
│   │   │   ├── root/               # Landing page
│   │   │   └── user/               # Profile page
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── layout/             # Header, sidebar, navigation
│   │   │   ├── dashboard/          # Stats cards, charts
│   │   │   ├── workspace/          # Workspace components
│   │   │   ├── project/            # Project components
│   │   │   └── task/               # Task components
│   │   ├── hooks/                  # TanStack Query hooks
│   │   ├── lib/
│   │   │   ├── fetch-util.ts       # Axios instance
│   │   │   ├── schema.ts           # Frontend Zod schemas
│   │   │   ├── index.ts            # Utilities
│   │   │   └── utils.ts            # cn() helper
│   │   ├── provider/
│   │   │   ├── auth-context.tsx    # Auth state management
│   │   │   └── react-query-provider.tsx
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces
│   │   └── components/__tests__/   # Vitest component tests
│   └── public/
│       ├── favicon.ico
│       └── dashboard-preview.png
│
├── docker-compose.yml              # Full stack: BE + FE + MongoDB + Prometheus + Grafana
├── prometheus.yml                  # Prometheus scrape config
├── sonar-project.properties        # SonarCloud config
├── DEVOPS_PLAN.md                # DevOps implementation plan (internal)
└── README.md                     # This file
```

---

## 🚀 Cài Đặt & Chạy Local / Setup & Run Locally

### Yêu cầu hệ thống / Prerequisites
- **Node.js** >= 20.0.0
- **Docker & Docker Compose** (khuyến nghị — chạy full stack nhanh nhất)
- **MongoDB** (nếu chạy manual — local hoặc MongoDB Atlas)
- **SendGrid account** (để gửi email xác thực / for sending verification emails)
- **Arcjet account** (bảo mật / for security)

---

### 🔥 Cách 1: Docker Compose (Khuyến nghị) / Method 1: Docker Compose (Recommended)

Chạy toàn bộ stack — MongoDB, Backend, Frontend, Prometheus, Grafana — chỉ với 1 lệnh:

```bash
# 1. Clone repository
git clone https://github.com/your-username/Project-Management.git
cd Project-Management

# 2. Copy env files
cp backend/.env.docker.example backend/.env.docker
cp frontend/.env.docker.example frontend/.env.docker

# 3. Edit backend/.env.docker with your real credentials:
#    JWT_SECRET=your-jwt-secret
#    SEND_GRID_API=your-sendgrid-api-key
#    FROM_EMAIL=your-email@example.com
#    ARCJET_KEY=your-arcjet-key

# 4. Start everything
docker-compose up --build

# 5. Run in background
docker-compose up --build -d

# 6. Stop everything
docker-compose down

# 7. Stop and remove volumes
docker-compose down -v
```

**Sau khi chạy / After running:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3002 (admin/admin) |
| MongoDB | localhost:27017 |

---

### ⚙️ Cách 2: Cài đặt thủ công / Method 2: Manual Setup

#### 1. Clone repository

```bash
git clone https://github.com/your-username/Project-Management.git
cd Project-Management
```

#### 2. Cài đặt Backend / Setup Backend

```bash
cd backend
npm install
```

Tạo file `.env` từ mẫu / Create `.env` from template:

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://your-user:your-password@cluster.mongodb.net/TaskManager_DB
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key
SEND_GRID_API=SG.your-sendgrid-api-key
FROM_EMAIL=your-email@example.com
ARCJET_ENV=development
ARCJET_KEY=ajkey_your-arcjet-key
```

Khởi động backend / Start backend:

```bash
npm run dev       # Development (nodemon)
# hoặc / or
npm start         # Production
```

Backend chạy tại / Backend runs at: `http://localhost:5000`

#### 3. Cài đặt Frontend / Setup Frontend

```bash
cd ../frontend
npm install
```

Tạo file `.env` / Create `.env`:

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:

```env
VITE_API_URL=http://localhost:5000/api-v1
```

Khởi động frontend / Start frontend:

```bash
npm run dev       # Development server
# hoặc / or
npm run build     # Production build
npm start         # Production server (SSR)
```

Frontend chạy tại / Frontend runs at: `http://localhost:5173`

---

### 🧪 4. Kiểm tra build & test / Verify build & test

**Backend:**

```bash
cd backend
npm run lint        # ESLint
npm test            # Jest with coverage
npm start           # Start server
```

**Frontend:**

```bash
cd frontend
npm run lint        # ESLint
npm test            # Vitest
npm run typecheck   # TypeScript type checking
npm run build       # Production build
```

**Docker:**

```bash
# Build images locally
docker build -t taskmanager-be:test ./backend
docker build -t taskmanager-fe:test --build-arg VITE_API_URL=http://localhost:5000/api-v1 ./frontend

# Check image sizes
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

---

## 🧪 Testing

| | Backend | Frontend |
|---|---------|----------|
| **Framework** | Jest | Vitest |
| **Config** | `backend/jest.config.mjs` | `frontend/vitest.config.ts` |
| **Tests** | `backend/__tests__/` | `frontend/app/components/__tests__/` |
| **Run** | `npm test` | `npm test` |
| **Coverage** | `backend/coverage/` | Console output |

Backend hiện có test cho health check và module setup. Frontend có test cho các UI components.

---

## 📡 API Endpoints

Tất cả API đều có prefix `/api-v1`. / All APIs are prefixed with `/api-v1`.

### Auth (`/api-v1/auth`)
| Method | Endpoint | Mô tả / Description |
|--------|----------|---------------------|
| POST | `/register` | Đăng ký tài khoản + gửi email xác thực / Register + send verification email |
| POST | `/login` | Đăng nhập / Login |
| POST | `/verify-email` | Xác thực email / Verify email |
| POST | `/reset-password-request` | Yêu cầu reset mật khẩu / Request password reset |
| POST | `/reset-password` | Reset mật khẩu / Reset password |

### Users (`/api-v1/users`) — Yêu cầu xác thực / Auth required
| Method | Endpoint | Mô tả / Description |
|--------|----------|---------------------|
| GET | `/profile` | Lấy thông tin profile / Get profile |
| PUT | `/profile` | Cập nhật profile / Update profile |
| PUT | `/change-password` | Đổi mật khẩu / Change password |

### Workspaces (`/api-v1/workspaces`) — Auth required
| Method | Endpoint | Mô tả / Description |
|--------|----------|---------------------|
| POST | `/` | Tạo workspace / Create workspace |
| GET | `/` | Danh sách workspace / List workspaces |
| GET | `/:workspaceId` | Chi tiết workspace / Workspace details |
| GET | `/:workspaceId/stats` | Thống kê dashboard / Dashboard stats |
| PUT | `/:workspaceId` | Cập nhật workspace / Update workspace |
| DELETE | `/:workspaceId` | Xóa workspace / Delete workspace |
| POST | `/:workspaceId/invite-member` | Mời thành viên / Invite member |
| POST | `/accept-invite-token` | Chấp nhận lời mời / Accept invite |

### Projects (`/api-v1/projects`) — Auth required
| Method | Endpoint | Mô tả / Description |
|--------|----------|---------------------|
| POST | `/:workspaceId/create-project` | Tạo dự án / Create project |
| GET | `/:projectId` | Chi tiết dự án / Project details |
| PUT | `/:projectId` | Cập nhật dự án / Update project |
| DELETE | `/:projectId` | Xóa dự án / Delete project |

### Tasks (`/api-v1/tasks`) — Auth required
| Method | Endpoint | Mô tả / Description |
|--------|----------|---------------------|
| POST | `/:projectId` | Tạo task / Create task |
| GET | `/my-tasks` | Task của tôi / My tasks |
| GET | `/project/:projectId` | Task trong dự án / Project tasks |
| GET | `/:taskId` | Chi tiết task / Task details |
| PUT | `/:taskId` | Cập nhật task / Update task |
| PUT | `/:taskId/status` | Cập nhật trạng thái / Update status |
| PUT | `/:taskId/priority` | Cập nhật ưu tiên / Update priority |
| PUT | `/:taskId/assignees` | Cập nhật người phụ trách / Update assignees |
| POST | `/:taskId/watch` | Theo dõi / bỏ theo dõi / Toggle watch |
| POST | `/:taskId/archive` | Lưu trữ / bỏ lưu trữ / Toggle archive |
| POST | `/:taskId/add-subtask` | Thêm subtask / Add subtask |
| PUT | `/:taskId/update-subtask/:subTaskId` | Cập nhật subtask / Update subtask |
| GET | `/:resourceId/activity` | Lịch sử hoạt động / Activity logs |
| POST | `/:taskId/comments` | Thêm bình luận / Add comment |
| GET | `/:taskId/comments` | Danh sách bình luận / Get comments |
| DELETE | `/comments/:commentId` | Xóa bình luận / Delete comment |

### Metrics
| Method | Endpoint | Mô tả / Description |
|--------|----------|---------------------|
| GET | `/metrics` | Prometheus metrics (request count, latency, memory, event loop lag) |

---

## 🗄️ Database Schema (MongoDB / Mongoose)

### User
```javascript
{
  email: String (unique, required),
  password: String (hashed, select: false),
  name: String (required),
  profilePicture: String,
  isEmailVerified: Boolean (default: false),
  lastLogin: Date,
  is2FAEnabled: Boolean (default: false)
}
```

### Workspace
```javascript
{
  name: String,
  description: String,
  color: String,
  owner: ObjectId -> User,
  members: [
    { user: ObjectId -> User, role: String (owner|admin|member|viewer), joinedAt: Date }
  ],
  projects: [ObjectId -> Project]
}
```

### Project
```javascript
{
  title: String,
  description: String,
  workspace: ObjectId -> Workspace,
  status: String (Planning|In Progress|On Hold|Completed|Cancelled),
  startDate: Date,
  dueDate: Date,
  progress: Number (0-100),
  tasks: [ObjectId -> Task],
  members: [
    { user: ObjectId -> User, role: String (manager|contributor|viewer) }
  ],
  tags: [String],
  isArchived: Boolean
}
```

### Task
```javascript
{
  title: String,
  description: String,
  status: String (To Do|In Progress|Done),
  priority: String (Low|Medium|High),
  dueDate: Date,
  project: ObjectId -> Project,
  assignees: [ObjectId -> User],
  subtasks: [{ title: String, completed: Boolean }],
  watchers: [ObjectId -> User],
  isArchived: Boolean
}
```

### Comment
```javascript
{
  task: ObjectId -> Task,
  author: ObjectId -> User,
  text: String
}
```

### ActivityLog
```javascript
{
  user: ObjectId -> User,
  action: String (enum: 16 actions),
  resourceType: String (Task|Project|Workspace|Comment|User),
  resourceId: String,
  details: Object,
  createdAt: Date
}
```

### Verification
```javascript
{
  userId: ObjectId -> User,
  token: String,
  expiresAt: Date
}
```

### WorkspaceInvite
```javascript
{
  user: ObjectId -> User,
  workspaceId: ObjectId -> Workspace,
  token: String,
  role: String,
  expiresAt: Date
}
```

---

## 🔐 Authentication Flow

1. **Đăng ký / Register**
   - Người dùng nhập name, email, password
   - Arcjet kiểm tra email hợp lệ (chặn email rác / disposable)
   - Mật khẩu được hash bằng bcrypt
   - Tạo JWT verification token (hạn 1 giờ)
   - Gửi email xác thực qua SendGrid

2. **Xác thực email / Verify Email**
   - Người dùng click link trong email
   - Frontend gọi API verify với token
   - Backend xác nhận token và cập nhật `isEmailVerified: true`

3. **Đăng nhập / Login**
   - Nếu email chưa xác thực → tự động gửi lại email xác thực
   - Nếu đã xác thực → bcrypt so sánh mật khẩu
   - Tạo JWT token (hạn 7 ngày)
   - Lưu token và user info vào localStorage

4. **Request có xác thực / Authenticated Requests**
   - Frontend gắn header `Authorization: Bearer <token>`
   - Backend middleware verify JWT, gán `req.user`
   - Khi nhận 401 → frontend tự động logout và redirect

5. **Quên mật khẩu / Forgot Password**
   - Gửi yêu cầu → nhận email chứa token (hạn 15 phút)
   - Click link → nhập mật khẩu mới

---

## 🔄 DevOps Workflow / Quy trình DevOps

Dưới đây là toàn bộ quy trình DevOps của TaskManager — từ lúc developer sửa code local cho đến khi ứng dụng được triển khai production và giám sát liên tục.

> Below is the complete TaskManager DevOps workflow — from local development all the way to production deployment and continuous monitoring.

```mermaid
flowchart TD
    A["👨‍💻 Developer sửa code / Code locally"] --> B["📝 Commit & Push to GitHub"]
    B --> C["⚡ GitHub Actions Trigger"]
    C --> D["🔍 Lint Backend & Frontend"]
    D --> E["🧪 Run Tests"]
    E --> F["🔐 Security Scan<br/>SonarCloud + Trivy"]
    F --> G{"✅ PASS?"}
    G -->|No / Không| H["❌ Pipeline Failed<br/>Block & Notify"]
    G -->|Yes / Có| I["🐳 Build Docker Images"]
    I --> J["📦 Push to GHCR"]
    J --> K["🚀 Railway Auto-Deploy"]
    K --> L["🌐 Cloudflare DNS<br/>taskmanager.qzz.io"]
    L --> M["📊 Monitoring & Alerting<br/>Prometheus / Grafana / Uptime Kuma"]
```

### Giải thích nhanh / Quick explanation

| Bước / Step | Mô tả / Description |
|-------------|---------------------|
| **1. Local Dev** | Developer chạy code local bằng Docker Compose hoặc manual setup / Developer runs code locally with Docker Compose or manual setup |
| **2. Git Push** | Push lên `main`, `develop` hoặc tạo PR / Push to branches or open PR |
| **3. CI Pipeline** | GitHub Actions chạy lint, test, security scan / GitHub Actions runs lint, test, and security scan |
| **4. Build & Push** | Nếu PASS → build Docker image và push lên GHCR / If passed, build Docker images and push to GHCR |
| **5. CD / Deploy** | Railway tự động deploy từ code/image mới / Railway auto-deploys from the latest code/image |
| **6. DNS** | Cloudflare DNS được quản lý bằng Terraform / Cloudflare DNS managed by Terraform |
| **7. Monitoring** | Theo dõi uptime, metrics, logs qua Uptime Kuma, Prometheus, Grafana / Monitor uptime, metrics, and logs |

---

## 🔄 CI/CD Pipeline

Pipeline chạy tự động trên GitHub Actions mỗi khi push lên `main`/`develop` hoặc tạo PR vào `main`.

| Job | Mô tả |
|-----|-------|
| `lint-backend` | ESLint backend |
| `lint-frontend` | ESLint frontend |
| `test-backend` | Jest + coverage upload |
| `test-frontend` | Vitest |
| `sonarcloud` | Code quality scan |
| `build-and-push` | Build Docker images → push GHCR |
| `trivy-scan` | CVE scan images |

Images được push lên: `ghcr.io/dinhkhachoang3009/taskmanager-be` và `ghcr.io/dinhkhachoang3009/taskmanager-fe`

---

## 📊 Monitoring & Observability

### Winston Logging
Backend sử dụng Winston để ghi log JSON có cấu trúc:
```json
{"level":"info","message":"Server is running on port 5000","timestamp":"2026-06-23T10:00:00.000Z"}
```
- Tự động log unhandled errors
- Log levels: `info`, `warn`, `error`

### Prometheus Metrics
Endpoint `/metrics` cung cấp các metric:
- `http_requests_total` — Số request
- `http_request_duration_seconds` — Latency histogram
- `process_resident_memory_bytes` — Memory usage
- `nodejs_eventloop_lag_seconds` — Event loop lag

### Grafana Dashboard
- URL: http://localhost:3002 (khi chạy Docker Compose)
- Login: `admin` / `admin`
- Data Source: Prometheus (`http://prometheus:9090`)

Ví dụ PromQL queries:
```promql
rate(http_requests_total[1m])                                    # Request rate
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))  # P95 latency
process_resident_memory_bytes                                    # Memory usage
```

### Uptime Kuma
Dùng để ping API liên tục và nhận alert khi service down.

---

## 🌍 Deployment

### Railway (Production)
Dự án được triển khai trên **Railway** sử dụng **Dockerfile** (auto-detect).

- **Frontend:** `https://taskmanager.qzz.io`
- **Backend API:** `https://api.taskmanager.qzz.io`

### Infrastructure as Code (Terraform)
DNS records trên Cloudflare được quản lý bằng Terraform trong thư mục `infrastructure/`.

```bash
cd infrastructure
$env:CLOUDFLARE_API_TOKEN = "your-token"
terraform init
terraform plan
terraform apply
```

---

## 📝 Biến Môi Trường / Environment Variables

### Backend Local (`backend/.env`)
| Biến | Mô tả |
|------|-------|
| `PORT` | Port server (default: 5000) |
| `MONGO_URI` | Chuỗi kết nối MongoDB |
| `JWT_SECRET` | Secret key để sign JWT |
| `FRONTEND_URL` | URL frontend (dùng cho CORS và link email) |
| `SEND_GRID_API` | API key SendGrid |
| `FROM_EMAIL` | Email gửi đi |
| `ARCJET_KEY` | API key Arcjet |
| `ARCJET_ENV` | Môi trường Arcjet (development / production) |

### Backend Docker (`backend/.env.docker`)
| Biến | Mô tả |
|------|-------|
| `PORT` | 5000 |
| `MONGO_URI` | `mongodb://mongo:27017/taskmanager` (Docker network) |
| `FRONTEND_URL` | `http://localhost:3000` |
| `JWT_SECRET` | Your secret |
| `SEND_GRID_API` | Your SendGrid key |
| `FROM_EMAIL` | Your email |
| `ARCJET_KEY` | Your Arcjet key |
| `ARCJET_ENV` | development |

### Frontend Local (`frontend/.env`)
| Biến | Mô tả |
|------|-------|
| `VITE_API_URL` | URL backend API (e.g., `http://localhost:5000/api-v1`) |

### Frontend Docker (`frontend/.env.docker`)
| Biến | Mô tả |
|------|-------|
| `VITE_API_URL` | URL backend API (e.g., `http://localhost:5000/api-v1`) |

---

## 📄 License

MIT License

---

<p align="center">
  <strong>TaskManager</strong> — Built with ❤️ for efficient teamwork.
</p>
