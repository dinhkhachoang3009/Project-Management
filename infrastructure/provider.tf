terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  required_version = ">= 1.5.0"
}

provider "cloudflare" {
  # Token được đọc từ biến môi trường CLOUDFLARE_API_TOKEN
  # Không hardcode vào file để bảo mật
}
