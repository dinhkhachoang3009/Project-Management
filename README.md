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
| 2 | **Quản lý thành viên** — Mởi thành viên qua email, phân quyền Owner / Admin / Member / Viewer | Invite members via email with role-based access: Owner, Admin, Member, Viewer |
| 3 | **Dự án (Project)** — Tạo dự án trong workspace với trạng thái, tiến độ, ngày bắt đầu & hạn chót | Create projects with status, progress, start date & due date |
| 4 | **Công việc (Task)** — Tạo task với trạng thái (To Do / In Progress / Done), mức độ ưu tiên (High / Medium / Low), ngườiphụ trách | Create tasks with status, priority, assignees, and due dates |
| 5 | **Subtask** — Chia nhỏ task thành các subtask có thể đánh dấu hoàn thành | Break tasks into subtasks with completion toggles |
| 6 | **Bình luận** — Thảo luận trực tiếp trên từng task | Comment directly on tasks |
| 7 | **Theo dõi (Watch)** — Theo dõi task để nhận cập nhật | Watch tasks to receive updates |
| 8 | **Lưu trữ (Archive)** — Lưu trữ task/dự án thay vì xóa vĩnh viễn | Archive tasks/projects instead of permanent deletion |
| 9 | **Dashboard & Biểu đồ** — Thống kê task trends, project status, task priority, workspace productivity | Dashboard with task trends, project status, priority, and productivity charts |
| 10 | **Xác thực Email** — Đăng ký tài khoản yêu cầu xác thực email qua SendGrid | Email verification required for registration via SendGrid |
| 11 | **Quên mật khẩu** — Gửi email reset password với token có hạn 15 phút | Forgot password flow with 15-minute reset token |
| 12 | **Bảo mật** — Tích hợp Arcjet chống bot, rate limiting, validate email | Arcjet integration for bot detection, rate limiting, and email validation |

---

## 🛠️ Công Nghệ / Tech Stack

### Backend
| Công nghệ | Mục đích |
|-----------|----------|
| Node.js + Express | Web server |
| MongoDB + Mongoose | Database |
| JWT | Authentication tokens |
| bcrypt | Password hashing |
| Zod + zod-express-middleware | Schema validation |
| SendGrid | Transactional emails |
| Arcjet | Security (bot detection, rate limiting) |
| Morgan | HTTP logging |
| CORS | Cross-origin requests |

### Frontend
| Công nghệ | Mục đích |
|-----------|----------|
| React 19 | UI library |
| React Router 7 | Routing + SSR |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Vite | Build tool |
| TanStack Query | Server state management |
| Axios | HTTP client |
| React Hook Form + Zod | Form handling & validation |
| Recharts | Charts & visualization |
| shadcn/ui + Radix UI | UI components |
| Sonner | Toast notifications |
| date-fns | Date formatting |

---

## 📁 Cấu Trúc Dự Án / Project Structure

```
Project-Management/
├── .gitignore
├── backend/                        # Backend (Node.js + Express)
│   ├── index.js                    # Express server entry point
│   ├── .env.example                # Environment variables template
│   ├── railway.toml                # Railway deployment config
│   ├── package.json
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
│   └── libs/
│       ├── index.js                # Activity recording helper
│       ├── send-email.js           # SendGrid wrapper
│       ├── arcjet.js               # Arcjet security config
│       └── validate-schema.js      # Zod schemas
│
├── frontend/                       # Frontend (React Router + Vite)
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
│   │   └── types/
│   │       └── index.ts            # TypeScript interfaces
│   ├── public/
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── react-router.config.ts
│   ├── railway.toml
│   └── package.json
```

---

## 🚀 Cài Đặt & Chạy Local / Setup & Run Locally

### Yêu cầu hệ thống / Prerequisites
- **Node.js** >= 20.0.0
- **MongoDB** (local hoặc MongoDB Atlas)
- **SendGrid account** (để gửi email xác thực / for sending verification emails)
- **Arcjet account** (bảo mật / for security)

### 1. Clone repository

```bash
git clone https://github.com/your-username/Project-Management.git
cd Project-Management
```

### 2. Cài đặt Backend / Setup Backend

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

### 3. Cài đặt Frontend / Setup Frontend

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

### 4. Kiểm tra build / Verify build

```bash
# Frontend
cd frontend
npm run typecheck   # TypeScript type checking
npm run build       # Production build

# Backend (no build step needed)
cd backend
node index.js       # or npm start
```

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
| PUT | `/:taskId/assignees` | Cập nhật ngườiphụ trách / Update assignees |
| POST | `/:taskId/watch` | Theo dõi / bỏ theo dõi / Toggle watch |
| POST | `/:taskId/archive` | Lưu trữ / bỏ lưu trữ / Toggle archive |
| POST | `/:taskId/add-subtask` | Thêm subtask / Add subtask |
| PUT | `/:taskId/update-subtask/:subTaskId` | Cập nhật subtask / Update subtask |
| GET | `/:resourceId/activity` | Lịch sử hoạt động / Activity logs |
| POST | `/:taskId/comments` | Thêm bình luận / Add comment |
| GET | `/:taskId/comments` | Danh sách bình luận / Get comments |
| DELETE | `/comments/:commentId` | Xóa bình luận / Delete comment |

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
   - Ngườidùng nhập name, email, password
   - Arcjet kiểm tra email hợp lệ (chặn email rác / disposable)
   - Mật khẩu được hash bằng bcrypt
   - Tạo JWT verification token (hạn 1 giờ)
   - Gửi email xác thực qua SendGrid

2. **Xác thực email / Verify Email**
   - Ngườidùng click link trong email
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

## 🌍 Deployment

Dự án được cấu hình deploy trên **Railway** thông qua file `railway.toml`.

**Backend:**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

**Frontend:**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
```

- Backend chạy trên port `process.env.PORT || 5000`
- Frontend chạy SSR với `react-router-serve`
- Cả hai đều sử dụng **Nixpacks** builder

---

## 📝 Biến Môi Trường / Environment Variables

### Backend (`backend/.env`)
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

### Frontend (`frontend/.env`)
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
