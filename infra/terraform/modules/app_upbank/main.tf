locals {
    name = "${var.name_prefix}-${var.environment}"

    schema_file = coalesce(var.schema_path, "${path.module}/schemas/schema.graphql")

    common_tags = merge(
        var.tags,
        {
            Name = local.name,
            Component = "application"
            Environment = var.environment
        }
    )
}

# --------------------------
# DynamoDB (token registry)
# --------------------------
resource "aws_dynamodb_table" "token_registry" {
    name         = "${local.name}-token-registry"
    billing_mode = var.dynamodb_billing_mode
    
    hash_key = "pk"
    range_key = "sk"

    attribute {
      name = "pk"
      type = "S"
    }

    attribute {
        name = "sk"
        type = "S"
    }

    tags = local.common_tags
}

# --------------------------
# Cognito User Pool
# --------------------------

resource "aws_cognito_user_pool" "this" {
  name = "${local.name}-user-pool"

  username_attributes = [ "email" ]
  auto_verified_attributes = [ "email" ]

  password_policy {
    minimum_length = 8
    require_lowercase = true
    require_numbers = true
    require_symbols = false
    require_uppercase = true
  }

  tags = local.common_tags
}

resource "aws_cognito_user_pool_client" "spa" {
    name = "${local.name}-spa-client" 
    user_pool_id = aws_cognito_user_pool.this.id

    generate_secret = false

    allowed_oauth_flows_user_pool_client = true
    allowed_oauth_flows = [ "code" ]
    allowed_oauth_scopes = var.oauth_scopes

    callback_urls = var.callback_urls
    logout_urls   = var.logout_urls

    supported_identity_providers = ["COGNITO"]

    explicit_auth_flows = [
        "ALLOW_REFRESH_TOKEN_AUTH",
        "ALLOW_USER_SRP_AUTH",
        "ALLOW_USER_PASSWORD_AUTH"
    ]
}

resource "aws_cognito_user_pool_domain" "this" {
  domain = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.this.id
}

# --------------------------
# AppSync GraphQL API
# --------------------------
# resource "aws_cloudwatch_log_group" "cognito" {
#   name = "/aws/cognito/${local.name}-access-logs"
#   retention_in_days = 30
#   tags = local.common_tags
# }

# resource "aws_cognito_log_delivery_configuration" "cognito" {
#   user_pool_id = aws_cognito_user_pool.this.id

#   log_configurations {
#     event_source = "userAuthEvents"
#     log_level    = "INFO"

#     cloud_watch_logs_configuration {
#       log_group_arn = aws_cloudwatch_log_group.cognito.arn
#     }
#   }

#   log_configurations {
#     event_source = "userNotification"
#     log_level    = "INFO"

#     cloud_watch_logs_configuration {
#       log_group_arn = aws_cloudwatch_log_group.cognito.arn
#     }
#   }
# }

resource "aws_appsync_graphql_api" "this" {
    name = "${local.name}-graphql-api"
    authentication_type = "AMAZON_COGNITO_USER_POOLS"

    user_pool_config {
        user_pool_id = aws_cognito_user_pool.this.id
        aws_region   = var.aws_region
        default_action = "ALLOW"
    }
    log_config {
      cloudwatch_logs_role_arn = aws_iam_role.appsync_role.arn
      field_log_level          = "ALL"
    }

    schema = file(local.schema_file)

    tags = local.common_tags
}

# --------------------------
# AppSync IAM Role for DynamoDB
# --------------------------
data "aws_iam_policy_document" "appsync_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["appsync.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "appsync_role" {
  name = "${local.name}-appsync-role"
  assume_role_policy = data.aws_iam_policy_document.appsync_assume_role.json
  tags = local.common_tags
}

data "aws_iam_policy_document" "appsync_dynamodb_policy" {
  statement {
    actions = [
        "dynamodb:GetItem",
        "dynamodb:PutItem"
    ]
    resources = [ aws_dynamodb_table.token_registry.arn]
  }
}

resource "aws_iam_role_policy" "appsync_dynamodb" {
    name = "${local.name}-appsync-dynamodb-policy"
    role = aws_iam_role.appsync_role.id
    policy = data.aws_iam_policy_document.appsync_dynamodb_policy.json
}

resource "aws_iam_role_policy_attachment" "appsync_log" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs"
  role = aws_iam_role.appsync_role.name
}

# --------------------------
# AppSync Datasource (DynamoDB)
# --------------------------
resource "aws_appsync_datasource" "dynamodb" {
    api_id = aws_appsync_graphql_api.this.id
    name   = "TokenRegistryTable"
    type   = "AMAZON_DYNAMODB"
    service_role_arn = aws_iam_role.appsync_role.arn

    dynamodb_config {
        table_name = aws_dynamodb_table.token_registry.name
        region = var.aws_region
    }  
}

# Create a None data source
resource "aws_appsync_datasource" "none" {
  api_id = aws_appsync_graphql_api.this.id
  name   = "NoneDataSource"
  type   = "NONE"
  
  description = "Local resolver data source for AppSync"
}

# --------------------------
# Resolvers (AppSync JS runtime)
# --------------------------
resource "aws_appsync_resolver" "me" {
  api_id = aws_appsync_graphql_api.this.id
  type = "Query"
  field = "me"
  data_source = aws_appsync_datasource.none.name

  runtime {
    name = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/Query.me.js")

  depends_on = [ aws_appsync_graphql_api.this ]
}

resource "aws_appsync_resolver" "get_token_registered" {
  api_id = aws_appsync_graphql_api.this.id
  type = "Query"
  field = "getTokenRegistered"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/Query.getTokenRegistered.js")
  
  depends_on = [ aws_appsync_graphql_api.this ]
}

resource "aws_appsync_resolver" "register_token" {
    api_id = aws_appsync_graphql_api.this.id
    type = "Mutation"
    field = "registerToken"
    data_source = aws_appsync_datasource.dynamodb.name
    
    runtime {
        name = "APPSYNC_JS"
        runtime_version = "1.0.0"
    }
    
    code = file("${path.module}/resolvers/Mutation.registerToken.js")
    
    depends_on = [ aws_appsync_graphql_api.this ]
}