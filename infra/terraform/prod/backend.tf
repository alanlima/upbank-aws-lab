terraform {
  backend "s3" {
    bucket         = "aws-lab-upbank-terraform-state"
    key            = "env/prod/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "upbank-terraform-locks"
    encrypt        = true
  }
}