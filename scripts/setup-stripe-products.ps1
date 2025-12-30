param(
    [switch]$Live,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if ($Live -and -not $Force) {
    Write-Host "WARNING: Running in LIVE mode!" -ForegroundColor Red
    Write-Host "This will create products in your production Stripe account." -ForegroundColor Red
    $confirm = Read-Host "Are you sure you want to continue? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Aborted."
        exit 1
    }
}

Write-Host "`nCraftLocal Stripe Products Setup" -ForegroundColor Blue
Write-Host "========================================`n"

try {
    $null = & stripe --version 2>&1
    Write-Host "Stripe CLI is configured" -ForegroundColor Green
}
catch {
    Write-Host "Error: Stripe CLI is not installed." -ForegroundColor Red
    Write-Host "Install it from: https://stripe.com/docs/stripe-cli"
    exit 1
}

$stripeArgs = @()
if ($Live) {
    $stripeArgs += "--live"
}

$productIds = @{}
$priceIds = @{}

function Create-Product {
    param([string]$Name, [string]$Description, [string]$Key)
    
    Write-Host "Creating product: $Name" -ForegroundColor Cyan
    
    $cmdArgs = @("products", "create") + $stripeArgs + @(
        "--name=$Name",
        "--description=$Description",
        "-d", "metadata[platform]=craftlocal",
        "-d", "metadata[key]=$Key"
    )
    
    $result = & stripe $cmdArgs 2>&1 | Out-String
    
    if ($result -match '"id":\s*"(prod_[^"]+)"') {
        $productId = $matches[1]
        $script:productIds[$Key] = $productId
        Write-Host "  Created: $productId" -ForegroundColor Green
        return $productId
    }
    
    Write-Host "  Failed to create product" -ForegroundColor Red
    Write-Host $result
    throw "Failed to create product: $Name"
}

function Create-Price {
    param([string]$ProductId, [int]$Amount, [string]$Interval, [string]$Key, [string]$Nickname)
    
    Write-Host "Creating price: $Nickname" -ForegroundColor Cyan
    
    $cmdArgs = @("prices", "create") + $stripeArgs + @(
        "--product=$ProductId",
        "--currency=usd",
        "--unit-amount=$Amount",
        "--nickname=$Nickname",
        "-d", "metadata[key]=$Key"
    )
    
    if ($Interval -ne "one_time") {
        $cmdArgs += @("-d", "recurring[interval]=$Interval")
    }
    
    $result = & stripe $cmdArgs 2>&1 | Out-String
    
    if ($result -match '"id":\s*"(price_[^"]+)"') {
        $priceId = $matches[1]
        $script:priceIds[$Key] = $priceId
        Write-Host "  Created: $priceId" -ForegroundColor Green
        return $priceId
    }
    
    Write-Host "  Failed to create price" -ForegroundColor Red
    Write-Host $result
    throw "Failed to create price: $Nickname"
}

Write-Host "`nStep 1: Creating Products" -ForegroundColor Yellow
Write-Host "-------------------------"

$freeProductId = Create-Product -Name "CraftLocal Free" -Description "Free tier for CraftLocal marketplace - 5 listings, basic analytics" -Key "free"
$proProductId = Create-Product -Name "CraftLocal Pro" -Description "Professional seller plan - Unlimited listings, 3 featured slots, advanced analytics, priority support, custom branding" -Key "pro"
$premiumProductId = Create-Product -Name "CraftLocal Premium" -Description "Premium seller plan - Unlimited listings, 10 featured slots, advanced analytics, priority support, custom branding, API access" -Key "premium"

Write-Host "`nStep 2: Creating Prices" -ForegroundColor Yellow
Write-Host "-----------------------"

Create-Price -ProductId $freeProductId -Amount 0 -Interval "month" -Key "price_free" -Nickname "CraftLocal Free Monthly"
Create-Price -ProductId $proProductId -Amount 1999 -Interval "month" -Key "price_pro_monthly" -Nickname "CraftLocal Pro Monthly"
Create-Price -ProductId $proProductId -Amount 19999 -Interval "year" -Key "price_pro_yearly" -Nickname "CraftLocal Pro Yearly (Save 20%)"
Create-Price -ProductId $premiumProductId -Amount 4999 -Interval "month" -Key "price_premium_monthly" -Nickname "CraftLocal Premium Monthly"
Create-Price -ProductId $premiumProductId -Amount 49999 -Interval "year" -Key "price_premium_yearly" -Nickname "CraftLocal Premium Yearly (Save 20%)"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "SUCCESS! All products and prices created" -ForegroundColor Green
Write-Host "========================================`n"

Write-Host "Product IDs:"
Write-Host "------------"
foreach ($key in $productIds.Keys) {
    Write-Host "  $key = $($productIds[$key])"
}

Write-Host "`nPrice IDs:"
Write-Host "----------"
foreach ($key in $priceIds.Keys) {
    Write-Host "  $key = $($priceIds[$key])"
}

Write-Host "`nSQL to update your database:"
Write-Host "----------------------------"
@"
UPDATE public.plans SET stripe_price_id = '$($priceIds['price_free'])' WHERE stripe_price_id = 'price_free';
UPDATE public.plans SET stripe_price_id = '$($priceIds['price_pro_monthly'])' WHERE stripe_price_id = 'price_pro_monthly';
UPDATE public.plans SET stripe_price_id = '$($priceIds['price_pro_yearly'])' WHERE stripe_price_id = 'price_pro_yearly';
UPDATE public.plans SET stripe_price_id = '$($priceIds['price_premium_monthly'])' WHERE stripe_price_id = 'price_premium_monthly';
UPDATE public.plans SET stripe_price_id = '$($priceIds['price_premium_yearly'])' WHERE stripe_price_id = 'price_premium_yearly';
"@

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$mode = if ($Live) { "LIVE" } else { "TEST" }
$outputFile = "stripe-setup-output-$mode-$timestamp.txt"

$output = @"
CraftLocal Stripe Setup - $(Get-Date)
Mode: $mode

Product IDs:
"@
foreach ($key in $productIds.Keys) {
    $output += "`n  $key = $($productIds[$key])"
}
$output += "`n`nPrice IDs:"
foreach ($key in $priceIds.Keys) {
    $output += "`n  $key = $($priceIds[$key])"
}

$output | Out-File -FilePath $outputFile -Encoding UTF8
Write-Host "`nOutput saved to: $outputFile" -ForegroundColor Green

Write-Host "`nNext steps:"
Write-Host "1. Run the SQL statements above in Supabase"
Write-Host "2. Configure environment variables in Supabase and Cloudflare"
Write-Host "3. Set up Stripe webhook endpoint`n"
