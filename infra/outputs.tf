output "instance_public_ip" {
  description = "Public IP address of the Vocis EC2 instance"
  value       = aws_instance.vocis.public_ip
}

output "instance_id" {
  description = "ID of the Vocis EC2 instance"
  value       = aws_instance.vocis.id
}
