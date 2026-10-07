import { Component, Dependency, TargetArchitectureLayer, ServiceBoundary } from '../types/architecture';

export const SAMPLE_COMPONENTS: Component[] = [
  // --- 25 TABLES ---
  {
    id: 'raw_customers_cdc',
    name: 'raw_customers_cdc',
    type: 'table',
    description: 'Change data capture stream of CRM accounts from Salesforce replication',
    layer: 'source',
    tags: ['crm', 'cdc', 'salesforce'],
    sourceCodeSnippet: 'CREATE TABLE raw_customers_cdc (\n  account_id VARCHAR(64),\n  payload JSONB,\n  cdc_op CHAR(1),\n  synced_at TIMESTAMP\n);'
  },
  {
    id: 'raw_orders_stream',
    name: 'raw_orders_stream',
    type: 'table',
    description: 'Real-time order payloads streamed from POS terminals and checkout service',
    layer: 'source',
    tags: ['pos', 'orders', 'kafka'],
    sourceCodeSnippet: 'CREATE TABLE raw_orders_stream (\n  order_id VARCHAR(40),\n  store_id INT,\n  total_amount NUMERIC(10,2),\n  items JSONB,\n  created_at TIMESTAMP\n);'
  },
  {
    id: 'raw_web_clickstream',
    name: 'raw_web_clickstream',
    type: 'table',
    description: 'Raw web pageview and event telemetry emitted by Segment / Snowplow',
    layer: 'source',
    tags: ['telemetry', 'web', 'events'],
    sourceCodeSnippet: 'CREATE TABLE raw_web_clickstream (\n  event_id UUID,\n  anonymous_id VARCHAR(64),\n  event_name VARCHAR(50),\n  properties JSONB,\n  timestamp BIGINT\n);'
  },
  {
    id: 'raw_payment_trans',
    name: 'raw_payment_trans',
    type: 'table',
    description: 'Webhook payloads from Stripe & Adyen payment gateways',
    layer: 'source',
    tags: ['payments', 'stripe', 'finance'],
    sourceCodeSnippet: 'CREATE TABLE raw_payment_trans (\n  txn_id VARCHAR(50),\n  gateway VARCHAR(20),\n  gross_amount NUMERIC(10,2),\n  fee NUMERIC(6,2),\n  settled_at TIMESTAMP\n);'
  },
  {
    id: 'raw_erp_inventory',
    name: 'raw_erp_inventory',
    type: 'table',
    description: 'Nightly CSV extracts from SAP ERP detailing warehouse bin allocations',
    layer: 'source',
    tags: ['sap', 'erp', 'inventory'],
    sourceCodeSnippet: 'CREATE TABLE raw_erp_inventory (\n  sku VARCHAR(30),\n  warehouse_code VARCHAR(10),\n  qty_on_hand INT,\n  reorder_threshold INT\n);'
  },
  {
    id: 'raw_support_tickets',
    name: 'raw_support_tickets',
    type: 'table',
    description: 'Zendesk customer support tickets ingested via REST API webhook',
    layer: 'source',
    tags: ['support', 'zendesk'],
    isUnusedCandidate: true,
    notes: 'No downstream ETL job or report queries this table. Orphan ingestion pipeline detected.',
    sourceCodeSnippet: 'CREATE TABLE raw_support_tickets (\n  ticket_id INT,\n  user_email VARCHAR(100),\n  status VARCHAR(20),\n  rating INT\n);'
  },
  {
    id: 'stg_customers_cleaned',
    name: 'stg_customers_cleaned',
    type: 'table',
    description: 'Deduplicated and standardized customer profiles with normalized emails',
    layer: 'staging',
    tags: ['dedup', 'staging'],
    sourceCodeSnippet: 'SELECT DISTINCT ON (email) account_id, LOWER(email) AS email, name, phone\nFROM raw_customers_cdc WHERE cdc_op != \'D\';'
  },
  {
    id: 'stg_orders_normalized',
    name: 'stg_orders_normalized',
    type: 'table',
    description: 'Currency-normalized and tax-adjusted itemized order transactions',
    layer: 'staging',
    tags: ['orders', 'staging'],
    sourceCodeSnippet: 'SELECT order_id, store_id, total_amount * fx_rate AS total_usd, created_at\nFROM raw_orders_stream;'
  },
  {
    id: 'stg_payments_reconciled',
    name: 'stg_payments_reconciled',
    type: 'table',
    description: 'Payment transactions cross-referenced against order authorizations',
    layer: 'staging',
    tags: ['payments', 'recon'],
    sourceCodeSnippet: 'SELECT p.txn_id, o.order_id, p.gross_amount, p.fee\nFROM raw_payment_trans p JOIN stg_orders_normalized o ON p.order_ref = o.order_id;'
  },
  {
    id: 'stg_inventory_levels',
    name: 'stg_inventory_levels',
    type: 'table',
    description: 'Stock levels adjusted for open reserve orders and pending transfers',
    layer: 'staging',
    tags: ['inventory', 'staging'],
    sourceCodeSnippet: 'SELECT sku, warehouse_code, qty_on_hand - reserved_qty AS available_qty\nFROM raw_erp_inventory;'
  },
  {
    id: 'stg_clickstream_sessions',
    name: 'stg_clickstream_sessions',
    type: 'table',
    description: 'Synthesized 30-minute visitor sessions with UTM attribution tags',
    layer: 'staging',
    tags: ['analytics', 'sessions'],
    sourceCodeSnippet: 'SELECT session_id, user_id, utm_source, utm_campaign, duration_sec\nFROM raw_web_clickstream GROUP BY session_id;'
  },
  {
    id: 'stg_legacy_order_backup',
    name: 'stg_legacy_order_backup',
    type: 'table',
    description: 'Legacy manual copy of orders created during 2023 DB migration',
    layer: 'staging',
    tags: ['backup', 'legacy', 'deprecated'],
    isDuplicateCandidate: true,
    duplicateOf: 'stg_orders_normalized',
    notes: 'Schema matches stg_orders_normalized. No write traffic observed in 90+ days.',
    sourceCodeSnippet: 'CREATE TABLE stg_legacy_order_backup AS SELECT * FROM stg_orders_normalized;'
  },
  {
    id: 'dim_customer',
    name: 'dim_customer',
    type: 'table',
    description: 'SCD Type-2 slowly changing dimension for golden customer records',
    layer: 'curated',
    tags: ['conformed', 'dimension', 'scd2'],
    sourceCodeSnippet: 'CREATE TABLE dim_customer (\n  customer_sk BIGSERIAL PRIMARY KEY,\n  account_id VARCHAR(64),\n  email VARCHAR(120),\n  tier VARCHAR(20),\n  valid_from TIMESTAMP,\n  valid_to TIMESTAMP\n);'
  },
  {
    id: 'dim_product',
    name: 'dim_product',
    type: 'table',
    description: 'Enterprise master product dimension with category taxonomy hierarchy',
    layer: 'curated',
    tags: ['conformed', 'dimension', 'catalog'],
    sourceCodeSnippet: 'CREATE TABLE dim_product (\n  product_sk SERIAL PRIMARY KEY,\n  sku VARCHAR(30),\n  title VARCHAR(150),\n  category VARCHAR(50),\n  unit_cost NUMERIC(8,2)\n);'
  },
  {
    id: 'dim_store',
    name: 'dim_store',
    type: 'table',
    description: 'Retail brick-and-mortar stores, geographic territories, and franchise flags',
    layer: 'curated',
    tags: ['conformed', 'dimension', 'retail'],
    sourceCodeSnippet: 'CREATE TABLE dim_store (\n  store_sk INT PRIMARY KEY,\n  store_number VARCHAR(10),\n  city VARCHAR(50),\n  region VARCHAR(30)\n);'
  },
  {
    id: 'dim_date',
    name: 'dim_date',
    type: 'table',
    description: 'Standard calendar and fiscal date dimension with holiday indicators',
    layer: 'curated',
    tags: ['conformed', 'dimension', 'calendar'],
    sourceCodeSnippet: 'CREATE TABLE dim_date (\n  date_sk INT PRIMARY KEY,\n  full_date DATE,\n  fiscal_quarter INT,\n  is_holiday BOOLEAN\n);'
  },
  {
    id: 'dim_channel',
    name: 'dim_channel',
    type: 'table',
    description: 'Sales channel lookup table (In-Store, Mobile App, Web, B2B Wholesale)',
    layer: 'curated',
    tags: ['dimension', 'omnichannel'],
    sourceCodeSnippet: 'CREATE TABLE dim_channel (\n  channel_sk INT PRIMARY KEY,\n  code VARCHAR(20),\n  channel_group VARCHAR(30)\n);'
  },
  {
    id: 'dim_warehouse',
    name: 'dim_warehouse',
    type: 'table',
    description: 'Regional fulfillment centers, 3PL partners, and capacity thresholds',
    layer: 'curated',
    tags: ['dimension', 'logistics'],
    sourceCodeSnippet: 'CREATE TABLE dim_warehouse (\n  warehouse_sk INT PRIMARY KEY,\n  code VARCHAR(10),\n  operator VARCHAR(50),\n  max_pallets INT\n);'
  },
  {
    id: 'fact_sales',
    name: 'fact_sales',
    type: 'table',
    description: 'Core grain itemized sales facts linked to conformed dimensions',
    layer: 'curated',
    tags: ['fact', 'star-schema', 'revenue'],
    sourceCodeSnippet: 'CREATE TABLE fact_sales (\n  sale_id BIGINT PRIMARY KEY,\n  customer_sk BIGINT REFERENCES dim_customer,\n  product_sk INT REFERENCES dim_product,\n  store_sk INT REFERENCES dim_store,\n  date_sk INT REFERENCES dim_date,\n  net_amount NUMERIC(10,2)\n);'
  },
  {
    id: 'fact_returns',
    name: 'fact_returns',
    type: 'table',
    description: 'RMA returns, restock reason codes, and reversed refund amounts',
    layer: 'curated',
    tags: ['fact', 'returns', 'rma'],
    sourceCodeSnippet: 'CREATE TABLE fact_returns (\n  return_id BIGINT PRIMARY KEY,\n  sale_id BIGINT REFERENCES fact_sales,\n  refund_amount NUMERIC(10,2),\n  reason_code VARCHAR(30)\n);'
  },
  {
    id: 'fact_inventory_daily',
    name: 'fact_inventory_daily',
    type: 'table',
    description: 'Periodic snapshot fact table of inventory balances per warehouse per day',
    layer: 'curated',
    tags: ['fact', 'inventory', 'snapshot'],
    sourceCodeSnippet: 'CREATE TABLE fact_inventory_daily (\n  snapshot_date DATE,\n  product_sk INT REFERENCES dim_product,\n  warehouse_sk INT REFERENCES dim_warehouse,\n  closing_balance INT\n);'
  },
  {
    id: 'fact_customer_journey',
    name: 'fact_customer_journey',
    type: 'table',
    description: 'Multi-touch marketing touchpoints preceding order conversion',
    layer: 'curated',
    tags: ['fact', 'attribution', 'marketing'],
    sourceCodeSnippet: 'CREATE TABLE fact_customer_journey (\n  touchpoint_id UUID,\n  customer_sk BIGINT,\n  campaign VARCHAR(50),\n  position_weight NUMERIC(3,2)\n);'
  },
  {
    id: 'agg_monthly_financials',
    name: 'agg_monthly_financials',
    type: 'table',
    description: 'Pre-aggregated monthly revenue, discounts, returns, and net margin',
    layer: 'curated',
    tags: ['aggregate', 'mart', 'financials'],
    sourceCodeSnippet: 'SELECT date_trunc(\'month\', full_date) AS fiscal_month, SUM(net_amount) AS total_gross_sales\nFROM fact_sales JOIN dim_date USING (date_sk) GROUP BY 1;'
  },
  {
    id: 'agg_customer_ltv',
    name: 'agg_customer_ltv',
    type: 'table',
    description: 'RFM segmentation, predictive 12-month LTV, and churn propensity index',
    layer: 'curated',
    tags: ['aggregate', 'ml', 'crm-mart'],
    sourceCodeSnippet: 'SELECT customer_sk, COUNT(sale_id) AS frequency, SUM(net_amount) AS monetary_val, MAX(full_date) AS recency\nFROM fact_sales GROUP BY customer_sk;'
  },
  {
    id: 'agg_store_performance',
    name: 'agg_store_performance',
    type: 'table',
    description: 'Store daily revenue per sqft, basket size, and year-over-year comps',
    layer: 'curated',
    tags: ['aggregate', 'retail-mart'],
    sourceCodeSnippet: 'SELECT store_sk, date_sk, COUNT(DISTINCT sale_id) AS footfall, AVG(net_amount) AS basket_size\nFROM fact_sales GROUP BY 1, 2;'
  },

  // --- 12 ETL JOBS ---
  {
    id: 'job_ingest_crm_nightly',
    name: 'job_ingest_crm_nightly',
    type: 'job',
    description: 'Airflow batch DAG pulling incremental CRM changes into raw_customers_cdc',
    layer: 'source',
    tags: ['airflow', 'python', 'ingestion'],
    sourceCodeSnippet: 'def run_crm_ingest():\n    records = salesforce_client.query("SELECT Id, Name, Email, LastModifiedDate FROM Contact")\n    postgres_conn.copy_expert("COPY raw_customers_cdc FROM STDIN", records)'
  },
  {
    id: 'job_stream_pos_sales',
    name: 'job_stream_pos_sales',
    type: 'job',
    description: 'Flink streaming job parsing Kafka order events into raw_orders_stream',
    layer: 'source',
    tags: ['flink', 'streaming', 'kafka'],
    sourceCodeSnippet: 'class OrderStreamParser(ProcessFunction):\n    def process_element(self, event, ctx):\n        clean_order = validate_schema(event)\n        sink.emit(clean_order)'
  },
  {
    id: 'job_sync_payment_gateway',
    name: 'job_sync_payment_gateway',
    type: 'job',
    description: 'Cron webhook listener landing gateway settlements into raw_payment_trans',
    layer: 'source',
    tags: ['webhook', 'node', 'finance'],
    sourceCodeSnippet: 'app.post("/webhook/stripe", async (req, res) => {\n  await db.insert("raw_payment_trans", req.body);\n  res.sendStatus(200);\n});'
  },
  {
    id: 'job_clean_customer_dedup',
    name: 'job_clean_customer_dedup',
    type: 'job',
    description: 'dbt model running fuzzy string matching and email normalization',
    layer: 'staging',
    tags: ['dbt', 'sql', 'cleansing'],
    sourceCodeSnippet: '{{ config(materialized="table") }}\nSELECT * FROM {{ ref("raw_customers_cdc") }} WHERE email IS NOT NULL;'
  },
  {
    id: 'job_transform_orders_stg',
    name: 'job_transform_orders_stg',
    type: 'job',
    description: 'dbt incremental model casting types, applying FX rates, and validating IDs',
    layer: 'staging',
    tags: ['dbt', 'sql', 'orders'],
    sourceCodeSnippet: 'SELECT order_id, store_id, total_amount, created_at FROM raw_orders_stream;'
  },
  {
    id: 'job_reconcile_payments_stg',
    name: 'job_reconcile_payments_stg',
    type: 'job',
    description: 'Spark SQL script joining gateway charge IDs with POS order IDs',
    layer: 'staging',
    tags: ['spark', 'pyspark', 'reconciliation'],
    sourceCodeSnippet: 'df_orders = spark.read.table("stg_orders_normalized")\ndf_pay = spark.read.table("raw_payment_trans")\ndf_recon = df_pay.join(df_orders, df_pay.ref == df_orders.id)\ndf_recon.write.mode("overwrite").saveAsTable("stg_payments_reconciled")'
  },
  {
    id: 'job_sessionize_clickstream',
    name: 'job_sessionize_clickstream',
    type: 'job',
    description: 'SQL script clustering web click events into 30m inactivity sessions',
    layer: 'staging',
    tags: ['sql', 'sessionization'],
    sourceCodeSnippet: 'SELECT user_id, LAG(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp) FROM raw_web_clickstream;'
  },
  {
    id: 'job_build_dim_customers',
    name: 'job_build_dim_customers',
    type: 'job',
    description: 'dbt SCD-2 snapshot job maintaining historic state changes for customers',
    layer: 'curated',
    tags: ['dbt', 'scd2', 'dimensions'],
    sourceCodeSnippet: '{% snapshot dim_customer_snapshot %}\n{{ config(target_schema="curated", strategy="check", check_cols=["email", "tier"]) }}\nSELECT * FROM {{ ref("stg_customers_cleaned") }}\n{% endsnapshot %}'
  },
  {
    id: 'job_build_dim_products',
    name: 'job_build_dim_products',
    type: 'job',
    description: 'Python script parsing product taxonomy and ERP SKU attributes',
    layer: 'curated',
    tags: ['python', 'catalog'],
    sourceCodeSnippet: 'def sync_products():\n    catalog = erp.fetch_skus()\n    db.upsert("dim_product", catalog)'
  },
  {
    id: 'job_build_fact_sales_daily',
    name: 'job_build_fact_sales_daily',
    type: 'job',
    description: 'Core fact pipeline joining normalized orders with conformed dimensions',
    layer: 'curated',
    tags: ['dbt', 'fact', 'core'],
    sourceCodeSnippet: 'SELECT o.order_id, c.customer_sk, p.product_sk, s.store_sk, o.total_usd\nFROM stg_orders_normalized o\nJOIN dim_customer c ON o.email = c.email\nJOIN dim_product p ON o.sku = p.sku\nJOIN dim_store s ON o.store_id = s.store_number;'
  },
  {
    id: 'job_aggregate_monthly_revenue',
    name: 'job_aggregate_monthly_revenue',
    type: 'job',
    description: 'Nightly rollup job calculating gross sales, returns, and EBITDA margins',
    layer: 'curated',
    tags: ['sql', 'rollup', 'finance'],
    sourceCodeSnippet: 'INSERT INTO agg_monthly_financials\nSELECT date_trunc(\'month\', d.full_date), SUM(f.net_amount)\nFROM fact_sales f JOIN dim_date d ON f.date_sk = d.date_sk GROUP BY 1;'
  },
  {
    id: 'job_calc_customer_ltv_ml',
    name: 'job_calc_customer_ltv_ml',
    type: 'job',
    description: 'Scikit-learn / XGBoost pipeline scoring 90-day repurchase probability and LTV',
    layer: 'curated',
    tags: ['python', 'ml', 'xgboost'],
    sourceCodeSnippet: 'model = joblib.load("ltv_model.pkl")\nfeatures = load_rfm_matrix("fact_sales")\npreds = model.predict(features)\nsave_mart("agg_customer_ltv", preds)'
  },

  // --- 8 REPORTS ---
  {
    id: 'rpt_executive_kpi_dashboard',
    name: 'rpt_executive_kpi_dashboard',
    type: 'report',
    description: 'C-Suite Tableau workbook displaying monthly ARR, net margins, and retention',
    layer: 'reporting',
    tags: ['tableau', 'executive', 'bi'],
    sourceCodeSnippet: 'QUERY TableauDataSource:\nSELECT fiscal_month, total_gross_sales, avg_ltv\nFROM agg_monthly_financials CROSS JOIN (SELECT AVG(monetary_val) as avg_ltv FROM agg_customer_ltv);'
  },
  {
    id: 'rpt_daily_sales_flash',
    name: 'rpt_daily_sales_flash',
    type: 'report',
    description: 'Automated 07:00 AM Slack broadcast & PDF email summarizing store flash sales',
    layer: 'reporting',
    tags: ['looker', 'daily', 'sales'],
    sourceCodeSnippet: 'SELECT s.region, SUM(f.net_amount) AS revenue_yesterday\nFROM fact_sales f JOIN dim_store s ON f.store_sk = s.store_sk\nWHERE f.date_sk = current_date_sk() GROUP BY 1;'
  },
  {
    id: 'rpt_customer_retention_cohorts',
    name: 'rpt_customer_retention_cohorts',
    type: 'report',
    description: 'PowerBI cohort retention heatmap tracking 12-week customer survival curves',
    layer: 'reporting',
    tags: ['powerbi', 'cohorts', 'retention'],
    sourceCodeSnippet: 'SELECT signup_cohort, period_week, COUNT(DISTINCT customer_sk) as retained_users\nFROM agg_customer_ltv JOIN dim_customer USING (customer_sk) GROUP BY 1, 2;'
  },
  {
    id: 'rpt_inventory_shrinkage',
    name: 'rpt_inventory_shrinkage',
    type: 'report',
    description: 'Supply chain report auditing cycle count discrepancies and warehouse loss',
    layer: 'reporting',
    tags: ['powerbi', 'supply-chain'],
    sourceCodeSnippet: 'SELECT w.code, p.title, closing_balance - expected_balance AS variance\nFROM fact_inventory_daily JOIN dim_warehouse w USING (warehouse_sk) JOIN dim_product p USING (product_sk);'
  },
  {
    id: 'rpt_finance_general_ledger_recon',
    name: 'rpt_finance_general_ledger_recon',
    type: 'report',
    description: 'End-of-month financial reconciliation comparing settlements to gross ledger',
    layer: 'reporting',
    tags: ['excel', 'finance', 'audit'],
    notes: 'Legacy direct query bypass detected: Queries stg_payments_reconciled directly instead of curated mart.',
    sourceCodeSnippet: 'SELECT m.fiscal_month, m.total_gross_sales, p.total_settled\nFROM agg_monthly_financials m\n-- Note: directly querying staging layer bypasses data governance!\nLEFT JOIN (SELECT date_trunc(\'month\', settled_at), SUM(gross_amount) AS total_settled FROM stg_payments_reconciled GROUP BY 1) p ON m.fiscal_month = p.date_trunc;'
  },
  {
    id: 'rpt_marketing_attribution',
    name: 'rpt_marketing_attribution',
    type: 'report',
    description: 'Campaign ROI dashboard applying W-shaped multi-touch attribution',
    layer: 'reporting',
    tags: ['looker', 'marketing'],
    sourceCodeSnippet: 'SELECT campaign, SUM(position_weight * ltv_score) AS attributed_value\nFROM fact_customer_journey JOIN agg_customer_ltv USING (customer_sk) GROUP BY 1;'
  },
  {
    id: 'rpt_store_ops_leaderboard',
    name: 'rpt_store_ops_leaderboard',
    type: 'report',
    description: 'Weekly regional operational scoreboard ranking retail district managers',
    layer: 'reporting',
    tags: ['tableau', 'retail', 'ops'],
    sourceCodeSnippet: 'SELECT s.store_number, s.city, footfall, basket_size\nFROM agg_store_performance JOIN dim_store s USING (store_sk) ORDER BY footfall DESC;'
  },
  {
    id: 'rpt_churn_early_warning',
    name: 'rpt_churn_early_warning',
    type: 'report',
    description: 'Weekly customer success risk alert list for VIP clients with falling RFM scores',
    layer: 'reporting',
    tags: ['crm', 'alerts', 'churn'],
    sourceCodeSnippet: 'SELECT c.email, c.tier, l.monetary_val, l.recency\nFROM agg_customer_ltv l JOIN dim_customer c USING (customer_sk)\nWHERE l.recency > 60 AND c.tier = \'VIP\';'
  },

  // --- 3 APPS ---
  {
    id: 'app_pos_mobile_terminal',
    name: 'app_pos_mobile_terminal',
    type: 'app',
    description: 'iOS iPad retail terminal application used by in-store cashiers',
    layer: 'apps',
    tags: ['ios', 'mobile', 'pos'],
    sourceCodeSnippet: '// Swift POS Checkout Handler\nfunc completeOrder(cart: Cart) {\n  let payload = cart.serializeToJson()\n  kafkaProducer.send(topic: "pos.orders", value: payload)\n}'
  },
  {
    id: 'app_customer_loyalty_portal',
    name: 'app_customer_loyalty_portal',
    type: 'app',
    description: 'Next.js web portal allowing end-users to check reward points and redeem coupons',
    layer: 'apps',
    tags: ['nextjs', 'customer-facing', 'react'],
    sourceCodeSnippet: '// React Loyalty Portal\nexport default async function LoyaltyPage({ params }) {\n  const customer = await fetchCustomerTier(params.id); // queries dim_customer & agg_customer_ltv\n  return <PointsDisplay points={customer.loyaltyPoints} />\n}'
  },
  {
    id: 'app_executive_bi_portal',
    name: 'app_executive_bi_portal',
    type: 'app',
    description: 'Internal leadership web portal embedding executive KPIs, daily sales, and alerts',
    layer: 'apps',
    tags: ['internal', 'portal', 'c-suite'],
    sourceCodeSnippet: '<DashboardContainer>\n  <EmbeddedTableau report="rpt_executive_kpi_dashboard" />\n  <FlashReportFeed report="rpt_daily_sales_flash" />\n</DashboardContainer>'
  }
];

export const SAMPLE_DEPENDENCIES: Dependency[] = [
  // --- Ingestion & Raw Writes ---
  {
    id: 'dep-1',
    source: 'job_ingest_crm_nightly',
    target: 'raw_customers_cdc',
    confidence: 1.0,
    needsReview: false,
    type: 'writes',
    rationale: 'Batch ingestion script extracts Salesforce Contacts directly to raw_customers_cdc'
  },
  {
    id: 'dep-2',
    source: 'app_pos_mobile_terminal',
    target: 'raw_orders_stream',
    confidence: 0.95,
    needsReview: false,
    type: 'writes',
    rationale: 'Mobile POS iPad application pushes checkout payloads to raw_orders_stream topic'
  },
  {
    id: 'dep-3',
    source: 'job_stream_pos_sales',
    target: 'raw_orders_stream',
    confidence: 0.90,
    needsReview: false,
    type: 'reads',
    rationale: 'Flink streaming job reads real-time raw_orders_stream events'
  },
  {
    id: 'dep-4',
    source: 'job_sync_payment_gateway',
    target: 'raw_payment_trans',
    confidence: 1.0,
    needsReview: false,
    type: 'writes',
    rationale: 'Webhook receiver writes Stripe/Adyen transaction JSONs into raw_payment_trans'
  },

  // --- Staging Transforms ---
  {
    id: 'dep-5',
    source: 'raw_customers_cdc',
    target: 'job_clean_customer_dedup',
    confidence: 0.98,
    needsReview: false,
    type: 'reads',
    rationale: 'dbt model reads raw CDC stream to perform deduplication and normalization'
  },
  {
    id: 'dep-6',
    source: 'job_clean_customer_dedup',
    target: 'stg_customers_cleaned',
    confidence: 1.0,
    needsReview: false,
    type: 'writes',
    rationale: 'Cleansing job produces normalized stg_customers_cleaned table'
  },
  {
    id: 'dep-7',
    source: 'job_stream_pos_sales',
    target: 'stg_orders_normalized',
    confidence: 0.92,
    needsReview: false,
    type: 'writes',
    rationale: 'Flink processor materializes normalized order lines into stg_orders_normalized'
  },
  {
    id: 'dep-8',
    source: 'raw_payment_trans',
    target: 'job_reconcile_payments_stg',
    confidence: 0.95,
    needsReview: false,
    type: 'reads',
    rationale: 'Payment reconciliation job ingests raw payment gateway log'
  },
  {
    id: 'dep-9',
    source: 'stg_orders_normalized',
    target: 'job_reconcile_payments_stg',
    confidence: 0.92,
    needsReview: false,
    type: 'reads',
    rationale: 'Reconciliation job joins raw payments against normalized order amounts'
  },
  {
    id: 'dep-10',
    source: 'job_reconcile_payments_stg',
    target: 'stg_payments_reconciled',
    confidence: 1.0,
    needsReview: false,
    type: 'writes',
    rationale: 'Writes matched transactions to stg_payments_reconciled'
  },
  {
    id: 'dep-11',
    source: 'raw_web_clickstream',
    target: 'job_sessionize_clickstream',
    confidence: 0.95,
    needsReview: false,
    type: 'reads',
    rationale: 'Sessionization job reads granular website event clicks'
  },
  {
    id: 'dep-12',
    source: 'job_sessionize_clickstream',
    target: 'stg_clickstream_sessions',
    confidence: 1.0,
    needsReview: false,
    type: 'writes',
    rationale: 'Writes sessionized visitor windows to stg_clickstream_sessions'
  },
  {
    id: 'dep-13',
    source: 'raw_erp_inventory',
    target: 'stg_inventory_levels',
    confidence: 0.88,
    needsReview: false,
    type: 'writes',
    rationale: 'ERP sync process populates staging inventory levels'
  },

  // --- Curated Mart & Dimension Builds ---
  {
    id: 'dep-14',
    source: 'stg_customers_cleaned',
    target: 'job_build_dim_customers',
    confidence: 0.95,
    needsReview: false,
    type: 'reads',
    rationale: 'dbt snapshot job reads cleaned customers to calculate SCD-2 history'
  },
  {
    id: 'dep-15',
    source: 'job_build_dim_customers',
    target: 'dim_customer',
    confidence: 1.0,
    needsReview: false,
    type: 'writes',
    rationale: 'Builds master dim_customer table'
  },
  {
    id: 'dep-16',
    source: 'raw_erp_inventory',
    target: 'job_build_dim_products',
    confidence: 0.85,
    needsReview: false,
    type: 'reads',
    rationale: 'Product sync script parses ERP item master'
  },
  {
    id: 'dep-17',
    source: 'job_build_dim_products',
    target: 'dim_product',
    confidence: 1.0,
    needsReview: false,
    type: 'writes',
    rationale: 'Populates enterprise dim_product catalog'
  },
  {
    id: 'dep-18',
    source: 'stg_orders_normalized',
    target: 'job_build_fact_sales_daily',
    confidence: 0.98,
    needsReview: false,
    type: 'reads',
    rationale: 'Fact sales builder reads normalized transactions'
  },
  {
    id: 'dep-19',
    source: 'dim_customer',
    target: 'job_build_fact_sales_daily',
    confidence: 0.95,
    needsReview: false,
    type: 'reads',
    rationale: 'Fact sales joins dim_customer for customer surrogate key lookup'
  },
  {
    id: 'dep-20',
    source: 'dim_product',
    target: 'job_build_fact_sales_daily',
    confidence: 0.95,
    needsReview: false,
    type: 'reads',
    rationale: 'Fact sales joins dim_product for product surrogate key'
  },
  {
    id: 'dep-21',
    source: 'dim_store',
    target: 'job_build_fact_sales_daily',
    confidence: 0.90,
    needsReview: false,
    type: 'reads',
    rationale: 'Fact sales joins dim_store for retail branch key'
  },
  {
    id: 'dep-22',
    source: 'dim_date',
    target: 'job_build_fact_sales_daily',
    confidence: 0.90,
    needsReview: false,
    type: 'reads',
    rationale: 'Fact sales joins dim_date for fiscal date lookup'
  },
  {
    id: 'dep-23',
    source: 'job_build_fact_sales_daily',
    target: 'fact_sales',
    confidence: 1.0,
    needsReview: false,
    type: 'writes',
    rationale: 'Materializes core fact_sales star-schema table'
  },
  {
    id: 'dep-24',
    source: 'fact_sales',
    target: 'fact_returns',
    confidence: 0.88,
    needsReview: false,
    type: 'reads',
    rationale: 'fact_returns maintains foreign key reference to original fact_sales transaction'
  },
  {
    id: 'dep-25',
    source: 'stg_inventory_levels',
    target: 'fact_inventory_daily',
    confidence: 0.85,
    needsReview: false,
    type: 'writes',
    rationale: 'Daily snapshot job materializes inventory balances into fact_inventory_daily'
  },
  {
    id: 'dep-26',
    source: 'dim_warehouse',
    target: 'fact_inventory_daily',
    confidence: 0.90,
    needsReview: false,
    type: 'reads',
    rationale: 'Warehouse dimension linked to inventory snapshot fact'
  },
  {
    id: 'dep-27',
    source: 'stg_clickstream_sessions',
    target: 'fact_customer_journey',
    confidence: 0.88,
    needsReview: false,
    type: 'reads',
    rationale: 'Attribution pipeline extracts user session touchpoints into fact_customer_journey'
  },

  // --- Aggregate Rollup Builds ---
  {
    id: 'dep-28',
    source: 'fact_sales',
    target: 'job_aggregate_monthly_revenue',
    confidence: 0.96,
    needsReview: false,
    type: 'reads',
    rationale: 'Rollup job aggregates daily fact_sales into monthly buckets'
  },
  {
    id: 'dep-29',
    source: 'job_aggregate_monthly_revenue',
    target: 'agg_monthly_financials',
    confidence: 1.0,
    needsReview: false,
    type: 'writes',
    rationale: 'Stores monthly financial metrics in agg_monthly_financials'
  },
  {
    id: 'dep-30',
    source: 'fact_sales',
    target: 'job_calc_customer_ltv_ml',
    confidence: 0.92,
    needsReview: false,
    type: 'reads',
    rationale: 'ML scoring job reads customer purchase history from fact_sales'
  },
  {
    id: 'dep-31',
    source: 'dim_customer',
    target: 'job_calc_customer_ltv_ml',
    confidence: 0.89,
    needsReview: false,
    type: 'reads',
    rationale: 'ML model incorporates customer tenure and demographic tier'
  },
  {
    id: 'dep-32',
    source: 'job_calc_customer_ltv_ml',
    target: 'agg_customer_ltv',
    confidence: 1.0,
    needsReview: false,
    type: 'writes',
    rationale: 'ML model writes scored RFM segments and predicted LTV to agg_customer_ltv'
  },
  {
    id: 'dep-33',
    source: 'fact_sales',
    target: 'agg_store_performance',
    confidence: 0.93,
    needsReview: false,
    type: 'reads',
    rationale: 'Daily rollup calculates retail store throughput KPIs'
  },
  {
    id: 'dep-34',
    source: 'dim_store',
    target: 'agg_store_performance',
    confidence: 0.90,
    needsReview: false,
    type: 'reads',
    rationale: 'Store dimension attributes joined with performance metrics'
  },

  // --- Reporting Layer Dependencies ---
  {
    id: 'dep-35',
    source: 'agg_monthly_financials',
    target: 'rpt_executive_kpi_dashboard',
    confidence: 0.98,
    needsReview: false,
    type: 'queries',
    rationale: 'Tableau executive dashboard reads aggregated monthly financials'
  },
  {
    id: 'dep-36',
    source: 'agg_customer_ltv',
    target: 'rpt_executive_kpi_dashboard',
    confidence: 0.92,
    needsReview: false,
    type: 'queries',
    rationale: 'Tableau executive dashboard displays overall customer lifetime value trend'
  },
  {
    id: 'dep-37',
    source: 'fact_sales',
    target: 'rpt_daily_sales_flash',
    confidence: 0.95,
    needsReview: false,
    type: 'queries',
    rationale: 'Daily flash report reads yesterday net transactions from fact_sales'
  },
  {
    id: 'dep-38',
    source: 'dim_store',
    target: 'rpt_daily_sales_flash',
    confidence: 0.88,
    needsReview: false,
    type: 'queries',
    rationale: 'Daily flash aggregates sales by retail store region'
  },
  {
    id: 'dep-39',
    source: 'agg_customer_ltv',
    target: 'rpt_customer_retention_cohorts',
    confidence: 0.94,
    needsReview: false,
    type: 'queries',
    rationale: 'Cohort retention report reads customer RFM scores'
  },
  {
    id: 'dep-40',
    source: 'dim_customer',
    target: 'rpt_customer_retention_cohorts',
    confidence: 0.90,
    needsReview: false,
    type: 'queries',
    rationale: 'Cohort retention groups users by initial signup date'
  },
  {
    id: 'dep-41',
    source: 'fact_inventory_daily',
    target: 'rpt_inventory_shrinkage',
    confidence: 0.95,
    needsReview: false,
    type: 'queries',
    rationale: 'Shrinkage audit report queries daily inventory snapshot balances'
  },
  {
    id: 'dep-42',
    source: 'dim_warehouse',
    target: 'rpt_inventory_shrinkage',
    confidence: 0.92,
    needsReview: false,
    type: 'queries',
    rationale: 'Inventory report filters by regional fulfillment warehouse'
  },
  // AMBIGUOUS / LEGACY DIRECT QUERY FLAGGED AS NEEDS REVIEW:
  {
    id: 'dep-43',
    source: 'stg_payments_reconciled',
    target: 'rpt_finance_general_ledger_recon',
    confidence: 0.62,
    needsReview: true,
    type: 'queries',
    rationale: 'Legacy bypass detected: Report queries staging layer directly instead of curated financial mart. High risk of data drift.'
  },
  {
    id: 'dep-44',
    source: 'agg_monthly_financials',
    target: 'rpt_finance_general_ledger_recon',
    confidence: 0.94,
    needsReview: false,
    type: 'queries',
    rationale: 'General ledger recon cross-checks monthly billed revenue'
  },
  {
    id: 'dep-45',
    source: 'fact_customer_journey',
    target: 'rpt_marketing_attribution',
    confidence: 0.93,
    needsReview: false,
    type: 'queries',
    rationale: 'Marketing attribution report queries conversion journey touchpoints'
  },
  {
    id: 'dep-46',
    source: 'agg_customer_ltv',
    target: 'rpt_marketing_attribution',
    confidence: 0.89,
    needsReview: false,
    type: 'queries',
    rationale: 'Marketing report weights touchpoints by realized customer lifetime value'
  },
  {
    id: 'dep-47',
    source: 'agg_store_performance',
    target: 'rpt_store_ops_leaderboard',
    confidence: 0.96,
    needsReview: false,
    type: 'queries',
    rationale: 'Store ops leaderboard queries daily aggregated store performance'
  },
  {
    id: 'dep-48',
    source: 'agg_customer_ltv',
    target: 'rpt_churn_early_warning',
    confidence: 0.95,
    needsReview: false,
    type: 'queries',
    rationale: 'Churn alert report queries low-frequency decaying LTV profiles'
  },
  {
    id: 'dep-49',
    source: 'dim_customer',
    target: 'rpt_churn_early_warning',
    confidence: 0.91,
    needsReview: false,
    type: 'queries',
    rationale: 'Churn alerts filter for VIP customer tier contact information'
  },

  // --- Applications Layer Dependencies ---
  // AMBIGUOUS / DIRECT REPLICA QUERY FLAGGED AS NEEDS REVIEW:
  {
    id: 'dep-50',
    source: 'dim_product',
    target: 'app_pos_mobile_terminal',
    confidence: 0.68,
    needsReview: true,
    type: 'queries',
    rationale: 'POS mobile app queries product dimension directly for in-store price lookups via unindexed read replica'
  },
  {
    id: 'dep-51',
    source: 'dim_customer',
    target: 'app_customer_loyalty_portal',
    confidence: 0.88,
    needsReview: false,
    type: 'queries',
    rationale: 'Loyalty portal fetches member profile info and current membership status'
  },
  {
    id: 'dep-52',
    source: 'agg_customer_ltv',
    target: 'app_customer_loyalty_portal',
    confidence: 0.85,
    needsReview: false,
    type: 'queries',
    rationale: 'Loyalty portal displays customer points balance derived from aggregate LTV mart'
  },
  {
    id: 'dep-53',
    source: 'rpt_executive_kpi_dashboard',
    target: 'app_executive_bi_portal',
    confidence: 0.98,
    needsReview: false,
    type: 'queries',
    rationale: 'Executive web portal embeds the core executive KPI workbook'
  },
  {
    id: 'dep-54',
    source: 'rpt_daily_sales_flash',
    target: 'app_executive_bi_portal',
    confidence: 0.95,
    needsReview: false,
    type: 'queries',
    rationale: 'Executive web portal displays real-time flash widget'
  }
];

export const SAMPLE_TARGET_LAYERS: TargetArchitectureLayer[] = [
  {
    layer: 'source',
    name: '1. Ingestion & Raw Lake',
    description: 'Managed CDC event streams and batch ingestion connectors with zero direct consumption.',
    components: ['raw_customers_cdc', 'raw_orders_stream', 'raw_web_clickstream', 'raw_payment_trans', 'raw_erp_inventory', 'raw_support_tickets', 'job_ingest_crm_nightly', 'job_stream_pos_sales', 'job_sync_payment_gateway']
  },
  {
    layer: 'staging',
    name: '2. Staging & Cleansing',
    description: 'Schema enforcement, deduplication, currency standardization, and data quality assertions.',
    components: ['stg_customers_cleaned', 'stg_orders_normalized', 'stg_payments_reconciled', 'stg_inventory_levels', 'stg_clickstream_sessions', 'stg_legacy_order_backup', 'job_clean_customer_dedup', 'job_transform_orders_stg', 'job_reconcile_payments_stg', 'job_sessionize_clickstream']
  },
  {
    layer: 'curated',
    name: '3. Core Conformed Data Marts',
    description: 'Dimensional star schemas (SCD-2 dimensions, itemized facts) and governed business aggregates.',
    components: ['dim_customer', 'dim_product', 'dim_store', 'dim_date', 'dim_channel', 'dim_warehouse', 'fact_sales', 'fact_returns', 'fact_inventory_daily', 'fact_customer_journey', 'agg_monthly_financials', 'agg_customer_ltv', 'agg_store_performance', 'job_build_dim_customers', 'job_build_dim_products', 'job_build_fact_sales_daily', 'job_aggregate_monthly_revenue', 'job_calc_customer_ltv_ml']
  },
  {
    layer: 'reporting',
    name: '4. BI & Semantic Consumption',
    description: 'Standardized semantic layer views feeding executive dashboards, alerts, and operational reports.',
    components: ['rpt_executive_kpi_dashboard', 'rpt_daily_sales_flash', 'rpt_customer_retention_cohorts', 'rpt_inventory_shrinkage', 'rpt_finance_general_ledger_recon', 'rpt_marketing_attribution', 'rpt_store_ops_leaderboard', 'rpt_churn_early_warning']
  },
  {
    layer: 'apps',
    name: '5. Application Interfaces & APIs',
    description: 'High-availability reverse-ETL, caching APIs, and consumer applications accessing governed data.',
    components: ['app_pos_mobile_terminal', 'app_customer_loyalty_portal', 'app_executive_bi_portal']
  }
];

export const SAMPLE_SERVICE_BOUNDARIES: ServiceBoundary[] = [
  {
    id: 'srv-customer-360',
    name: 'Customer 360 & Loyalty Domain',
    description: 'Responsible for unified customer golden records, SCD-2 identity resolution, and predictive LTV / churn metrics.',
    suggestedComponents: ['raw_customers_cdc', 'stg_customers_cleaned', 'dim_customer', 'agg_customer_ltv', 'job_ingest_crm_nightly', 'job_clean_customer_dedup', 'job_build_dim_customers', 'job_calc_customer_ltv_ml', 'rpt_customer_retention_cohorts', 'rpt_churn_early_warning', 'app_customer_loyalty_portal'],
    rationale: 'Decouples customer profile lifecycle and ML scoring from transactional order processing; eliminates ad-hoc customer queries against raw CRM logs.',
    targetLayer: 'curated'
  },
  {
    id: 'srv-sales-revenue',
    name: 'Commerce & Revenue Domain',
    description: 'Encapsulates POS streams, itemized sales facts, merchant fee reconciliation, and financial aggregates.',
    suggestedComponents: ['raw_orders_stream', 'raw_payment_trans', 'stg_orders_normalized', 'stg_payments_reconciled', 'fact_sales', 'fact_returns', 'agg_monthly_financials', 'job_stream_pos_sales', 'job_sync_payment_gateway', 'job_transform_orders_stg', 'job_reconcile_payments_stg', 'job_build_fact_sales_daily', 'job_aggregate_monthly_revenue', 'rpt_daily_sales_flash', 'rpt_finance_general_ledger_recon'],
    rationale: 'Unifies payment settlements and sales order grains; resolves the legacy vulnerability where finance reports directly read staging tables.',
    targetLayer: 'curated'
  },
  {
    id: 'srv-supply-chain',
    name: 'Supply Chain & Fulfillment Domain',
    description: 'Oversees ERP inventory synchronization, warehouse fulfillment nodes, catalog dimensions, and stock audits.',
    suggestedComponents: ['raw_erp_inventory', 'stg_inventory_levels', 'dim_product', 'dim_warehouse', 'fact_inventory_daily', 'job_build_dim_products', 'rpt_inventory_shrinkage'],
    rationale: 'Isolates slow SAP batch feeds and pallet inventory snapshots from user-facing analytics; provides a dedicated catalog service.',
    targetLayer: 'curated'
  },
  {
    id: 'srv-bi-analytics',
    name: 'BI & Executive Analytics Hub',
    description: 'Semantic models, dimension conformers, multi-touch marketing attribution, and executive reporting portals.',
    suggestedComponents: ['raw_web_clickstream', 'stg_clickstream_sessions', 'dim_store', 'dim_date', 'dim_channel', 'fact_customer_journey', 'agg_store_performance', 'job_sessionize_clickstream', 'rpt_executive_kpi_dashboard', 'rpt_marketing_attribution', 'rpt_store_ops_leaderboard', 'app_executive_bi_portal'],
    rationale: 'Centralizes cross-domain joins and dashboard semantic layers, enforcing governed access without allowing direct table queries from reporting tools.',
    targetLayer: 'reporting'
  }
];

export const RAW_SAMPLE_SCRIPT_TEXT = `-- =========================================================================
-- QUANTUMLENS: LEGACY DATA ESTATE ARTIFACT DUMP (SAMPLE SYSTEM)
-- Estate: 25 Tables, 12 ETL Jobs, 8 Reports, 3 Applications
-- Includes realistic SQL scripts, DAG definitions, and API bindings
-- =========================================================================

-- 1. SOURCE SCHEMAS & INGESTION
CREATE TABLE raw_customers_cdc (
    account_id VARCHAR(64),
    payload JSONB,
    cdc_op CHAR(1),
    synced_at TIMESTAMP
);

CREATE TABLE raw_orders_stream (
    order_id VARCHAR(40),
    store_id INT,
    total_amount NUMERIC(10,2),
    items JSONB,
    created_at TIMESTAMP
);

CREATE TABLE raw_web_clickstream (
    event_id UUID,
    anonymous_id VARCHAR(64),
    event_name VARCHAR(50),
    properties JSONB,
    timestamp BIGINT
);

CREATE TABLE raw_payment_trans (
    txn_id VARCHAR(50),
    gateway VARCHAR(20),
    gross_amount NUMERIC(10,2),
    fee NUMERIC(6,2),
    settled_at TIMESTAMP
);

CREATE TABLE raw_erp_inventory (
    sku VARCHAR(30),
    warehouse_code VARCHAR(10),
    qty_on_hand INT,
    reorder_threshold INT
);

CREATE TABLE raw_support_tickets (
    ticket_id INT,
    user_email VARCHAR(100),
    status VARCHAR(20),
    rating INT
); -- Note: No downstream jobs consume this table (candidate unused)

-- 2. STAGING & CLEANSING PIPELINES
-- ETL: job_clean_customer_dedup (reads raw_customers_cdc -> writes stg_customers_cleaned)
CREATE TABLE stg_customers_cleaned AS
SELECT DISTINCT ON (LOWER(c.email))
    c.account_id,
    LOWER(c.email) AS email,
    c.name,
    c.phone
FROM raw_customers_cdc c
WHERE c.cdc_op != 'D';

-- ETL: job_stream_pos_sales (consumes raw_orders_stream -> writes stg_orders_normalized)
CREATE TABLE stg_orders_normalized (
    order_id VARCHAR(40),
    store_id INT,
    total_usd NUMERIC(10,2),
    created_at TIMESTAMP
);

-- ETL: job_reconcile_payments_stg (reads raw_payment_trans & stg_orders_normalized)
CREATE TABLE stg_payments_reconciled AS
SELECT p.txn_id, o.order_id, p.gross_amount, p.fee, p.settled_at
FROM raw_payment_trans p
JOIN stg_orders_normalized o ON p.txn_id = o.order_id;

CREATE TABLE stg_inventory_levels AS
SELECT sku, warehouse_code, qty_on_hand
FROM raw_erp_inventory;

CREATE TABLE stg_clickstream_sessions AS
SELECT session_id, user_id, utm_source, duration_sec
FROM raw_web_clickstream;

CREATE TABLE stg_legacy_order_backup AS
SELECT * FROM stg_orders_normalized; -- Candidate duplicate! Unused for 90+ days

-- 3. CURATED CONFORMED MARTS & STAR SCHEMAS
-- ETL: job_build_dim_customers (reads stg_customers_cleaned -> writes dim_customer)
CREATE TABLE dim_customer (
    customer_sk BIGSERIAL PRIMARY KEY,
    account_id VARCHAR(64),
    email VARCHAR(120),
    tier VARCHAR(20),
    valid_from TIMESTAMP,
    valid_to TIMESTAMP
);

CREATE TABLE dim_product (
    product_sk SERIAL PRIMARY KEY,
    sku VARCHAR(30),
    title VARCHAR(150),
    category VARCHAR(50),
    unit_cost NUMERIC(8,2)
);

CREATE TABLE dim_store (
    store_sk INT PRIMARY KEY,
    store_number VARCHAR(10),
    city VARCHAR(50),
    region VARCHAR(30)
);

CREATE TABLE dim_date (
    date_sk INT PRIMARY KEY,
    full_date DATE,
    fiscal_quarter INT,
    is_holiday BOOLEAN
);

CREATE TABLE dim_channel (
    channel_sk INT PRIMARY KEY,
    code VARCHAR(20),
    channel_group VARCHAR(30)
);

CREATE TABLE dim_warehouse (
    warehouse_sk INT PRIMARY KEY,
    code VARCHAR(10),
    operator VARCHAR(50),
    max_pallets INT
);

-- ETL: job_build_fact_sales_daily (reads stg_orders_normalized, dim_customer, dim_product, dim_store, dim_date)
CREATE TABLE fact_sales (
    sale_id BIGINT PRIMARY KEY,
    customer_sk BIGINT REFERENCES dim_customer,
    product_sk INT REFERENCES dim_product,
    store_sk INT REFERENCES dim_store,
    date_sk INT REFERENCES dim_date,
    net_amount NUMERIC(10,2)
);

CREATE TABLE fact_returns (
    return_id BIGINT PRIMARY KEY,
    sale_id BIGINT REFERENCES fact_sales,
    refund_amount NUMERIC(10,2)
);

CREATE TABLE fact_inventory_daily (
    snapshot_date DATE,
    product_sk INT REFERENCES dim_product,
    warehouse_sk INT REFERENCES dim_warehouse,
    closing_balance INT
);

CREATE TABLE fact_customer_journey (
    touchpoint_id UUID,
    customer_sk BIGINT,
    campaign VARCHAR(50),
    position_weight NUMERIC(3,2)
);

-- ETL: job_aggregate_monthly_revenue (reads fact_sales -> writes agg_monthly_financials)
CREATE TABLE agg_monthly_financials AS
SELECT date_trunc('month', d.full_date) AS fiscal_month, SUM(f.net_amount) AS total_gross_sales
FROM fact_sales f JOIN dim_date d ON f.date_sk = d.date_sk GROUP BY 1;

-- ETL: job_calc_customer_ltv_ml (reads fact_sales, dim_customer -> writes agg_customer_ltv)
CREATE TABLE agg_customer_ltv AS
SELECT customer_sk, COUNT(sale_id) AS frequency, SUM(net_amount) AS monetary_val, MAX(date_sk) AS recency
FROM fact_sales GROUP BY customer_sk;

CREATE TABLE agg_store_performance AS
SELECT store_sk, COUNT(sale_id) AS footfall, AVG(net_amount) AS basket_size
FROM fact_sales GROUP BY store_sk;

-- 4. REPORTING CONSUMPTION VIEWS
-- View / Report: rpt_executive_kpi_dashboard queries agg_monthly_financials and agg_customer_ltv
-- View / Report: rpt_daily_sales_flash queries fact_sales and dim_store
-- View / Report: rpt_customer_retention_cohorts queries agg_customer_ltv and dim_customer
-- View / Report: rpt_inventory_shrinkage queries fact_inventory_daily and dim_warehouse
-- View / Report: rpt_finance_general_ledger_recon (Warning: queries stg_payments_reconciled directly!)
-- View / Report: rpt_marketing_attribution queries fact_customer_journey and agg_customer_ltv
-- View / Report: rpt_store_ops_leaderboard queries agg_store_performance and dim_store
-- View / Report: rpt_churn_early_warning queries agg_customer_ltv and dim_customer

-- 5. CONSUMING APPLICATIONS
-- App: app_pos_mobile_terminal (writes raw_orders_stream, queries dim_product directly)
-- App: app_customer_loyalty_portal (queries dim_customer, agg_customer_ltv)
-- App: app_executive_bi_portal (embeds rpt_executive_kpi_dashboard, rpt_daily_sales_flash)
`;
