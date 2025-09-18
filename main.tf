provider "aws" {
  region = var.region
}

resource "aws_s3_bucket" "cms_config_bucket" {
  bucket = var.s3_bucket_name
}

resource "aws_s3_object" "cms_user_types" {
  bucket       = aws_s3_bucket.cms_config_bucket.id
  key          = "config/user-types.json"
  content      = jsonencode({
    "allowedUserTypes": ["admin", "user"]
  })
  content_type = "application/json"
  depends_on   = [aws_s3_bucket.cms_config_bucket]
}

resource "aws_s3_object" "cms_default_shortnames" {
  bucket       = aws_s3_bucket.cms_config_bucket.id
  key          = "config/default-shortnames.json"
  content      = jsonencode({
    "shortnames": []
  })
  content_type = "application/json"
  depends_on   = [aws_s3_bucket.cms_config_bucket]
}

resource "aws_iam_role" "cms_lambda_exec" {
  name = "${var.project_name}-lambda-exec-role-${var.cms_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service : "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "cms_lambda_data_access_policy" {
  name = "${var.project_name}-lambda-data-access-policy-${var.cms_suffix}"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.cms_config_bucket.arn,
          "${aws_s3_bucket.cms_config_bucket.arn}/*"
        ]
      },
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.cms_shortnames.arn,
          aws_dynamodb_table.cms_versions.arn,
          aws_dynamodb_table.cms_configurations.arn,
          aws_dynamodb_table.cms_users.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cms_lambda_data_access_attachment" {
  role       = aws_iam_role.cms_lambda_exec.name
  policy_arn = aws_iam_policy.cms_lambda_data_access_policy.arn
}

resource "aws_s3_bucket_lifecycle_configuration" "cms_config_files_lifecycle" {
  bucket = aws_s3_bucket.cms_config_bucket.id

  rule {
    id     = "ExpireOldFiles"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 30
    }
  }
}

module "lambda_layer" {
  source = "terraform-aws-modules/lambda/aws"

  create_layer = true

  layer_name          = "${var.project_name}-layer"
  description         = "Lambda layer utilities"
  runtime             = "nodejs18.x"
  
  create_package      = false
  local_existing_package = "${path.module}/builds/lambda-layer.zip"
}

module "cms_register_lambda" {
  source        = "terraform-aws-modules/lambda/aws"
  version       = "7.20.0"
  function_name = "cms-register-lambda"
  description   = "Register Lambda function"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  publish       = true
  source_path   = "./lambda/register_lambda"

  create_role = false
  lambda_role = aws_iam_role.cms_lambda_exec.arn

  environment_variables = {
    SECRET_KEY    = var.secret_key
    ADMIN_KEY     = var.admin_key
    CONFIG_BUCKET = aws_s3_bucket.cms_config_bucket.id
    USERS_TABLE   = aws_dynamodb_table.cms_users.name
  }

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "${module.aws_api_gateway.api_execution_arn}/*/*"
    }
  }

  layers = [module.lambda_layer.lambda_layer_arn]
}

module "cms_login_lambda" {
  source        = "terraform-aws-modules/lambda/aws"
  version       = "7.20.0"
  function_name = "cms-login-lambda"
  description   = "Login Lambda function"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  publish       = true
  source_path   = "./lambda/login_lambda"

  create_role = false
  lambda_role = aws_iam_role.cms_lambda_exec.arn

  environment_variables = {
    SECRET_KEY    = var.secret_key
    CONFIG_BUCKET = aws_s3_bucket.cms_config_bucket.id
    USERS_TABLE   = aws_dynamodb_table.cms_users.name
  }

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "${module.aws_api_gateway.api_execution_arn}/*/*"
    }
  }

  layers = [module.lambda_layer.lambda_layer_arn]
}

module "cms_shortname_lambda" {
  source        = "terraform-aws-modules/lambda/aws"
  version       = "7.20.0"
  function_name = "cms-shortname-lambda"
  description   = "Shortname Lambda function"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  publish       = true
  source_path   = "./lambda/shortname_lambda"

  create_role = false
  lambda_role = aws_iam_role.cms_lambda_exec.arn

  environment_variables = {
    SECRET_KEY          = var.secret_key
    CONFIG_BUCKET       = aws_s3_bucket.cms_config_bucket.id
    SHORTNAMES_TABLE    = aws_dynamodb_table.cms_shortnames.name
    VERSIONS_TABLE      = aws_dynamodb_table.cms_versions.name
    CONFIGURATIONS_TABLE = aws_dynamodb_table.cms_configurations.name
  }

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "${module.aws_api_gateway.api_execution_arn}/*/*"
    }
  }

  layers = [module.lambda_layer.lambda_layer_arn]
}

module "cms_version_lambda" {
  source        = "terraform-aws-modules/lambda/aws"
  version       = "7.20.0"
  function_name = "cms-version-lambda"
  description   = "Version Lambda function"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  publish       = true
  source_path   = "./lambda/version_lambda"

  create_role = false
  lambda_role = aws_iam_role.cms_lambda_exec.arn

  environment_variables = {
    SECRET_KEY          = var.secret_key
    CONFIG_BUCKET       = aws_s3_bucket.cms_config_bucket.id
    SHORTNAMES_TABLE    = aws_dynamodb_table.cms_shortnames.name
    VERSIONS_TABLE      = aws_dynamodb_table.cms_versions.name
    CONFIGURATIONS_TABLE = aws_dynamodb_table.cms_configurations.name
  }

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "${module.aws_api_gateway.api_execution_arn}/*/*"
    }
  }

  layers = [module.lambda_layer.lambda_layer_arn]
}

module "cms_configuration_lambda" {
  source        = "terraform-aws-modules/lambda/aws"
  version       = "7.20.0"
  function_name = "cms-configuration-lambda"
  description   = "Configuration Lambda function"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  publish       = true
  source_path   = "./lambda/configuration_lambda"

  create_role = false
  lambda_role = aws_iam_role.cms_lambda_exec.arn

  environment_variables = {
    SECRET_KEY          = var.secret_key
    CONFIG_BUCKET       = aws_s3_bucket.cms_config_bucket.id
    SHORTNAMES_TABLE    = aws_dynamodb_table.cms_shortnames.name
    VERSIONS_TABLE      = aws_dynamodb_table.cms_versions.name
    CONFIGURATIONS_TABLE = aws_dynamodb_table.cms_configurations.name
  }

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "${module.aws_api_gateway.api_execution_arn}/*/*"
    }
  }

  layers = [module.lambda_layer.lambda_layer_arn]
}

module "cms_frontend_app" {
  source = "cloudposse/amplify-app/aws"

  name = "${var.project_name}-frontend-app-${var.cms_suffix}"

  access_token = var.personal_access_token
  repository   = var.repository_url
  platform     = "WEB"

  iam_service_role_enabled = true
  iam_service_role_actions = [
    "logs:CreateLogStream",
    "logs:CreateLogGroup",
    "logs:DescribeLogGroups",
    "logs:PutLogEvents"
  ]

  environments = {
    main = {
      branch_name                 = "main"
      enable_auto_build           = true
      backend_enabled             = false
      enable_performance_mode     = true
      enable_pull_request_preview = false
      framework                   = "React"
      stage                       = "PRODUCTION"
    }
  }

  custom_rules = [
    {
      source = "/<*>"
      status = "404"
      target = "/index.html"
    }
  ]

  environment_variables = {
    VITE_APP_API_BASE_URL = "https://${module.aws_api_gateway.api_id}.execute-api.${var.region}.amazonaws.com/api"
  }
}

resource "aws_dynamodb_table" "cms_users" {
  name         = "${var.project_name}-users-${var.cms_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name               = "EmailIndex"
    hash_key           = "email"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }
}

resource "aws_dynamodb_table" "cms_shortnames" {
  name         = "${var.project_name}-shortnames-${var.cms_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "shortname"

  attribute {
    name = "shortname"
    type = "S"
  }

  attribute {
    name = "createdBy"
    type = "S"
  }

  global_secondary_index {
    name               = "CreatedByIndex"
    hash_key           = "createdBy"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }
}

resource "aws_dynamodb_table" "cms_versions" {
  name         = "${var.project_name}-versions-${var.cms_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "versionId"

  attribute {
    name = "versionId"
    type = "S"
  }

  attribute {
    name = "shortname"
    type = "S"
  }

  global_secondary_index {
    name               = "ShortnameIndex"
    hash_key           = "shortname"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }
}

resource "aws_dynamodb_table" "cms_configurations" {
  name         = "${var.project_name}-configurations-${var.cms_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "configId"

  attribute {
    name = "configId"
    type = "S"
  }

  attribute {
    name = "shortnameVersion"
    type = "S"
  }

  global_secondary_index {
    name               = "ShortnameVersionIndex"
    hash_key           = "shortnameVersion"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }
}

resource "aws_dynamodb_table" "cms_blacklist" {
  name         = "${var.project_name}-blacklist-${var.cms_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "token"

  attribute {
    name = "token"
    type = "S"
  }
}

module "aws_vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name               = "${var.project_name}-vpc-${var.cms_suffix}"
  cidr               = "10.0.0.0/16"
  azs                = ["eu-west-3a", "eu-west-3b"]
  private_subnets    = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets     = ["10.0.101.0/24", "10.0.102.0/24"]
  enable_nat_gateway = true
  enable_vpn_gateway = true

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}

module "aws_api_gateway" {
  source = "terraform-aws-modules/apigateway-v2/aws"

  name          = "${var.project_name}-http"
  description   = "HTTP API for CMS service"
  protocol_type = "HTTP"

  create_domain_name = false
  # domain_name        = "web.rennes-idnow.fr"
  # domain_name_certificate_arn = var.certificate_arn

  authorizers = {}

  cors_configuration = {
    allow_headers = var.org_cors_allow_headers
    allow_methods = var.org_cors_allow_methods
    allow_origins = var.org_cors_allow_origins
  }

  routes = {
    "POST /api/register" = {
      integration = {
        uri                    = module.cms_register_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        timeout_milliseconds   = 12000
        type                   = "AWS_PROXY"
      }
    },

    "POST /api/login" = {
      integration = {
        uri                    = module.cms_login_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "GET /api/shortnames" = {
      integration = {
        uri                    = module.cms_shortname_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "POST /api/shortnames" = {
      integration = {
        uri                    = module.cms_shortname_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "GET /api/shortnames/{shortname}" = {
      integration = {
        uri                    = module.cms_shortname_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "PUT /api/shortnames/{shortname}" = {
      integration = {
        uri                    = module.cms_shortname_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "DELETE /api/shortnames/{shortname}" = {
      integration = {
        uri                    = module.cms_shortname_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "GET /api/shortnames/{shortname}/versions" = {
      integration = {
        uri                    = module.cms_version_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "POST /api/shortnames/{shortname}/versions" = {
      integration = {
        uri                    = module.cms_version_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "GET /api/shortnames/{shortname}/versions/{version}" = {
      integration = {
        uri                    = module.cms_version_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "PUT /api/shortnames/{shortname}/versions/{version}" = {
      integration = {
        uri                    = module.cms_version_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "DELETE /api/shortnames/{shortname}/versions/{version}" = {
      integration = {
        uri                    = module.cms_version_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "GET /api/shortnames/{shortname}/versions/{version}/configurations" = {
      integration = {
        uri                    = module.cms_configuration_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "POST /api/shortnames/{shortname}/versions/{version}/configurations" = {
      integration = {
        uri                    = module.cms_configuration_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "GET /api/shortnames/{shortname}/versions/{version}/configurations/{configId}" = {
      integration = {
        uri                    = module.cms_configuration_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "PUT /api/shortnames/{shortname}/versions/{version}/configurations/{configId}" = {
      integration = {
        uri                    = module.cms_configuration_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    },

    "DELETE /api/shortnames/{shortname}/versions/{version}/configurations/{configId}" = {
      integration = {
        uri                    = module.cms_configuration_lambda.lambda_function_invoke_arn
        payload_format_version = "2.0"
        type                   = "AWS_PROXY"
      }
    }
  }

  tags = {
    Environment = "dev"
    Terraform   = "true"
  }
}

data "aws_caller_identity" "current" {}

resource "aws_iam_policy" "cms_lambda_logging_policy" {
  name = "${var.project_name}-lambda-logging-policy-${var.cms_suffix}"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        Effect   = "Allow",
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cms_lambda_logging_attachment" {
  role       = aws_iam_role.cms_lambda_exec.name
  policy_arn = aws_iam_policy.cms_lambda_logging_policy.arn
}
