AUTH=$(echo -ne "$CRON_USERNAME:$CRON_PASSWORD" | base64)
API_URL=$(echo -ne "$BASE_URL:$SERVER_PORT/api/v1/exchange-rate")

curl \
  --header "Content-Type: application/json" \
  --header "Authorization: Basic $AUTH" \
  --request POST \
  $API_URL
