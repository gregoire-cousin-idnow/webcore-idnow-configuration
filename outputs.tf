output "s3_bucket_name" {
  value = aws_s3_bucket.cms_config_bucket.id
}

output "api_gateway_url" {
  description = "The base URL for the API Gateway"
  value       = "https://${module.aws_api_gateway.api_id}.execute-api.${var.region}.amazonaws.com/api"
}

output "amplify_app_domain" {
  value = module.cms_frontend_app.default_domain
}
