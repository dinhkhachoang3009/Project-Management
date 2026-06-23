# Infrastructure as Code — Cloudflare DNS

Thư mục này chứa cấu hình Terraform để quản lý DNS records trên Cloudflare cho domain `taskmanager.qzz.io`.

## Trạng thái

✅ **Đã hoàn thành setup.** 2 records đã được import vào Terraform state:
- `taskmanager.qzz.io` → CNAME → `4r70i6pm.up.railway.app`
- `api.taskmanager.qzz.io` → CNAME → `pb4bzq5y.up.railway.app`

## Yêu cầu

- Terraform CLI >= 1.5.0
- Cloudflare API Token (với quyền Zone:Edit)

## Setup

### 1. Cài Terraform (nếu chưa có)

**Windows:**
```powershell
choco install terraform
# hoặc tải từ https://developer.hashicorp.com/terraform/install
```

**Verify:**
```bash
terraform -v
```

### 2. Export API Token

**Windows PowerShell:**
```powershell
$env:CLOUDFLARE_API_TOKEN = "your-api-token-here"
```

**Linux/macOS/Git Bash:**
```bash
export CLOUDFLARE_API_TOKEN="your-api-token-here"
```

> **Lưu ý:** Không commit token vào Git!

## Các lệnh Terraform

```bash
# Khởi tạo provider
terraform init

# Xem thay đổi sẽ áp dụng (không thay đổi thật)
terraform plan

# Áp dụng thay đổi
terraform apply

# Xóa toàn bộ resource (cẩn thận!)
terraform destroy
```

## Files

| File | Mục đích |
|------|----------|
| `provider.tf` | Khai báo Cloudflare provider |
| `variables.tf` | Định nghĩa biến (zone_id, targets...) |
| `main.tf` | Định nghĩa DNS records |
| `.gitignore` | Loại trừ state files và token |

## Import existing records (nếu cần làm lại)

Nếu bạn muốn import lại từ đầu:

```bash
terraform import cloudflare_dns_record.root 78e6264d82b83924d5c3263622dbffdf/59e6730dc3917be6a52d00cc26850908
terraform import cloudflare_dns_record.api 78e6264d82b83924d5c3263622dbffdf/e60bfe95d964345fd609ab1dfc0458d8
```
