# --------------------------
# AppSync Datasources
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