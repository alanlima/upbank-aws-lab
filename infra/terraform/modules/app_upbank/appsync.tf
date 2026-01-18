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

resource "aws_appsync_datasource" "up_http" {
  api_id = aws_appsync_graphql_api.this.id
  name = "UpBankApi"
  type = "HTTP"

  http_config {
    # endpoint = "https://api.up.com.au/api/v1"
    endpoint = "https://api.up.com.au"
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
    
    depends_on = [ 
      aws_appsync_graphql_api.this
    ]
}

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

  depends_on = [ 
      aws_appsync_graphql_api.this
  ]
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
  
  depends_on = [ 
      aws_appsync_graphql_api.this
    ]
}

resource "aws_appsync_resolver" "accounts" {
  api_id = aws_appsync_graphql_api.this.id
  type = "Query"
  field = "accounts"
  kind = "PIPELINE"

  runtime {
    name = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/Query.accounts.js")

  pipeline_config {
    functions = [
      aws_appsync_function.get_token_from_ddb.function_id,
      aws_appsync_function.up_http_accounts.function_id
    ]
  }

  depends_on = [ 
      aws_appsync_graphql_api.this
    ]
}

resource "aws_appsync_resolver" "account_by_id" {
  api_id = aws_appsync_graphql_api.this.id
  type = "Query"
  field = "account"
  kind = "PIPELINE"

  runtime {
    name = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/Query.accountById.js")

  pipeline_config {
    functions = [
      aws_appsync_function.get_token_from_ddb.function_id,
      aws_appsync_function.up_http_account_by_id.function_id
    ]
  }

  depends_on = [ 
      aws_appsync_graphql_api.this
    ]
}


# --------------------------
# AppSync Function
# ------------------------
resource "aws_appsync_function" "up_http_accounts" {
  api_id = aws_appsync_graphql_api.this.id
  name = "UpHttpAccountsFunction"
  data_source = aws_appsync_datasource.up_http.name

  runtime {
    name = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/functions/UpHttpAccountsFunction.js")

  depends_on = [ aws_appsync_graphql_api.this ]
}

resource "aws_appsync_function" "up_http_account_by_id" {
  api_id = aws_appsync_graphql_api.this.id
  name = "UpHttpAccountByIdFunction"
  data_source = aws_appsync_datasource.up_http.name

  runtime {
    name = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/functions/UpHttpAccountByIdFunction.js")

  depends_on = [ aws_appsync_graphql_api.this ]
}

resource "aws_appsync_function" "get_token_from_ddb" {
  api_id = aws_appsync_graphql_api.this.id
  name = "GetTokenFromDynamoDbFunction"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/functions/GetTokenFromDynamoDbFunction.js")

  depends_on = [ aws_appsync_graphql_api.this ]
}