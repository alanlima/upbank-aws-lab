output "cognito_user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.this.id
}

output "cognito_app_client_id" {
  description = "The ID of the Cognito User Pool client for SPA application"
  value       = aws_cognito_user_pool_client.spa.id
}

output "cognito_domain_url" {
  description = "The full URL of the Cognito hosted UI domain"
  value       = local.use_cognito_domain_prefix ? "https://${aws_cognito_user_pool_domain.this[0].domain}.auth.${var.aws_region}.amazoncognito.com" : ""
}

output "appsync_api_id" {
  description = "The ID of the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.this.id
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB table for token registry"
  value       = aws_dynamodb_table.token_registry.name
}

output "appsync_graphql_url_all" {
  description = "The AppSync GraphQL API endpoint URLs"
  value = {
    for k, v in aws_appsync_graphql_api.this.uris :
    k => v
  }
}