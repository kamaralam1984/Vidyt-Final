#!/bin/bash

###############################################################################
# Cloudflare Setup & Validation Script for ViralBoost AI
# 
# This script helps validate and test your Cloudflare configuration.
# 
# Usage: bash scripts/cloudflare-setup.sh
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${CLOUDFLARE_DOMAIN:-viralboost.app}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
ZONE_ID="${CLOUDFLARE_ZONE_ID:-}"
EMAIL="${CLOUDFLARE_EMAIL:-}"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

check_requirements() {
  print_header "Checking Requirements"
  
  # Check curl
  if ! command -v curl &> /dev/null; then
    print_error "curl not found. Please install curl."
    exit 1
  fi
  print_success "curl found"
  
  # Check jq (JSON processor)
  if ! command -v jq &> /dev/null; then
    print_warning "jq not found. Some features won't work without it."
    echo "Install with: apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
  else
    print_success "jq found"
  fi
  
  # Check environment variables
  if [ -z "$API_TOKEN" ]; then
    print_error "CLOUDFLARE_API_TOKEN not set"
    print_info "Set it with: export CLOUDFLARE_API_TOKEN='your_token'"
    exit 1
  fi
  print_success "CLOUDFLARE_API_TOKEN is set"
  
  if [ -z "$ZONE_ID" ]; then
    print_error "CLOUDFLARE_ZONE_ID not set"
    print_info "Get your Zone ID from: https://dash.cloudflare.com/"
    exit 1
  fi
  print_success "CLOUDFLARE_ZONE_ID is set"
}

test_api_connection() {
  print_header "Testing Cloudflare API Connection"
  
  print_info "Testing API token validity..."
  
  RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -w "\n%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    print_success "API connection successful"
    
    # Extract email if jq available
    if command -v jq &> /dev/null; then
      ACCOUNT_EMAIL=$(echo "$BODY" | jq -r '.result.email // "unknown"')
      print_info "Authenticated as: $ACCOUNT_EMAIL"
    fi
  else
    print_error "API connection failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
    exit 1
  fi
}

test_dns_propagation() {
  print_header "Testing DNS Propagation"
  
  print_info "Checking DNS for domain: $DOMAIN"
  
  # Test with nslookup
  if command -v nslookup &> /dev/null; then
    RESULT=$(nslookup $DOMAIN 8.8.8.8 2>/dev/null | grep -i cloudflare || echo "")
    if [ -z "$RESULT" ]; then
      print_warning "Domain may not be using Cloudflare nameservers yet"
      print_info "Run: nslookup $DOMAIN"
    else
      print_success "Domain is using Cloudflare"
    fi
  fi
  
  # Get zone info from API
  print_info "Retrieving zone information..."
  
  ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json")
  
  if command -v jq &> /dev/null; then
    STATUS=$(echo "$ZONE_RESPONSE" | jq -r '.result.status // "unknown"' 2>/dev/null)
    NAME=$(echo "$ZONE_RESPONSE" | jq -r '.result.name // "unknown"' 2>/dev/null)
    PLAN=$(echo "$ZONE_RESPONSE" | jq -r '.result.plan.name // "unknown"' 2>/dev/null)
    
    print_success "Zone Name: $NAME"
    print_success "Zone Status: $STATUS"
    print_success "Plan: $PLAN"
  fi
}

test_ssl_configuration() {
  print_header "Testing SSL/TLS Configuration"
  
  print_info "Checking SSL certificate for: https://$DOMAIN"
  
  SSL_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -text 2>/dev/null || echo "")
  
  if [ -z "$SSL_INFO" ]; then
    print_warning "Could not retrieve SSL info (openssl may not be available)"
  else
    ISSUER=$(echo "$SSL_INFO" | grep "Issuer:" | cut -d'=' -f2- || echo "Unknown")
    EXPIRE=$(echo "$SSL_INFO" | grep "Not After" || echo "Unknown")
    
    if [[ $ISSUER == *"Cloudflare"* ]]; then
      print_success "SSL Certificate: Cloudflare (Universal SSL)"
      print_success "Certificate Info: $EXPIRE"
    else
      print_info "SSL Issuer: $ISSUER"
    fi
  fi
  
  # Get SSL mode from API
  SSL_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json")
  
  if command -v jq &> /dev/null; then
    SSL_MODE=$(echo "$SSL_RESPONSE" | jq -r '.result.value // "unknown"' 2>/dev/null)
    print_success "SSL Mode: $SSL_MODE"
  fi
}

test_waf_configuration() {
  print_header "Testing WAF Configuration"
  
  print_info "Checking WAF status..."
  
  WAF_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/firewall/waf/overrides" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json")
  
  if command -v jq &> /dev/null; then
    RULES_COUNT=$(echo "$WAF_RESPONSE" | jq '.result | length // 0' 2>/dev/null)
    print_success "WAF Overrides: $RULES_COUNT rules configured"
  fi
}

test_rate_limiting() {
  print_header "Testing Rate Limiting"
  
  print_info "Checking rate limit rules..."
  
  RATE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rate_limit" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json")
  
  if command -v jq &> /dev/null; then
    RULES_COUNT=$(echo "$RATE_RESPONSE" | jq '.result | length // 0' 2>/dev/null)
    print_success "Rate Limit Rules: $RULES_COUNT rules configured"
    
    # List rules
    echo "$RATE_RESPONSE" | jq -r '.result[] | "  - \(.description // "Unnamed") (\(.threshold) req/\(.period)s)"' 2>/dev/null || true
  fi
}

test_page_rules() {
  print_header "Testing Page Rules"
  
  print_info "Checking page rules..."
  
  RULES_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json")
  
  if command -v jq &> /dev/null; then
    RULES_COUNT=$(echo "$RULES_RESPONSE" | jq '.result | length // 0' 2>/dev/null)
    print_success "Page Rules: $RULES_COUNT rules configured"
  fi
}

test_http_headers() {
  print_header "Testing HTTP Security Headers"
  
  print_info "Fetching $DOMAIN and checking headers..."
  
  HEADERS=$(curl -s -I "https://$DOMAIN" -o /dev/null -w "%{http_code}")
  
  print_info "Checking for security headers:"
  
  # Test each header
  HEADER=$(curl -s -I "https://$DOMAIN" 2>/dev/null)
  
  if echo "$HEADER" | grep -q "X-Content-Type-Options"; then
    print_success "X-Content-Type-Options found"
  else
    print_warning "X-Content-Type-Options not found"
  fi
  
  if echo "$HEADER" | grep -q "X-Frame-Options"; then
    print_success "X-Frame-Options found"
  else
    print_warning "X-Frame-Options not found"
  fi
  
  if echo "$HEADER" | grep -q "Strict-Transport-Security"; then
    print_success "Strict-Transport-Security (HSTS) found"
  else
    print_warning "Strict-Transport-Security not found"
  fi
  
  if echo "$HEADER" | grep -q "Content-Security-Policy"; then
    print_success "Content-Security-Policy (CSP) found"
  else
    print_warning "Content-Security-Policy not found"
  fi
  
  if echo "$HEADER" | grep -q "CF-RAY"; then
    print_success "Request is going through Cloudflare (CF-RAY header present)"
  else
    print_warning "Request may not be going through Cloudflare"
  fi
}

test_performance() {
  print_header "Testing Performance"
  
  print_info "Testing response time and cache status..."
  
  # Make 3 requests to see cache behavior
  for i in {1..3}; do
    print_info "Request $i..."
    RESPONSE=$(curl -s -I "https://$DOMAIN/static/dummy.txt" 2>/dev/null || echo "")
    
    CACHE_STATUS=$(echo "$RESPONSE" | grep "CF-Cache-Status" | cut -d' ' -f2- || echo "UNKNOWN")
    TTFB=$(curl -s -w "%{time_total}\n" -o /dev/null "https://$DOMAIN" 2>/dev/null || echo "ERROR")
    
    print_info "  Cache Status: $CACHE_STATUS"
    print_info "  Response Time: ${TTFB}s"
  done
}

test_ddos_protection() {
  print_header "Testing DDoS Protection Status"
  
  print_info "Checking DDoS settings..."
  
  DDOS_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/advanced_ddos" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json")
  
  if command -v jq &> /dev/null; then
    STATUS=$(echo "$DDOS_RESPONSE" | jq -r '.result.value // "unknown"' 2>/dev/null)
    print_success "Advanced DDoS Protection: $STATUS"
  fi
}

test_injection_attacks() {
  print_header "Testing WAF Injection Protection"
  
  print_warning "Testing with encoded attack patterns (queries that should be blocked)..."
  
  print_info "Testing SQL Injection block..."
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/users?id=1'+OR+'1'='1" 2>/dev/null)
  if [ "$RESPONSE" = "403" ]; then
    print_success "SQL Injection blocked (403)"
  elif [ "$RESPONSE" = "429" ]; then
    print_success "SQL Injection rate limited (429)"
  else
    print_warning "SQL Injection test returned HTTP $RESPONSE (expected 403 or 429)"
  fi
  
  print_info "Testing XSS block..."
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/search?q=%3Cscript%3E" 2>/dev/null)
  if [ "$RESPONSE" = "403" ]; then
    print_success "XSS blocked (403)"
  elif [ "$RESPONSE" = "429" ]; then
    print_success "XSS rate limited (429)"
  else
    print_warning "XSS test returned HTTP $RESPONSE (expected 403 or 429)"
  fi
}

create_test_report() {
  print_header "Creating Test Report"
  
  REPORT_FILE="cloudflare-test-report-$(date +%Y%m%d-%H%M%S).txt"
  
  {
    echo "Cloudflare Configuration Test Report"
    echo "===================================="
    echo "Generated: $(date)"
    echo "Domain: $DOMAIN"
    echo "Zone ID: $ZONE_ID"
    echo ""
    echo "Configuration Summary:"
    echo "- API Token: ${API_TOKEN:0:20}...***"
    echo "- Zone Status: $STATUS"
    echo "- SSL Mode: $SSL_MODE"
    echo ""
    echo "All tests completed. Check console output above for details."
  } > "$REPORT_FILE"
  
  print_success "Report saved to: $REPORT_FILE"
}

###############################################################################
# Main Execution
###############################################################################

main() {
  print_header "Cloudflare Configuration Validator"
  print_info "Domain: $DOMAIN"
  print_info "Zone ID: $ZONE_ID"
  
  # Run tests
  check_requirements
  test_api_connection
  test_dns_propagation
  test_ssl_configuration
  test_waf_configuration
  test_rate_limiting
  test_page_rules
  test_http_headers
  test_performance
  test_ddos_protection
  test_injection_attacks
  
  # Summary
  print_header "Summary"
  print_success "Cloudflare configuration validation complete!"
  print_info "Next steps:"
  echo "  1. Review the results above"
  echo "  2. Check Cloudflare dashboard for detailed metrics"
  echo "  3. Monitor abuse logs: /admin/compliance/abuse-logs"
  echo "  4. Set up alerts in Cloudflare dashboard"
  echo "  5. Test performance improvements"
  
  create_test_report
}

# Run main function
main "$@"
