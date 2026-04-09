variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "key_pair_name" {
  description = "SSH key pair name"
  type        = string
}

variable "eip_allocation_id" {
  description = "Pre-existing Elastic IP allocation ID"
  type        = string
}

variable "ssh_cidr_blocks" {
  description = "Allowed CIDR blocks for SSH access"
  type        = list(string)
}

variable "root_volume_size" {
  description = "Root EBS volume size in GB"
  type        = number
  default     = 20
}

variable "domain_name" {
  description = "Domain for Certbot TLS certificate"
  type        = string
}
