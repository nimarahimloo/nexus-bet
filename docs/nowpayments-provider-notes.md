# NOWPayments provider decision

## Scope
Nexus Bet will use NOWPayments as the candidate payment provider for the first production integration, with USDT on BNB Smart Chain represented by the provider currency code `USDTBSC`. USDT remains the product base asset, while the existing asset catalog remains extensible.

## Verified provider capabilities

The official NOWPayments USDT BSC page states that USDT BSC payments are supported, that the service provides API, invoice and payment tools, and that mass payouts are available for payouts. It also states that merchants configure a wallet and API key in the provider dashboard, and that legality depends on the merchant jurisdiction.

Source: https://nowpayments.io/supported-coins/usdtbsc-payments

## Architecture decision

Use server-side provider calls only. Never expose the API key to the browser. A deposit flow will create an invoice/payment with a stable internal reference and persist the provider identifier before the user is shown payment instructions. A provider callback must be authenticated, deduplicated by provider event/payment ID, and mapped through a strict status transition table. Credits happen only after a confirmed provider status and matching currency/network/amount rules. Withdrawals remain pending until provider acceptance and final status; rejected or failed withdrawals release the locked amount exactly once.

The provider's account/KYB status, jurisdiction availability, payout permissions, minimums, fees, webhook/IPN signing details and exact API schema must be verified with the account's current documentation and sandbox before production secrets are enabled. No real funds should be moved from the development environment.

## Required user configuration

The project needs a NOWPayments API key, a webhook/IPN secret or verification configuration as specified by the provider account, and a merchant payout wallet configured for BNB Smart Chain. A sandbox/test key is preferred for initial smoke testing. Production activation requires the user to complete the provider's own account, KYB/KYC and compliance setup.

## Current implementation status

The project is currently in **provider-disabled mode** because the user deferred entering credentials. The wallet and admin UI expose this readiness state, and both deposit and withdrawal mutations are rejected server-side with `SERVICE_UNAVAILABLE` until all required values are present. This is intentional: the system does not create pending financial records merely because a user clicked a button.

## Activation sequence after credentials are supplied

1. Add the sandbox API key, IPN secret and BEP20 payout wallet through the secure project secrets flow.
2. Run the lightweight `/v1/status` smoke check and verify the provider account has payout permission.
3. Configure the provider callback URL as `/api/payments/nowpayments/ipn` and test a signed sandbox event.
4. Wire the invoice response to the deposit UI and persist the provider payment identifier before displaying payment instructions.
5. Map only confirmed provider statuses to the atomic settlement helper; failed or rejected withdrawals release locked balance exactly once.
6. Perform a small sandbox end-to-end test before any production key is enabled.
