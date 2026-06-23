# Root domain: taskmanager.qzz.io
resource "cloudflare_dns_record" "root" {
  zone_id = var.zone_id
  name    = "taskmanager.qzz.io"
  content = var.root_record_value
  type    = var.root_record_type
  ttl     = 300
  proxied = true
}

# API subdomain: api.taskmanager.qzz.io
resource "cloudflare_dns_record" "api" {
  zone_id = var.zone_id
  name    = "api.taskmanager.qzz.io"
  content = var.api_target
  type    = "CNAME"
  ttl     = 300
  proxied = true
}
