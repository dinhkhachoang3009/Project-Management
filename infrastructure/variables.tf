variable "zone_id" {
  description = "Cloudflare Zone ID cho domain taskmanager.qzz.io"
  type        = string
  # TODO: Điền Zone ID vào đây sau khi lấy từ Cloudflare Dashboard
  default     = "78e6264d82b83924d5c3263622dbffdf"
}

variable "api_target" {
  description = "Target CNAME cho api.taskmanager.qzz.io"
  type        = string
  default     = "pb4bzq5y.up.railway.app"
}

variable "root_record_type" {
  description = "Loại record cho root domain (A hoặc CNAME)"
  type        = string
  default     = "CNAME"
}

variable "root_record_value" {
  description = "Giá trị record cho root domain"
  type        = string
  default     = "4r70i6pm.up.railway.app"
}
