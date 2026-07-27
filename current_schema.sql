--
-- PostgreSQL database dump
--

\restrict QLgVDUaGrLFrJOO44HafFeUqhz5qTesShPfbSbDgacGYvmMDhYX0p0e7fORbz92

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: refresh_performance_kpis_materialized_view(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_performance_kpis_materialized_view() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tenant_performance_kpis;
END;
$$;


ALTER FUNCTION public.refresh_performance_kpis_materialized_view() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auction_bidder_authorizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_bidder_authorizations (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    auction_id uuid NOT NULL,
    bidder_id uuid NOT NULL,
    is_authorized boolean NOT NULL,
    authorization_reason character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auction_bidder_authorizations OWNER TO postgres;

--
-- Name: auction_bidder_authorizations_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_bidder_authorizations_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    auction_id uuid,
    bidder_id uuid,
    is_authorized boolean,
    authorization_reason character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    version bigint
);


ALTER TABLE public.auction_bidder_authorizations_aud OWNER TO postgres;

--
-- Name: auction_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_events (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    auction_id uuid,
    lot_id uuid,
    event_type character varying(50) NOT NULL,
    payload text,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    triggered_by character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auction_events OWNER TO postgres;

--
-- Name: auction_events_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_events_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    auction_id uuid,
    lot_id uuid,
    event_type character varying(50),
    payload text,
    "timestamp" timestamp with time zone,
    triggered_by character varying(255)
);


ALTER TABLE public.auction_events_aud OWNER TO postgres;

--
-- Name: auction_lots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_lots (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    auction_id uuid NOT NULL,
    lot_number character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description character varying(2000),
    material_category character varying(100) NOT NULL,
    quantity bigint NOT NULL,
    unit_of_measure character varying(20) NOT NULL,
    starting_price bigint NOT NULL,
    reserve_price bigint,
    current_highest_bid bigint,
    minimum_increment bigint NOT NULL,
    currency character varying(3) NOT NULL,
    lot_status character varying(50) NOT NULL,
    winner_bidder_id uuid,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auction_lots OWNER TO postgres;

--
-- Name: auction_lots_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_lots_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    auction_id uuid,
    lot_number character varying(50),
    title character varying(255),
    description character varying(2000),
    material_category character varying(100),
    quantity bigint,
    unit_of_measure character varying(20),
    starting_price bigint,
    reserve_price bigint,
    current_highest_bid bigint,
    minimum_increment bigint,
    currency character varying(3),
    lot_status character varying(50),
    winner_bidder_id uuid,
    display_order integer
);


ALTER TABLE public.auction_lots_aud OWNER TO postgres;

--
-- Name: auction_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_results (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    auction_lot_id uuid NOT NULL,
    status character varying(50) NOT NULL,
    highest_bid_amount bigint,
    reserve_price bigint,
    reserve_met boolean DEFAULT false NOT NULL,
    winner_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auction_results OWNER TO postgres;

--
-- Name: auction_results_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_results_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    auction_lot_id uuid,
    status character varying(50),
    highest_bid_amount bigint,
    reserve_price bigint,
    reserve_met boolean,
    winner_id uuid
);


ALTER TABLE public.auction_results_aud OWNER TO postgres;

--
-- Name: auction_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_settings (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    auction_id uuid NOT NULL,
    anonymous_bidding boolean DEFAULT false NOT NULL,
    allow_auto_extension boolean DEFAULT false NOT NULL,
    extension_minutes integer,
    max_extensions integer,
    bid_increment_type character varying(50),
    minimum_increment bigint,
    reserve_price_enabled boolean DEFAULT false NOT NULL,
    allow_proxy_bid boolean DEFAULT false NOT NULL,
    allow_manual_winner boolean DEFAULT false NOT NULL,
    allow_seller_approval boolean DEFAULT false NOT NULL,
    allow_bid_withdrawal boolean DEFAULT false NOT NULL,
    allow_rank_display boolean DEFAULT false NOT NULL,
    show_bidder_names boolean DEFAULT false NOT NULL,
    registration_required boolean DEFAULT false NOT NULL,
    emd_required boolean DEFAULT false NOT NULL,
    timezone character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auction_settings OWNER TO postgres;

--
-- Name: auction_settings_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_settings_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    auction_id uuid,
    anonymous_bidding boolean,
    allow_auto_extension boolean,
    extension_minutes integer,
    max_extensions integer,
    bid_increment_type character varying(50),
    minimum_increment bigint,
    reserve_price_enabled boolean,
    allow_proxy_bid boolean,
    allow_manual_winner boolean,
    allow_seller_approval boolean,
    allow_bid_withdrawal boolean,
    allow_rank_display boolean,
    show_bidder_names boolean,
    registration_required boolean,
    emd_required boolean,
    timezone character varying(100)
);


ALTER TABLE public.auction_settings_aud OWNER TO postgres;

--
-- Name: auction_state_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_state_history (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    auction_id uuid NOT NULL,
    from_state character varying(50) NOT NULL,
    to_state character varying(50) NOT NULL,
    reason character varying(1000),
    changed_by character varying(255),
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auction_state_history OWNER TO postgres;

--
-- Name: auction_winners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_winners (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    auction_lot_id uuid NOT NULL,
    bidder_id uuid NOT NULL,
    bid_id uuid,
    status character varying(50) NOT NULL,
    selection_type character varying(50) NOT NULL,
    winning_amount bigint NOT NULL,
    seller_decision_at timestamp with time zone,
    notes character varying(1000),
    winner_company_name character varying(255),
    winner_display_name character varying(255),
    winner_anonymous_code character varying(100),
    winner_bid_amount_snapshot bigint,
    winner_bid_time_snapshot timestamp with time zone,
    seller_company_snapshot character varying(255),
    reserve_price_snapshot bigint,
    currency_snapshot character varying(10),
    tax_profile_snapshot character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auction_winners OWNER TO postgres;

--
-- Name: auction_winners_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auction_winners_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    auction_lot_id uuid,
    bidder_id uuid,
    bid_id uuid,
    status character varying(50),
    selection_type character varying(50),
    winning_amount bigint,
    seller_decision_at timestamp with time zone,
    notes character varying(1000),
    winner_company_name character varying(255),
    winner_display_name character varying(255),
    winner_anonymous_code character varying(100),
    winner_bid_amount_snapshot bigint,
    winner_bid_time_snapshot timestamp with time zone,
    seller_company_snapshot character varying(255),
    reserve_price_snapshot bigint,
    currency_snapshot character varying(10),
    tax_profile_snapshot character varying(100)
);


ALTER TABLE public.auction_winners_aud OWNER TO postgres;

--
-- Name: auctions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auctions (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    auction_number character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description character varying(2000),
    seller_profile_id uuid NOT NULL,
    state character varying(50) NOT NULL,
    auction_type character varying(50) NOT NULL,
    visibility character varying(50) NOT NULL,
    currency character varying(3) NOT NULL,
    timezone character varying(100) NOT NULL,
    registration_start timestamp with time zone NOT NULL,
    registration_end timestamp with time zone NOT NULL,
    inspection_start timestamp with time zone,
    inspection_end timestamp with time zone,
    auction_start timestamp with time zone NOT NULL,
    auction_end timestamp with time zone NOT NULL,
    reserve_price_enabled boolean DEFAULT false NOT NULL,
    auto_extension_enabled boolean DEFAULT false NOT NULL,
    extension_minutes integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.auctions OWNER TO postgres;

--
-- Name: auctions_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auctions_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    auction_number character varying(50),
    title character varying(255),
    description character varying(2000),
    seller_profile_id uuid,
    state character varying(50),
    auction_type character varying(50),
    visibility character varying(50),
    currency character varying(3),
    timezone character varying(100),
    registration_start timestamp with time zone,
    registration_end timestamp with time zone,
    inspection_start timestamp with time zone,
    inspection_end timestamp with time zone,
    auction_start timestamp with time zone,
    auction_end timestamp with time zone,
    reserve_price_enabled boolean,
    auto_extension_enabled boolean,
    extension_minutes integer
);


ALTER TABLE public.auctions_aud OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action character varying(50) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id character varying(100),
    old_value jsonb,
    new_value jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bidder_profile_id uuid NOT NULL,
    account_holder_name character varying(150) NOT NULL,
    encrypted_account_number character varying(255) NOT NULL,
    account_hash character varying(64) NOT NULL,
    ifsc_code character varying(11) NOT NULL,
    bank_name character varying(150) NOT NULL,
    branch_name character varying(150) NOT NULL,
    verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    bank_account_type character varying(50) DEFAULT 'SAVINGS'::character varying NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    verified_at timestamp with time zone,
    verification_provider character varying(100),
    penny_drop_status character varying(50),
    penny_drop_reference character varying(100),
    penny_drop_transaction_id character varying(100),
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.bank_accounts OWNER TO postgres;

--
-- Name: bank_reconciliations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_reconciliations (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    payment_id uuid NOT NULL,
    bank_transaction_id character varying(100) NOT NULL,
    expected_amount bigint NOT NULL,
    actual_amount bigint NOT NULL,
    status character varying(30) NOT NULL,
    reconciled_at timestamp with time zone,
    notes text,
    correlation_id character varying(100) DEFAULT NULL::character varying,
    trace_id character varying(100) DEFAULT NULL::character varying,
    node_id character varying(100) DEFAULT NULL::character varying
);


ALTER TABLE public.bank_reconciliations OWNER TO postgres;

--
-- Name: bank_reconciliations_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_reconciliations_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    payment_id uuid,
    bank_transaction_id character varying(100),
    expected_amount bigint,
    actual_amount bigint,
    status character varying(30),
    reconciled_at timestamp with time zone,
    notes text,
    correlation_id character varying(100),
    trace_id character varying(100),
    node_id character varying(100)
);


ALTER TABLE public.bank_reconciliations_aud OWNER TO postgres;

--
-- Name: bid_histories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bid_histories (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    auction_lot_id uuid NOT NULL,
    old_highest_bid bigint,
    new_highest_bid bigint NOT NULL,
    winner_before_id uuid,
    winner_after_id uuid,
    "timestamp" timestamp with time zone NOT NULL,
    event_type character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.bid_histories OWNER TO postgres;

--
-- Name: bidder_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bidder_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    state character varying(50) NOT NULL,
    bidder_type character varying(50) NOT NULL,
    encrypted_pan character varying(255) NOT NULL,
    pan_hash character varying(64) NOT NULL,
    pan_verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    pan_verified_at timestamp with time zone,
    masked_aadhaar character varying(20),
    aadhaar_hash character varying(64),
    aadhaar_verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    aadhaar_verified_at timestamp with time zone,
    rejection_reason text,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.bidder_profiles OWNER TO postgres;

--
-- Name: bidder_state_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bidder_state_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bidder_profile_id uuid NOT NULL,
    from_state character varying(50) NOT NULL,
    to_state character varying(50) NOT NULL,
    changed_by_user_id uuid NOT NULL,
    transition_reason text,
    transitioned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.bidder_state_history OWNER TO postgres;

--
-- Name: bids; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bids (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    auction_lot_id uuid NOT NULL,
    bidder_id uuid NOT NULL,
    bid_amount bigint NOT NULL,
    bid_time timestamp with time zone NOT NULL,
    bid_status character varying(50) NOT NULL,
    anonymous_bidder_code character varying(50),
    ip_address character varying(45),
    user_agent character varying(255),
    is_auto_bid boolean DEFAULT false NOT NULL,
    auto_bid_limit bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.bids OWNER TO postgres;

--
-- Name: bulk_import_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bulk_import_jobs (
    id uuid NOT NULL,
    file_hash character varying(64) NOT NULL,
    status character varying(50) NOT NULL,
    total_records integer,
    processed_records integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.bulk_import_jobs OWNER TO postgres;

--
-- Name: closing_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.closing_periods (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    period_name character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    period_year integer NOT NULL,
    period_month integer NOT NULL,
    status character varying(20) NOT NULL,
    closed_at timestamp with time zone,
    closed_by uuid,
    created_by uuid,
    approved_by uuid,
    approved_at timestamp with time zone,
    reopened_by uuid,
    reopened_at timestamp with time zone,
    correlation_id character varying(100) DEFAULT NULL::character varying,
    trace_id character varying(100) DEFAULT NULL::character varying,
    node_id character varying(100) DEFAULT NULL::character varying
);


ALTER TABLE public.closing_periods OWNER TO postgres;

--
-- Name: closing_periods_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.closing_periods_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    period_name character varying(50),
    start_date date,
    end_date date,
    period_year integer,
    period_month integer,
    status character varying(20),
    closed_at timestamp with time zone,
    closed_by uuid,
    created_by uuid,
    approved_by uuid,
    approved_at timestamp with time zone,
    reopened_by uuid,
    reopened_at timestamp with time zone,
    correlation_id character varying(100),
    trace_id character varying(100),
    node_id character varying(100)
);


ALTER TABLE public.closing_periods_aud OWNER TO postgres;

--
-- Name: contract_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_versions (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    contract_id uuid NOT NULL,
    version_number integer NOT NULL,
    status character varying(50) NOT NULL,
    total_amount bigint NOT NULL,
    terms_and_conditions character varying(2000),
    changed_by character varying(255) NOT NULL,
    change_reason character varying(1000)
);


ALTER TABLE public.contract_versions OWNER TO postgres;

--
-- Name: contract_versions_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_versions_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    contract_id uuid,
    version_number integer,
    status character varying(50),
    total_amount bigint,
    terms_and_conditions character varying(2000),
    changed_by character varying(255),
    change_reason character varying(1000)
);


ALTER TABLE public.contract_versions_aud OWNER TO postgres;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    document_number character varying(100) NOT NULL,
    winner_id uuid NOT NULL,
    sale_confirmation_id uuid,
    status character varying(50) NOT NULL,
    total_amount bigint NOT NULL,
    terms_and_conditions character varying(2000)
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- Name: contracts_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    document_number character varying(100),
    winner_id uuid,
    sale_confirmation_id uuid,
    status character varying(50),
    total_amount bigint,
    terms_and_conditions character varying(2000)
);


ALTER TABLE public.contracts_aud OWNER TO postgres;

--
-- Name: disputes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disputes (
    id uuid NOT NULL,
    settlement_id uuid NOT NULL,
    contract_id uuid,
    disputed_amount bigint,
    status character varying(30) DEFAULT 'OPEN'::character varying NOT NULL,
    reason text NOT NULL,
    resolution_notes text,
    resolved_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    version bigint DEFAULT 0
);


ALTER TABLE public.disputes OWNER TO postgres;

--
-- Name: document_sequences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_sequences (
    tenant_id character varying(50) DEFAULT 'DEFAULT'::character varying NOT NULL,
    branch_code character varying(50) DEFAULT 'MAIN'::character varying NOT NULL,
    year integer DEFAULT 0 NOT NULL,
    region_code character varying(50) DEFAULT 'GLOBAL'::character varying NOT NULL,
    document_type character varying(50) NOT NULL,
    next_value bigint DEFAULT 1 NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.document_sequences OWNER TO postgres;

--
-- Name: document_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_templates (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    name character varying(100) NOT NULL,
    document_type character varying(50) NOT NULL,
    template_version integer DEFAULT 1 NOT NULL,
    content text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    description character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.document_templates OWNER TO postgres;

--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature_flags (
    id uuid NOT NULL,
    flag_key character varying(100) NOT NULL,
    description character varying(500),
    is_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    version bigint DEFAULT 0
);


ALTER TABLE public.feature_flags OWNER TO postgres;

--
-- Name: fee_invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_invoice_items (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    fee_invoice_id uuid NOT NULL,
    description character varying(500) NOT NULL,
    amount bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fee_invoice_items OWNER TO postgres;

--
-- Name: fee_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_invoices (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    document_number character varying(100) NOT NULL,
    purchase_order_id uuid NOT NULL,
    status character varying(50) NOT NULL,
    subtotal bigint NOT NULL,
    tax_amount bigint NOT NULL,
    total_amount bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.fee_invoices OWNER TO postgres;

--
-- Name: financial_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_configurations (
    config_key character varying(100) NOT NULL,
    config_value character varying(255) NOT NULL,
    description character varying(500),
    tolerance_value bigint,
    effective_from timestamp with time zone,
    effective_to timestamp with time zone,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_financial_config_dates CHECK (((effective_to IS NULL) OR (effective_from IS NULL) OR (effective_to >= effective_from)))
);


ALTER TABLE public.financial_configurations OWNER TO postgres;

--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO postgres;

--
-- Name: gst_invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gst_invoice_items (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    gst_invoice_id uuid NOT NULL,
    description character varying(500) NOT NULL,
    hsn_sac_code character varying(20),
    amount bigint NOT NULL,
    tax_rate numeric(18,2) NOT NULL,
    tax_amount bigint NOT NULL,
    total_amount bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.gst_invoice_items OWNER TO postgres;

--
-- Name: gst_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gst_invoices (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    invoice_number character varying(100) NOT NULL,
    settlement_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    subtotal bigint NOT NULL,
    total_tax bigint NOT NULL,
    total_amount bigint NOT NULL,
    status character varying(50) NOT NULL,
    pdf_url character varying(2000),
    generated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tax_version character varying(50) NOT NULL,
    effective_from timestamp with time zone NOT NULL,
    effective_to timestamp with time zone NOT NULL,
    tax_configuration_id uuid NOT NULL,
    correlation_id character varying(100),
    trace_id character varying(100),
    node_id character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.gst_invoices OWNER TO postgres;

--
-- Name: kyc_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kyc_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bidder_profile_id uuid NOT NULL,
    organization_id uuid,
    document_type character varying(50) NOT NULL,
    storage_path character varying(512) NOT NULL,
    document_hash character varying(64) NOT NULL,
    verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    rejection_reason text,
    mime_type character varying(100) NOT NULL,
    file_size bigint NOT NULL,
    malware_scanned boolean DEFAULT false NOT NULL,
    malware_detected boolean DEFAULT false NOT NULL,
    ocr_confidence double precision,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    uploaded_by_user_id uuid,
    verified_at timestamp with time zone,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.kyc_documents OWNER TO postgres;

--
-- Name: kyc_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kyc_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bidder_profile_id uuid NOT NULL,
    reviewer_user_id uuid NOT NULL,
    previous_state character varying(50) NOT NULL,
    new_state character varying(50) NOT NULL,
    decision character varying(50) NOT NULL,
    review_notes text NOT NULL,
    rejection_code character varying(50),
    reviewer_ip character varying(45),
    review_duration_ms bigint,
    reviewed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.kyc_reviews OWNER TO postgres;

--
-- Name: ledger_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_entries (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    ledger_transaction_id uuid NOT NULL,
    account_type character varying(100) NOT NULL,
    entry_type character varying(20) NOT NULL,
    amount bigint NOT NULL,
    currency character varying(10) NOT NULL,
    CONSTRAINT chk_ledger_amount CHECK (((amount)::numeric > (0)::numeric))
);


ALTER TABLE public.ledger_entries OWNER TO postgres;

--
-- Name: ledger_entries_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_entries_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    ledger_transaction_id uuid,
    account_type character varying(100),
    entry_type character varying(20),
    amount bigint,
    currency character varying(10)
);


ALTER TABLE public.ledger_entries_aud OWNER TO postgres;

--
-- Name: ledger_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_transactions (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    transaction_reference character varying(100) NOT NULL,
    description character varying(500) NOT NULL,
    status character varying(50) NOT NULL,
    settlement_id uuid,
    payment_id uuid,
    posted_at timestamp with time zone NOT NULL,
    posted_by character varying(100) NOT NULL
);


ALTER TABLE public.ledger_transactions OWNER TO postgres;

--
-- Name: ledger_transactions_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_transactions_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    transaction_reference character varying(100),
    description character varying(500),
    status character varying(50),
    settlement_id uuid,
    payment_id uuid,
    posted_at timestamp with time zone,
    posted_by character varying(100)
);


ALTER TABLE public.ledger_transactions_aud OWNER TO postgres;

--
-- Name: seller_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    state character varying(50) NOT NULL,
    seller_type character varying(50) NOT NULL,
    encrypted_pan character varying(255),
    pan_hash character varying(64),
    pan_verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    pan_verified_at timestamp with time zone,
    rejection_reason text,
    suspension_reason text,
    blacklist_reason text,
    onboarded_at timestamp with time zone,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_profiles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    mobile character varying(15),
    user_type character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    mobile_verified boolean DEFAULT false NOT NULL,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    locked_at timestamp with time zone,
    password_expires_at timestamp with time zone,
    last_login_at timestamp with time zone,
    last_password_change_at timestamp with time zone,
    version bigint DEFAULT 0 NOT NULL,
    created_by character varying(50),
    updated_by character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: mv_tenant_performance_kpis; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_tenant_performance_kpis AS
 SELECT COALESCE(u.id, '00000000-0000-0000-0000-000000000000'::uuid) AS tenant_id,
    count(DISTINCT a.id) AS total_auctions,
    count(DISTINCT
        CASE
            WHEN ((a.state)::text = ANY ((ARRAY['ENDED'::character varying, 'SETTLED'::character varying])::text[])) THEN a.id
            ELSE NULL::uuid
        END) AS completed_auctions,
    count(DISTINCT
        CASE
            WHEN ((a.state)::text = 'LIVE'::text) THEN a.id
            ELSE NULL::uuid
        END) AS active_auctions,
    COALESCE(sum(aw.winning_amount), (0)::numeric) AS total_gmv,
    count(DISTINCT b.id) AS total_bids
   FROM (((((public.users u
     LEFT JOIN public.seller_profiles sp ON ((sp.user_id = u.id)))
     LEFT JOIN public.auctions a ON ((a.seller_profile_id = sp.id)))
     LEFT JOIN public.auction_lots al ON ((al.auction_id = a.id)))
     LEFT JOIN public.auction_winners aw ON ((aw.auction_lot_id = al.id)))
     LEFT JOIN public.bids b ON ((b.auction_lot_id = al.id)))
  GROUP BY u.id
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_tenant_performance_kpis OWNER TO postgres;

--
-- Name: notification_deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_deliveries (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    notification_id uuid NOT NULL,
    channel character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    provider_name character varying(100),
    tracking_id character varying(255),
    error_code character varying(100),
    error_message text,
    retry_count integer DEFAULT 0 NOT NULL,
    next_retry_at timestamp with time zone,
    sent_at timestamp with time zone
);


ALTER TABLE public.notification_deliveries OWNER TO postgres;

--
-- Name: notification_deliveries_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_deliveries_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    notification_id uuid,
    channel character varying(50),
    status character varying(50),
    provider_name character varying(100),
    tracking_id character varying(255),
    error_code character varying(100),
    error_message text,
    retry_count integer,
    next_retry_at timestamp with time zone,
    sent_at timestamp with time zone
);


ALTER TABLE public.notification_deliveries_aud OWNER TO postgres;

--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    user_id uuid NOT NULL,
    channel character varying(50) NOT NULL,
    notification_type character varying(50) NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL
);


ALTER TABLE public.notification_preferences OWNER TO postgres;

--
-- Name: notification_preferences_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    user_id uuid,
    channel character varying(50),
    notification_type character varying(50),
    is_enabled boolean
);


ALTER TABLE public.notification_preferences_aud OWNER TO postgres;

--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_templates (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    name character varying(100) NOT NULL,
    template_version integer DEFAULT 1 NOT NULL,
    effective_from timestamp with time zone,
    effective_to timestamp with time zone,
    notification_type character varying(50) NOT NULL,
    channel character varying(50) NOT NULL,
    subject_template character varying(255),
    body_template text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.notification_templates OWNER TO postgres;

--
-- Name: notification_templates_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_templates_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    name character varying(100),
    template_version integer,
    effective_from timestamp with time zone,
    effective_to timestamp with time zone,
    notification_type character varying(50),
    channel character varying(50),
    subject_template character varying(255),
    body_template text,
    is_active boolean
);


ALTER TABLE public.notification_templates_aud OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    user_id uuid NOT NULL,
    channel character varying(50) NOT NULL,
    priority character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    notification_type character varying(50) NOT NULL,
    template_version integer,
    title character varying(200),
    body text NOT NULL,
    scheduled_at timestamp with time zone,
    read_at timestamp with time zone,
    archived_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    user_id uuid,
    channel character varying(50),
    priority character varying(50),
    status character varying(50),
    notification_type character varying(50),
    template_version integer,
    title character varying(200),
    body text,
    scheduled_at timestamp with time zone,
    read_at timestamp with time zone,
    archived_at timestamp with time zone
);


ALTER TABLE public.notifications_aud OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bidder_profile_id uuid NOT NULL,
    organization_name character varying(255) NOT NULL,
    organization_type character varying(50) NOT NULL,
    registration_number character varying(100) NOT NULL,
    cin character varying(21),
    gstin character varying(15),
    gst_verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    gst_verified_at timestamp with time zone,
    registration_authority character varying(150),
    registered_address text NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: outbox_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.outbox_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    aggregate_id uuid NOT NULL,
    aggregate_type character varying(100) NOT NULL,
    event_type character varying(100) NOT NULL,
    payload text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    error_message text,
    last_attempt_time timestamp with time zone,
    next_retry_time timestamp with time zone,
    last_failure_reason text,
    exception_class character varying(255),
    stack_trace_summary text,
    processing_node character varying(255),
    dead_letter_timestamp timestamp with time zone,
    processed_at timestamp with time zone,
    event_version character varying(50) DEFAULT '1.0'::character varying NOT NULL,
    schema_version character varying(50) DEFAULT '1.0'::character varying NOT NULL,
    aggregate_version bigint DEFAULT 1 NOT NULL,
    correlation_id character varying(100),
    trace_id character varying(100),
    node_id character varying(100),
    version bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.outbox_events OWNER TO postgres;

--
-- Name: payment_advices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_advices (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    advice_number character varying(100) NOT NULL,
    settlement_id uuid NOT NULL,
    amount_due bigint NOT NULL,
    due_date timestamp with time zone NOT NULL,
    status character varying(50) NOT NULL
);


ALTER TABLE public.payment_advices OWNER TO postgres;

--
-- Name: payment_advices_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_advices_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    advice_number character varying(100),
    settlement_id uuid,
    amount_due bigint,
    due_date timestamp with time zone,
    status character varying(50)
);


ALTER TABLE public.payment_advices_aud OWNER TO postgres;

--
-- Name: payment_allocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_allocations (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    payment_id uuid NOT NULL,
    settlement_id uuid NOT NULL,
    allocated_amount bigint NOT NULL,
    allocation_type character varying(100) NOT NULL,
    allocated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payment_allocations OWNER TO postgres;

--
-- Name: payment_allocations_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_allocations_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    payment_id uuid,
    settlement_id uuid,
    allocated_amount bigint,
    allocation_type character varying(100),
    allocated_at timestamp with time zone
);


ALTER TABLE public.payment_allocations_aud OWNER TO postgres;

--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_transactions (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    payment_id uuid NOT NULL,
    gateway_reference character varying(255),
    amount bigint NOT NULL,
    status character varying(50) NOT NULL,
    error_message character varying(1000),
    completed_at timestamp with time zone
);


ALTER TABLE public.payment_transactions OWNER TO postgres;

--
-- Name: payment_transactions_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_transactions_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    payment_id uuid,
    gateway_reference character varying(255),
    amount bigint,
    status character varying(50),
    error_message character varying(1000),
    completed_at timestamp with time zone
);


ALTER TABLE public.payment_transactions_aud OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    payment_number character varying(100) NOT NULL,
    settlement_id uuid NOT NULL,
    status character varying(50) NOT NULL,
    total_amount bigint NOT NULL,
    reference_number character varying(255),
    payment_method character varying(100),
    payment_date timestamp with time zone
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    payment_number character varying(100),
    settlement_id uuid,
    status character varying(50),
    total_amount bigint,
    reference_number character varying(255),
    payment_method character varying(100),
    payment_date timestamp with time zone
);


ALTER TABLE public.payments_aud OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    description text,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_order_items (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    purchase_order_id uuid NOT NULL,
    item_description character varying(500) NOT NULL,
    quantity integer NOT NULL,
    unit_price bigint NOT NULL,
    line_total bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.purchase_order_items OWNER TO postgres;

--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    document_number character varying(100) NOT NULL,
    sale_confirmation_id uuid NOT NULL,
    status character varying(50) NOT NULL,
    total_amount bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    token_family_id character varying(100) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    replaced_by_token_hash character varying(255),
    ip_address character varying(45),
    user_agent text,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: refunds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refunds (
    id uuid NOT NULL,
    amount bigint NOT NULL,
    initiator_id uuid NOT NULL,
    first_approver_id uuid,
    second_approver_id uuid,
    status character varying(50) NOT NULL,
    rejection_reason character varying(255),
    audit_log text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.refunds OWNER TO postgres;

--
-- Name: report_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_schedules (
    id uuid NOT NULL,
    report_type character varying(50) NOT NULL,
    report_format character varying(20) NOT NULL,
    cron_expression character varying(100) NOT NULL,
    recipient_email character varying(255) NOT NULL,
    filters_json text,
    tenant_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    version bigint DEFAULT 0
);


ALTER TABLE public.report_schedules OWNER TO postgres;

--
-- Name: revinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revinfo (
    rev integer NOT NULL,
    revtstmp bigint
);


ALTER TABLE public.revinfo OWNER TO postgres;

--
-- Name: revinfo_rev_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.revinfo ALTER COLUMN rev ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.revinfo_rev_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(255),
    system_role boolean DEFAULT false NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: sale_confirmation_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale_confirmation_versions (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    sale_confirmation_id uuid NOT NULL,
    version_number integer NOT NULL,
    status character varying(50) NOT NULL,
    sale_amount bigint NOT NULL,
    terms_and_conditions character varying(2000),
    changed_by character varying(255) NOT NULL,
    change_reason character varying(1000),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.sale_confirmation_versions OWNER TO postgres;

--
-- Name: sale_confirmations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale_confirmations (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    confirmation_number character varying(100),
    document_number character varying(100),
    winner_id uuid,
    status character varying(50),
    sale_amount bigint,
    terms_and_conditions character varying(2000)
);


ALTER TABLE public.sale_confirmations OWNER TO postgres;

--
-- Name: seller_companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_profile_id uuid NOT NULL,
    company_name character varying(255) NOT NULL,
    registration_number character varying(100) NOT NULL,
    gstin character varying(15),
    gst_verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    gst_verified_at timestamp with time zone,
    registered_address text NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_companies OWNER TO postgres;

--
-- Name: seller_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_profile_id uuid NOT NULL,
    document_type character varying(50) NOT NULL,
    storage_path character varying(512) NOT NULL,
    document_hash character varying(64) NOT NULL,
    verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    rejection_reason text,
    mime_type character varying(100) NOT NULL,
    file_size bigint NOT NULL,
    verified_at timestamp with time zone,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_documents OWNER TO postgres;

--
-- Name: seller_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_profile_id uuid NOT NULL,
    reviewer_user_id uuid NOT NULL,
    previous_state character varying(50) NOT NULL,
    new_state character varying(50) NOT NULL,
    decision character varying(50) NOT NULL,
    review_notes text NOT NULL,
    reviewed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_reviews OWNER TO postgres;

--
-- Name: seller_state_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_state_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_profile_id uuid NOT NULL,
    from_state character varying(50) NOT NULL,
    to_state character varying(50) NOT NULL,
    changed_by_user_id uuid NOT NULL,
    transition_reason text,
    transitioned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_state_history OWNER TO postgres;

--
-- Name: seller_warehouses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_warehouses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_profile_id uuid NOT NULL,
    warehouse_name character varying(150) NOT NULL,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    contact_person character varying(150) NOT NULL,
    contact_number character varying(20) NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    verified_at timestamp with time zone,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.seller_warehouses OWNER TO postgres;

--
-- Name: settlement_histories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlement_histories (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    settlement_id uuid NOT NULL,
    actor character varying(255) NOT NULL,
    action_timestamp timestamp with time zone NOT NULL,
    previous_status character varying(50),
    current_status character varying(50) NOT NULL,
    reason character varying(1000),
    remarks text,
    correlation_id character varying(255),
    request_source character varying(255),
    ip_address character varying(50)
);


ALTER TABLE public.settlement_histories OWNER TO postgres;

--
-- Name: settlement_histories_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlement_histories_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    settlement_id uuid,
    actor character varying(255),
    action_timestamp timestamp with time zone,
    previous_status character varying(50),
    current_status character varying(50),
    reason character varying(1000),
    remarks text,
    correlation_id character varying(255),
    request_source character varying(255),
    ip_address character varying(50)
);


ALTER TABLE public.settlement_histories_aud OWNER TO postgres;

--
-- Name: settlement_reconciliations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlement_reconciliations (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    settlement_id uuid NOT NULL,
    payment_id uuid,
    ledger_batch_id uuid,
    gst_invoice_id uuid,
    status character varying(30) NOT NULL,
    notes text,
    reconciled_at timestamp with time zone,
    correlation_id character varying(100) DEFAULT NULL::character varying,
    trace_id character varying(100) DEFAULT NULL::character varying,
    node_id character varying(100) DEFAULT NULL::character varying
);


ALTER TABLE public.settlement_reconciliations OWNER TO postgres;

--
-- Name: settlement_reconciliations_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlement_reconciliations_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    settlement_id uuid,
    payment_id uuid,
    ledger_batch_id uuid,
    gst_invoice_id uuid,
    status character varying(30),
    notes text,
    reconciled_at timestamp with time zone,
    correlation_id character varying(100),
    trace_id character varying(100),
    node_id character varying(100)
);


ALTER TABLE public.settlement_reconciliations_aud OWNER TO postgres;

--
-- Name: settlements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlements (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    contract_id uuid NOT NULL,
    status character varying(50) NOT NULL,
    contract_number character varying(100) NOT NULL,
    winner_id uuid NOT NULL,
    buyer_snapshot text NOT NULL,
    seller_snapshot text NOT NULL,
    auction_snapshot text NOT NULL,
    lot_snapshot text NOT NULL,
    winning_amount bigint NOT NULL,
    currency character varying(10) NOT NULL,
    tax_snapshot text NOT NULL,
    generated_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_by character varying(255),
    completed_at timestamp with time zone,
    completion_remarks text,
    cancelled_by character varying(255),
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    platform_fee bigint DEFAULT 0,
    tax_amount bigint DEFAULT 0,
    payout_amount bigint DEFAULT 0
);


ALTER TABLE public.settlements OWNER TO postgres;

--
-- Name: settlements_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlements_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    contract_id uuid,
    status character varying(50),
    contract_number character varying(100),
    winner_id uuid,
    buyer_snapshot text,
    seller_snapshot text,
    auction_snapshot text,
    lot_snapshot text,
    winning_amount bigint,
    currency character varying(10),
    tax_snapshot text,
    generated_timestamp timestamp with time zone,
    completed_by character varying(255),
    completed_at timestamp with time zone,
    completion_remarks text,
    cancelled_by character varying(255),
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    platform_fee bigint,
    tax_amount bigint,
    payout_amount bigint
);


ALTER TABLE public.settlements_aud OWNER TO postgres;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    id uuid NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    category character varying(50) NOT NULL,
    status character varying(30) DEFAULT 'OPEN'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'MEDIUM'::character varying NOT NULL,
    assigned_to uuid,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    version bigint DEFAULT 0
);


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: tax_breakups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_breakups (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    settlement_id uuid NOT NULL,
    tax_name character varying(100) NOT NULL,
    tax_rate numeric(5,2) NOT NULL,
    taxable_basis bigint NOT NULL,
    calculated_tax bigint NOT NULL
);


ALTER TABLE public.tax_breakups OWNER TO postgres;

--
-- Name: tax_breakups_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_breakups_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    settlement_id uuid,
    tax_name character varying(100),
    tax_rate numeric(5,2),
    taxable_basis bigint,
    calculated_tax bigint
);


ALTER TABLE public.tax_breakups_aud OWNER TO postgres;

--
-- Name: tax_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_configurations (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    region_code character varying(50) NOT NULL,
    tax_name character varying(100) NOT NULL,
    rate numeric(5,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.tax_configurations OWNER TO postgres;

--
-- Name: tax_configurations_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_configurations_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    region_code character varying(50),
    tax_name character varying(100),
    rate numeric(5,2),
    is_active boolean
);


ALTER TABLE public.tax_configurations_aud OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: vw_revenue_gst_ledger_reconciliation; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_revenue_gst_ledger_reconciliation AS
 SELECT cl.id AS contract_id,
    cl.document_number AS contract_number,
    b.id AS bidder_profile_id,
    u.id AS user_id,
    u.email AS user_email,
    l.id AS ledger_entry_id,
    l.account_type,
    l.entry_type,
    l.amount,
    g.id AS gst_invoice_id,
    g.total_tax,
    cl.created_at AS transaction_time
   FROM (((((((public.contracts cl
     LEFT JOIN public.auction_winners aw ON ((cl.winner_id = aw.id)))
     LEFT JOIN public.bidder_profiles b ON ((aw.bidder_id = b.id)))
     LEFT JOIN public.users u ON ((b.user_id = u.id)))
     LEFT JOIN public.settlements s ON ((s.contract_id = cl.id)))
     LEFT JOIN public.ledger_transactions lt ON ((lt.settlement_id = s.id)))
     LEFT JOIN public.ledger_entries l ON ((l.ledger_transaction_id = lt.id)))
     LEFT JOIN public.gst_invoices g ON ((g.settlement_id = s.id)));


ALTER VIEW public.vw_revenue_gst_ledger_reconciliation OWNER TO postgres;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    user_id uuid NOT NULL,
    available_balance bigint DEFAULT 0 NOT NULL,
    locked_balance bigint DEFAULT 0 NOT NULL,
    currency character varying(10) NOT NULL,
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    permanent_emd bigint DEFAULT 0,
    refund_pending bigint DEFAULT 0,
    settlement_pending bigint DEFAULT 0
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Name: wallets_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    user_id uuid,
    available_balance bigint,
    locked_balance bigint,
    currency character varying(10),
    last_updated timestamp with time zone,
    permanent_emd bigint,
    refund_pending bigint,
    settlement_pending bigint
);


ALTER TABLE public.wallets_aud OWNER TO postgres;

--
-- Name: winner_histories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.winner_histories (
    id uuid NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    winner_id uuid NOT NULL,
    previous_status character varying(50),
    new_status character varying(50) NOT NULL,
    action_by character varying(100) NOT NULL,
    action_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks character varying(1000),
    actor_id uuid,
    actor_type character varying(50),
    reason character varying(255),
    comments character varying(1000),
    correlation_id character varying(100),
    ip_address character varying(45),
    user_agent character varying(500),
    action_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.winner_histories OWNER TO postgres;

--
-- Name: winner_histories_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.winner_histories_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    winner_id uuid,
    previous_status character varying(50),
    new_status character varying(50),
    action_by character varying(100),
    action_at timestamp with time zone,
    remarks character varying(1000),
    actor_id uuid,
    actor_type character varying(50),
    reason character varying(255),
    comments character varying(1000),
    correlation_id character varying(100),
    ip_address character varying(45),
    user_agent character varying(500),
    action_timestamp timestamp with time zone
);


ALTER TABLE public.winner_histories_aud OWNER TO postgres;

--
-- Name: auction_bidder_authorizations_aud auction_bidder_authorizations_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_bidder_authorizations_aud
    ADD CONSTRAINT auction_bidder_authorizations_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: auction_bidder_authorizations auction_bidder_authorizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_bidder_authorizations
    ADD CONSTRAINT auction_bidder_authorizations_pkey PRIMARY KEY (id);


--
-- Name: auction_events_aud auction_events_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_events_aud
    ADD CONSTRAINT auction_events_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: auction_events auction_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_events
    ADD CONSTRAINT auction_events_pkey PRIMARY KEY (id);


--
-- Name: auction_lots_aud auction_lots_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_lots_aud
    ADD CONSTRAINT auction_lots_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: auction_lots auction_lots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_lots
    ADD CONSTRAINT auction_lots_pkey PRIMARY KEY (id);


--
-- Name: auction_results auction_results_auction_lot_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_results
    ADD CONSTRAINT auction_results_auction_lot_id_key UNIQUE (auction_lot_id);


--
-- Name: auction_results_aud auction_results_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_results_aud
    ADD CONSTRAINT auction_results_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: auction_results auction_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_results
    ADD CONSTRAINT auction_results_pkey PRIMARY KEY (id);


--
-- Name: auction_settings auction_settings_auction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_settings
    ADD CONSTRAINT auction_settings_auction_id_key UNIQUE (auction_id);


--
-- Name: auction_settings_aud auction_settings_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_settings_aud
    ADD CONSTRAINT auction_settings_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: auction_settings auction_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_settings
    ADD CONSTRAINT auction_settings_pkey PRIMARY KEY (id);


--
-- Name: auction_state_history auction_state_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_state_history
    ADD CONSTRAINT auction_state_history_pkey PRIMARY KEY (id);


--
-- Name: auction_winners auction_winners_auction_lot_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_winners
    ADD CONSTRAINT auction_winners_auction_lot_id_key UNIQUE (auction_lot_id);


--
-- Name: auction_winners_aud auction_winners_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_winners_aud
    ADD CONSTRAINT auction_winners_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: auction_winners auction_winners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_winners
    ADD CONSTRAINT auction_winners_pkey PRIMARY KEY (id);


--
-- Name: auctions_aud auctions_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auctions_aud
    ADD CONSTRAINT auctions_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: auctions auctions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: bank_reconciliations_aud bank_reconciliations_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_reconciliations_aud
    ADD CONSTRAINT bank_reconciliations_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: bank_reconciliations bank_reconciliations_bank_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_bank_transaction_id_key UNIQUE (bank_transaction_id);


--
-- Name: bank_reconciliations bank_reconciliations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_pkey PRIMARY KEY (id);


--
-- Name: bid_histories bid_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bid_histories
    ADD CONSTRAINT bid_histories_pkey PRIMARY KEY (id);


--
-- Name: bidder_profiles bidder_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bidder_profiles
    ADD CONSTRAINT bidder_profiles_pkey PRIMARY KEY (id);


--
-- Name: bidder_profiles bidder_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bidder_profiles
    ADD CONSTRAINT bidder_profiles_user_id_key UNIQUE (user_id);


--
-- Name: bidder_state_history bidder_state_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bidder_state_history
    ADD CONSTRAINT bidder_state_history_pkey PRIMARY KEY (id);


--
-- Name: bids bids_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (id);


--
-- Name: bulk_import_jobs bulk_import_jobs_file_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulk_import_jobs
    ADD CONSTRAINT bulk_import_jobs_file_hash_key UNIQUE (file_hash);


--
-- Name: bulk_import_jobs bulk_import_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulk_import_jobs
    ADD CONSTRAINT bulk_import_jobs_pkey PRIMARY KEY (id);


--
-- Name: closing_periods_aud closing_periods_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.closing_periods_aud
    ADD CONSTRAINT closing_periods_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: closing_periods closing_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.closing_periods
    ADD CONSTRAINT closing_periods_pkey PRIMARY KEY (id);


--
-- Name: contract_versions_aud contract_versions_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions_aud
    ADD CONSTRAINT contract_versions_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: contract_versions contract_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_pkey PRIMARY KEY (id);


--
-- Name: contracts_aud contracts_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts_aud
    ADD CONSTRAINT contracts_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: contracts contracts_document_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_document_number_key UNIQUE (document_number);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: document_sequences document_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_sequences
    ADD CONSTRAINT document_sequences_pkey PRIMARY KEY (tenant_id, branch_code, year, region_code, document_type);


--
-- Name: document_templates document_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_templates
    ADD CONSTRAINT document_templates_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_flag_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_flag_key_key UNIQUE (flag_key);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: fee_invoice_items fee_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoice_items
    ADD CONSTRAINT fee_invoice_items_pkey PRIMARY KEY (id);


--
-- Name: fee_invoices fee_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT fee_invoices_pkey PRIMARY KEY (id);


--
-- Name: financial_configurations financial_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_configurations
    ADD CONSTRAINT financial_configurations_pkey PRIMARY KEY (config_key);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: gst_invoice_items gst_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gst_invoice_items
    ADD CONSTRAINT gst_invoice_items_pkey PRIMARY KEY (id);


--
-- Name: gst_invoices gst_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gst_invoices
    ADD CONSTRAINT gst_invoices_pkey PRIMARY KEY (id);


--
-- Name: kyc_documents kyc_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_pkey PRIMARY KEY (id);


--
-- Name: kyc_reviews kyc_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kyc_reviews
    ADD CONSTRAINT kyc_reviews_pkey PRIMARY KEY (id);


--
-- Name: ledger_entries_aud ledger_entries_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entries_aud
    ADD CONSTRAINT ledger_entries_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: ledger_entries ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: ledger_transactions_aud ledger_transactions_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_transactions_aud
    ADD CONSTRAINT ledger_transactions_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: ledger_transactions ledger_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_transactions
    ADD CONSTRAINT ledger_transactions_pkey PRIMARY KEY (id);


--
-- Name: ledger_transactions ledger_transactions_transaction_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_transactions
    ADD CONSTRAINT ledger_transactions_transaction_reference_key UNIQUE (transaction_reference);


--
-- Name: notification_deliveries_aud notification_deliveries_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_deliveries_aud
    ADD CONSTRAINT notification_deliveries_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: notification_deliveries notification_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT notification_deliveries_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences_aud notification_preferences_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences_aud
    ADD CONSTRAINT notification_preferences_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_channel_notification_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_channel_notification_type_key UNIQUE (user_id, channel, notification_type);


--
-- Name: notification_templates_aud notification_templates_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates_aud
    ADD CONSTRAINT notification_templates_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: notification_templates notification_templates_name_template_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_name_template_version_key UNIQUE (name, template_version);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- Name: notifications_aud notifications_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications_aud
    ADD CONSTRAINT notifications_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_bidder_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_bidder_profile_id_key UNIQUE (bidder_profile_id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: outbox_events outbox_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_pkey PRIMARY KEY (id);


--
-- Name: payment_advices payment_advices_advice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_advices
    ADD CONSTRAINT payment_advices_advice_number_key UNIQUE (advice_number);


--
-- Name: payment_advices_aud payment_advices_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_advices_aud
    ADD CONSTRAINT payment_advices_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: payment_advices payment_advices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_advices
    ADD CONSTRAINT payment_advices_pkey PRIMARY KEY (id);


--
-- Name: payment_advices payment_advices_settlement_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_advices
    ADD CONSTRAINT payment_advices_settlement_id_key UNIQUE (settlement_id);


--
-- Name: payment_allocations_aud payment_allocations_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations_aud
    ADD CONSTRAINT payment_allocations_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: payment_allocations payment_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions_aud payment_transactions_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions_aud
    ADD CONSTRAINT payment_transactions_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: payments_aud payments_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments_aud
    ADD CONSTRAINT payments_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: payments payments_payment_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_number_key UNIQUE (payment_number);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_reference_number_key UNIQUE (reference_number);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: report_schedules report_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_pkey PRIMARY KEY (id);


--
-- Name: revinfo revinfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revinfo
    ADD CONSTRAINT revinfo_pkey PRIMARY KEY (rev);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sale_confirmation_versions sale_confirmation_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_confirmation_versions
    ADD CONSTRAINT sale_confirmation_versions_pkey PRIMARY KEY (id);


--
-- Name: sale_confirmations sale_confirmations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_confirmations
    ADD CONSTRAINT sale_confirmations_pkey PRIMARY KEY (id);


--
-- Name: seller_companies seller_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_companies
    ADD CONSTRAINT seller_companies_pkey PRIMARY KEY (id);


--
-- Name: seller_companies seller_companies_seller_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_companies
    ADD CONSTRAINT seller_companies_seller_profile_id_key UNIQUE (seller_profile_id);


--
-- Name: seller_documents seller_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_documents
    ADD CONSTRAINT seller_documents_pkey PRIMARY KEY (id);


--
-- Name: seller_profiles seller_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_profiles
    ADD CONSTRAINT seller_profiles_pkey PRIMARY KEY (id);


--
-- Name: seller_profiles seller_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_profiles
    ADD CONSTRAINT seller_profiles_user_id_key UNIQUE (user_id);


--
-- Name: seller_reviews seller_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_reviews
    ADD CONSTRAINT seller_reviews_pkey PRIMARY KEY (id);


--
-- Name: seller_state_history seller_state_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_state_history
    ADD CONSTRAINT seller_state_history_pkey PRIMARY KEY (id);


--
-- Name: seller_warehouses seller_warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_warehouses
    ADD CONSTRAINT seller_warehouses_pkey PRIMARY KEY (id);


--
-- Name: settlement_histories_aud settlement_histories_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_histories_aud
    ADD CONSTRAINT settlement_histories_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: settlement_histories settlement_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_histories
    ADD CONSTRAINT settlement_histories_pkey PRIMARY KEY (id);


--
-- Name: settlement_reconciliations_aud settlement_reconciliations_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_reconciliations_aud
    ADD CONSTRAINT settlement_reconciliations_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: settlement_reconciliations settlement_reconciliations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_reconciliations
    ADD CONSTRAINT settlement_reconciliations_pkey PRIMARY KEY (id);


--
-- Name: settlements_aud settlements_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements_aud
    ADD CONSTRAINT settlements_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: settlements settlements_contract_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_contract_id_key UNIQUE (contract_id);


--
-- Name: settlements settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: tax_breakups_aud tax_breakups_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_breakups_aud
    ADD CONSTRAINT tax_breakups_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: tax_breakups tax_breakups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_breakups
    ADD CONSTRAINT tax_breakups_pkey PRIMARY KEY (id);


--
-- Name: tax_configurations_aud tax_configurations_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_configurations_aud
    ADD CONSTRAINT tax_configurations_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: tax_configurations tax_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_configurations
    ADD CONSTRAINT tax_configurations_pkey PRIMARY KEY (id);


--
-- Name: auction_bidder_authorizations uq_auction_bidder; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_bidder_authorizations
    ADD CONSTRAINT uq_auction_bidder UNIQUE (auction_id, bidder_id);


--
-- Name: fee_invoices uq_fi_document_number; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT uq_fi_document_number UNIQUE (document_number);


--
-- Name: fee_invoices uq_fi_po; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT uq_fi_po UNIQUE (purchase_order_id);


--
-- Name: gst_invoices uq_gst_invoice_number; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gst_invoices
    ADD CONSTRAINT uq_gst_invoice_number UNIQUE (invoice_number);


--
-- Name: gst_invoices uq_gst_settlement; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gst_invoices
    ADD CONSTRAINT uq_gst_settlement UNIQUE (settlement_id);


--
-- Name: purchase_orders uq_po_document_number; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT uq_po_document_number UNIQUE (document_number);


--
-- Name: purchase_orders uq_po_sc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT uq_po_sc UNIQUE (sale_confirmation_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallets_aud wallets_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets_aud
    ADD CONSTRAINT wallets_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);


--
-- Name: winner_histories_aud winner_histories_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winner_histories_aud
    ADD CONSTRAINT winner_histories_aud_pkey PRIMARY KEY (id, rev);


--
-- Name: winner_histories winner_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winner_histories
    ADD CONSTRAINT winner_histories_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_advice_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_advice_number ON public.payment_advices USING btree (advice_number);


--
-- Name: idx_auction_events_auction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_events_auction_id ON public.auction_events USING btree (auction_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_auction_events_lot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_events_lot_id ON public.auction_events USING btree (lot_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_auction_events_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_events_timestamp ON public.auction_events USING btree ("timestamp") WHERE (deleted_at IS NULL);


--
-- Name: idx_auction_lots_auction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_lots_auction_id ON public.auction_lots USING btree (auction_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_auction_lots_number_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_auction_lots_number_active ON public.auction_lots USING btree (auction_id, lower((lot_number)::text)) WHERE (deleted_at IS NULL);


--
-- Name: idx_auction_lots_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_lots_status ON public.auction_lots USING btree (lot_status) WHERE (deleted_at IS NULL);


--
-- Name: idx_auction_lots_winner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_lots_winner ON public.auction_lots USING btree (winner_bidder_id);


--
-- Name: idx_auction_number_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_auction_number_active ON public.auctions USING btree (lower((auction_number)::text)) WHERE (deleted_at IS NULL);


--
-- Name: idx_auction_results_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_results_aud_rev ON public.auction_results_aud USING btree (rev);


--
-- Name: idx_auction_results_lot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_results_lot_id ON public.auction_results USING btree (auction_lot_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_auction_results_winner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_results_winner ON public.auction_results USING btree (winner_id);


--
-- Name: idx_auction_settings_auction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_settings_auction_id ON public.auction_settings USING btree (auction_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_auction_winners_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_winners_aud_rev ON public.auction_winners_aud USING btree (rev);


--
-- Name: idx_auction_winners_bid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_winners_bid ON public.auction_winners USING btree (bid_id);


--
-- Name: idx_auction_winners_bidder_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_winners_bidder_id ON public.auction_winners USING btree (bidder_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_auction_winners_lot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auction_winners_lot_id ON public.auction_winners USING btree (auction_lot_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_auctions_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auctions_dates ON public.auctions USING btree (auction_start, auction_end) WHERE (deleted_at IS NULL);


--
-- Name: idx_auctions_registration_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auctions_registration_dates ON public.auctions USING btree (registration_start, registration_end) WHERE (deleted_at IS NULL);


--
-- Name: idx_auctions_seller_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auctions_seller_profile ON public.auctions USING btree (seller_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_auctions_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auctions_state ON public.auctions USING btree (state) WHERE (deleted_at IS NULL);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_auth_bidder; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auth_bidder ON public.auction_bidder_authorizations USING btree (bidder_id);


--
-- Name: idx_bank_accounts_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_accounts_profile ON public.bank_accounts USING btree (bidder_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bank_recon_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_recon_aud_rev ON public.bank_reconciliations_aud USING btree (rev);


--
-- Name: idx_bank_recon_payment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_recon_payment ON public.bank_reconciliations USING btree (payment_id);


--
-- Name: idx_bid_histories_lot_id_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bid_histories_lot_id_timestamp ON public.bid_histories USING btree (auction_lot_id, "timestamp" DESC) WHERE (deleted_at IS NULL);


--
-- Name: idx_bid_histories_winner_after; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bid_histories_winner_after ON public.bid_histories USING btree (winner_after_id);


--
-- Name: idx_bid_histories_winner_before; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bid_histories_winner_before ON public.bid_histories USING btree (winner_before_id);


--
-- Name: idx_bidder_pan_hash_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_bidder_pan_hash_active ON public.bidder_profiles USING btree (pan_hash) WHERE (deleted_at IS NULL);


--
-- Name: idx_bidder_profile_active_aadhaar; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_bidder_profile_active_aadhaar ON public.bidder_profiles USING btree (aadhaar_hash) WHERE ((deleted_at IS NULL) AND (aadhaar_hash IS NOT NULL));


--
-- Name: idx_bidder_profile_active_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_bidder_profile_active_user ON public.bidder_profiles USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bidder_profiles_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bidder_profiles_state ON public.bidder_profiles USING btree (state) WHERE (deleted_at IS NULL);


--
-- Name: idx_bids_auction_lot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bids_auction_lot_id ON public.bids USING btree (auction_lot_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bids_bid_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bids_bid_time ON public.bids USING btree (bid_time DESC) WHERE (deleted_at IS NULL);


--
-- Name: idx_bids_bidder_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bids_bidder_id ON public.bids USING btree (bidder_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bids_winning_unique_per_lot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_bids_winning_unique_per_lot ON public.bids USING btree (auction_lot_id) WHERE (((bid_status)::text = 'WINNING'::text) AND (deleted_at IS NULL));


--
-- Name: idx_bulk_import_file_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_bulk_import_file_hash ON public.bulk_import_jobs USING btree (file_hash);


--
-- Name: idx_closing_periods_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_closing_periods_aud_rev ON public.closing_periods_aud USING btree (rev);


--
-- Name: idx_closing_periods_year_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_closing_periods_year_month ON public.closing_periods USING btree (period_year, period_month);


--
-- Name: idx_contract_versions_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contract_versions_aud_rev ON public.contract_versions_aud USING btree (rev);


--
-- Name: idx_contract_versions_contract; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contract_versions_contract ON public.contract_versions USING btree (contract_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_contracts_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_aud_rev ON public.contracts_aud USING btree (rev);


--
-- Name: idx_contracts_doc_num; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_doc_num ON public.contracts USING btree (document_number) WHERE (deleted_at IS NULL);


--
-- Name: idx_contracts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_status ON public.contracts USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_contracts_winner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_contracts_winner ON public.contracts USING btree (winner_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_contracts_winning_bidder; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_winning_bidder ON public.contracts USING btree (winner_id, status);


--
-- Name: idx_doc_template_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doc_template_type ON public.document_templates USING btree (document_type);


--
-- Name: idx_gst_invoice_recon_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gst_invoice_recon_lookup ON public.gst_invoices USING btree (settlement_id, total_tax);


--
-- Name: idx_kyc_documents_active_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_kyc_documents_active_hash ON public.kyc_documents USING btree (document_hash) WHERE (deleted_at IS NULL);


--
-- Name: idx_kyc_documents_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kyc_documents_profile ON public.kyc_documents USING btree (bidder_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_kyc_reviews_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kyc_reviews_profile ON public.kyc_reviews USING btree (bidder_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_ledger_entries_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_entries_aud_rev ON public.ledger_entries_aud USING btree (rev);


--
-- Name: idx_ledger_entries_recon_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_entries_recon_lookup ON public.ledger_entries USING btree (account_type, entry_type, amount);


--
-- Name: idx_ledger_entries_tx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_entries_tx ON public.ledger_entries USING btree (ledger_transaction_id);


--
-- Name: idx_ledger_tx_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_tx_aud_rev ON public.ledger_transactions_aud USING btree (rev);


--
-- Name: idx_ledger_tx_payment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_tx_payment ON public.ledger_transactions USING btree (payment_id);


--
-- Name: idx_ledger_tx_ref; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_tx_ref ON public.ledger_transactions USING btree (transaction_reference);


--
-- Name: idx_ledger_tx_settlement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_tx_settlement ON public.ledger_transactions USING btree (settlement_id);


--
-- Name: idx_mv_tenant_kpis_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_tenant_kpis_tenant ON public.mv_tenant_performance_kpis USING btree (tenant_id);


--
-- Name: idx_notif_delivery_notif; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_delivery_notif ON public.notification_deliveries USING btree (notification_id);


--
-- Name: idx_notif_pref_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_pref_user ON public.notification_preferences USING btree (user_id);


--
-- Name: idx_notifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_status ON public.notifications USING btree (status);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_org_gstin_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_org_gstin_active ON public.organizations USING btree (lower((gstin)::text)) WHERE ((deleted_at IS NULL) AND (gstin IS NOT NULL));


--
-- Name: idx_organizations_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organizations_profile ON public.organizations USING btree (bidder_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_outbox_unprocessed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_outbox_unprocessed ON public.outbox_events USING btree (processed) WHERE (processed = false);


--
-- Name: idx_pay_tx_reference; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pay_tx_reference ON public.payment_transactions USING btree (gateway_reference);


--
-- Name: idx_payment_advices_settlement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_advices_settlement ON public.payment_advices USING btree (settlement_id);


--
-- Name: idx_payment_allocations_payment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_allocations_payment ON public.payment_allocations USING btree (payment_id);


--
-- Name: idx_payment_allocations_settlement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_allocations_settlement ON public.payment_allocations USING btree (settlement_id);


--
-- Name: idx_payment_transactions_payment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_transactions_payment ON public.payment_transactions USING btree (payment_id);


--
-- Name: idx_payments_num; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_num ON public.payments USING btree (payment_number);


--
-- Name: idx_payments_reference_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_reference_number ON public.payments USING btree (reference_number);


--
-- Name: idx_payments_settlement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_settlement ON public.payments USING btree (settlement_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_permissions_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permissions_name ON public.permissions USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_refresh_tokens_family; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_family ON public.refresh_tokens USING btree (token_family_id);


--
-- Name: idx_refresh_tokens_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: idx_roles_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_name ON public.roles USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_sale_confirmations_winner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sale_confirmations_winner ON public.sale_confirmations USING btree (winner_id);


--
-- Name: idx_sc_document_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sc_document_number ON public.sale_confirmations USING btree (document_number);


--
-- Name: idx_seller_companies_active_gstin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_seller_companies_active_gstin ON public.seller_companies USING btree (lower((gstin)::text)) WHERE ((deleted_at IS NULL) AND (gstin IS NOT NULL));


--
-- Name: idx_seller_companies_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seller_companies_profile ON public.seller_companies USING btree (seller_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_seller_documents_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seller_documents_profile ON public.seller_documents USING btree (seller_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_seller_documents_profile_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_seller_documents_profile_hash ON public.seller_documents USING btree (seller_profile_id, document_hash) WHERE (deleted_at IS NULL);


--
-- Name: idx_seller_profile_active_pan_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_seller_profile_active_pan_hash ON public.seller_profiles USING btree (pan_hash) WHERE ((deleted_at IS NULL) AND (pan_hash IS NOT NULL));


--
-- Name: idx_seller_profile_active_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_seller_profile_active_user ON public.seller_profiles USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_seller_profiles_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seller_profiles_state ON public.seller_profiles USING btree (state) WHERE (deleted_at IS NULL);


--
-- Name: idx_seller_reviews_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seller_reviews_profile ON public.seller_reviews USING btree (seller_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_seller_state_history_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seller_state_history_profile ON public.seller_state_history USING btree (seller_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_seller_warehouses_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seller_warehouses_profile ON public.seller_warehouses USING btree (seller_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_settlement_histories_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settlement_histories_aud_rev ON public.settlement_histories_aud USING btree (rev);


--
-- Name: idx_settlement_histories_settlement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settlement_histories_settlement ON public.settlement_histories USING btree (settlement_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_settlement_histories_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settlement_histories_timestamp ON public.settlement_histories USING btree (action_timestamp);


--
-- Name: idx_settlement_recon_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settlement_recon_aud_rev ON public.settlement_reconciliations_aud USING btree (rev);


--
-- Name: idx_settlement_recon_settlement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settlement_recon_settlement ON public.settlement_reconciliations USING btree (settlement_id);


--
-- Name: idx_settlements_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settlements_aud_rev ON public.settlements_aud USING btree (rev);


--
-- Name: idx_settlements_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settlements_status ON public.settlements USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_settlements_winner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_settlements_winner ON public.settlements USING btree (winner_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_state_history_auction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_state_history_auction_id ON public.auction_state_history USING btree (auction_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_state_history_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_state_history_profile ON public.bidder_state_history USING btree (bidder_profile_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_state_history_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_state_history_timestamp ON public.auction_state_history USING btree ("timestamp" DESC) WHERE (deleted_at IS NULL);


--
-- Name: idx_tax_breakup_settlement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_breakup_settlement ON public.tax_breakups USING btree (settlement_id);


--
-- Name: idx_tax_breakups_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_breakups_aud_rev ON public.tax_breakups_aud USING btree (rev);


--
-- Name: idx_tax_config_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_config_is_active ON public.tax_configurations USING btree (is_active);


--
-- Name: idx_tax_config_region; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_config_region ON public.tax_configurations USING btree (region_code, tax_name);


--
-- Name: idx_tax_configurations_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_configurations_aud_rev ON public.tax_configurations_aud USING btree (rev);


--
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_active ON public.users USING btree (is_active) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_locked; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_locked ON public.users USING btree (is_locked) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_user_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_user_type ON public.users USING btree (user_type);


--
-- Name: idx_wallets_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallets_aud_rev ON public.wallets_aud USING btree (rev);


--
-- Name: idx_wallets_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallets_user ON public.wallets USING btree (user_id);


--
-- Name: idx_winner_histories_aud_rev; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_winner_histories_aud_rev ON public.winner_histories_aud USING btree (rev);


--
-- Name: idx_winner_histories_correlation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_winner_histories_correlation ON public.winner_histories USING btree (correlation_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_winner_histories_winner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_winner_histories_winner_id ON public.winner_histories USING btree (winner_id) WHERE (deleted_at IS NULL);


--
-- Name: bank_accounts trg_bank_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bidder_profiles trg_bidder_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bidder_profiles_updated_at BEFORE UPDATE ON public.bidder_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bidder_state_history trg_bidder_state_history_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bidder_state_history_updated_at BEFORE UPDATE ON public.bidder_state_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: kyc_documents trg_kyc_documents_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: kyc_reviews trg_kyc_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_kyc_reviews_updated_at BEFORE UPDATE ON public.kyc_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organizations trg_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seller_companies trg_seller_companies_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_seller_companies_updated_at BEFORE UPDATE ON public.seller_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seller_documents trg_seller_documents_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_seller_documents_updated_at BEFORE UPDATE ON public.seller_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seller_profiles trg_seller_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_seller_profiles_updated_at BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seller_reviews trg_seller_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_seller_reviews_updated_at BEFORE UPDATE ON public.seller_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seller_state_history trg_seller_state_history_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_seller_state_history_updated_at BEFORE UPDATE ON public.seller_state_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seller_warehouses trg_seller_warehouses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_seller_warehouses_updated_at BEFORE UPDATE ON public.seller_warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payment_advices fk_advices_settlement; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_advices
    ADD CONSTRAINT fk_advices_settlement FOREIGN KEY (settlement_id) REFERENCES public.settlements(id) ON DELETE RESTRICT;


--
-- Name: payment_allocations fk_allocations_payment; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT fk_allocations_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: payment_allocations fk_allocations_settlement; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT fk_allocations_settlement FOREIGN KEY (settlement_id) REFERENCES public.settlements(id) ON DELETE RESTRICT;


--
-- Name: auction_events_aud fk_auction_events_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_events_aud
    ADD CONSTRAINT fk_auction_events_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: auction_lots fk_auction_lots_auction; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_lots
    ADD CONSTRAINT fk_auction_lots_auction FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;


--
-- Name: auction_lots_aud fk_auction_lots_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_lots_aud
    ADD CONSTRAINT fk_auction_lots_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: auction_lots fk_auction_lots_winner; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_lots
    ADD CONSTRAINT fk_auction_lots_winner FOREIGN KEY (winner_bidder_id) REFERENCES public.bidder_profiles(id) ON DELETE SET NULL;


--
-- Name: auction_results_aud fk_auction_results_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_results_aud
    ADD CONSTRAINT fk_auction_results_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: auction_results fk_auction_results_lot; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_results
    ADD CONSTRAINT fk_auction_results_lot FOREIGN KEY (auction_lot_id) REFERENCES public.auction_lots(id) ON DELETE CASCADE;


--
-- Name: auction_results fk_auction_results_winner; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_results
    ADD CONSTRAINT fk_auction_results_winner FOREIGN KEY (winner_id) REFERENCES public.auction_winners(id) ON DELETE SET NULL;


--
-- Name: auction_settings fk_auction_settings_auction; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_settings
    ADD CONSTRAINT fk_auction_settings_auction FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;


--
-- Name: auction_settings_aud fk_auction_settings_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_settings_aud
    ADD CONSTRAINT fk_auction_settings_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: auction_winners_aud fk_auction_winners_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_winners_aud
    ADD CONSTRAINT fk_auction_winners_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: auction_winners fk_auction_winners_bid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_winners
    ADD CONSTRAINT fk_auction_winners_bid FOREIGN KEY (bid_id) REFERENCES public.bids(id);


--
-- Name: auction_winners fk_auction_winners_bidder; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_winners
    ADD CONSTRAINT fk_auction_winners_bidder FOREIGN KEY (bidder_id) REFERENCES public.bidder_profiles(id);


--
-- Name: auction_winners fk_auction_winners_lot; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_winners
    ADD CONSTRAINT fk_auction_winners_lot FOREIGN KEY (auction_lot_id) REFERENCES public.auction_lots(id) ON DELETE CASCADE;


--
-- Name: auctions_aud fk_auctions_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auctions_aud
    ADD CONSTRAINT fk_auctions_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: auctions fk_auctions_seller_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT fk_auctions_seller_profile FOREIGN KEY (seller_profile_id) REFERENCES public.seller_profiles(id) ON DELETE RESTRICT;


--
-- Name: auction_bidder_authorizations fk_auth_auction; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_bidder_authorizations
    ADD CONSTRAINT fk_auth_auction FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;


--
-- Name: auction_bidder_authorizations_aud fk_auth_aud_rev; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_bidder_authorizations_aud
    ADD CONSTRAINT fk_auth_aud_rev FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: auction_bidder_authorizations fk_auth_bidder; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_bidder_authorizations
    ADD CONSTRAINT fk_auth_bidder FOREIGN KEY (bidder_id) REFERENCES public.bidder_profiles(id) ON DELETE CASCADE;


--
-- Name: bank_accounts fk_bank_account_bidder_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT fk_bank_account_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES public.bidder_profiles(id) ON DELETE CASCADE;


--
-- Name: bank_reconciliations_aud fk_bank_recon_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_reconciliations_aud
    ADD CONSTRAINT fk_bank_recon_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: bid_histories fk_bid_histories_lot; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bid_histories
    ADD CONSTRAINT fk_bid_histories_lot FOREIGN KEY (auction_lot_id) REFERENCES public.auction_lots(id) ON DELETE CASCADE;


--
-- Name: bid_histories fk_bid_histories_winner_after; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bid_histories
    ADD CONSTRAINT fk_bid_histories_winner_after FOREIGN KEY (winner_after_id) REFERENCES public.bidder_profiles(id) ON DELETE SET NULL;


--
-- Name: bid_histories fk_bid_histories_winner_before; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bid_histories
    ADD CONSTRAINT fk_bid_histories_winner_before FOREIGN KEY (winner_before_id) REFERENCES public.bidder_profiles(id) ON DELETE SET NULL;


--
-- Name: bidder_profiles fk_bidder_profile_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bidder_profiles
    ADD CONSTRAINT fk_bidder_profile_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bids fk_bids_bidder; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT fk_bids_bidder FOREIGN KEY (bidder_id) REFERENCES public.bidder_profiles(id) ON DELETE RESTRICT;


--
-- Name: bids fk_bids_lot; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT fk_bids_lot FOREIGN KEY (auction_lot_id) REFERENCES public.auction_lots(id) ON DELETE CASCADE;


--
-- Name: closing_periods_aud fk_closing_periods_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.closing_periods_aud
    ADD CONSTRAINT fk_closing_periods_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: contract_versions_aud fk_contract_versions_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions_aud
    ADD CONSTRAINT fk_contract_versions_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: contract_versions fk_contract_versions_contract; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT fk_contract_versions_contract FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contracts_aud fk_contracts_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts_aud
    ADD CONSTRAINT fk_contracts_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: contracts fk_contracts_sale_confirmation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT fk_contracts_sale_confirmation FOREIGN KEY (sale_confirmation_id) REFERENCES public.sale_confirmations(id) ON DELETE SET NULL;


--
-- Name: contracts fk_contracts_winner; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT fk_contracts_winner FOREIGN KEY (winner_id) REFERENCES public.auction_winners(id) ON DELETE RESTRICT;


--
-- Name: fee_invoice_items fk_fee_invoice_items_invoice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoice_items
    ADD CONSTRAINT fk_fee_invoice_items_invoice FOREIGN KEY (fee_invoice_id) REFERENCES public.fee_invoices(id) ON DELETE CASCADE;


--
-- Name: fee_invoices fk_fee_invoices_po; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT fk_fee_invoices_po FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);


--
-- Name: gst_invoice_items fk_gst_invoice_items_invoice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gst_invoice_items
    ADD CONSTRAINT fk_gst_invoice_items_invoice FOREIGN KEY (gst_invoice_id) REFERENCES public.gst_invoices(id) ON DELETE CASCADE;


--
-- Name: gst_invoices fk_gst_invoices_settlement; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gst_invoices
    ADD CONSTRAINT fk_gst_invoices_settlement FOREIGN KEY (settlement_id) REFERENCES public.settlements(id);


--
-- Name: kyc_documents fk_kyc_document_bidder_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT fk_kyc_document_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES public.bidder_profiles(id) ON DELETE CASCADE;


--
-- Name: kyc_documents fk_kyc_document_org; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT fk_kyc_document_org FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: kyc_documents fk_kyc_document_uploader; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT fk_kyc_document_uploader FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kyc_reviews fk_kyc_review_bidder_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kyc_reviews
    ADD CONSTRAINT fk_kyc_review_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES public.bidder_profiles(id) ON DELETE CASCADE;


--
-- Name: kyc_reviews fk_kyc_review_reviewer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kyc_reviews
    ADD CONSTRAINT fk_kyc_review_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: ledger_entries_aud fk_ledger_entries_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entries_aud
    ADD CONSTRAINT fk_ledger_entries_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: ledger_entries fk_ledger_entries_tx; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT fk_ledger_entries_tx FOREIGN KEY (ledger_transaction_id) REFERENCES public.ledger_transactions(id) ON DELETE CASCADE;


--
-- Name: ledger_transactions_aud fk_ledger_tx_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_transactions_aud
    ADD CONSTRAINT fk_ledger_tx_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: notification_deliveries_aud fk_notif_deliveries_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_deliveries_aud
    ADD CONSTRAINT fk_notif_deliveries_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: notification_preferences_aud fk_notif_preferences_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences_aud
    ADD CONSTRAINT fk_notif_preferences_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: notification_templates_aud fk_notif_templates_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates_aud
    ADD CONSTRAINT fk_notif_templates_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: notification_deliveries fk_notification_delivery_notif; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT fk_notification_delivery_notif FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: notifications_aud fk_notifications_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications_aud
    ADD CONSTRAINT fk_notifications_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: organizations fk_organization_bidder_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT fk_organization_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES public.bidder_profiles(id) ON DELETE CASCADE;


--
-- Name: payment_advices_aud fk_payment_adv_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_advices_aud
    ADD CONSTRAINT fk_payment_adv_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: payment_allocations_aud fk_payment_alloc_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_allocations_aud
    ADD CONSTRAINT fk_payment_alloc_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: payment_transactions_aud fk_payment_tx_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions_aud
    ADD CONSTRAINT fk_payment_tx_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: payments_aud fk_payments_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments_aud
    ADD CONSTRAINT fk_payments_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: payments fk_payments_settlement; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_settlement FOREIGN KEY (settlement_id) REFERENCES public.settlements(id) ON DELETE RESTRICT;


--
-- Name: purchase_order_items fk_po_items_po; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT fk_po_items_po FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: purchase_orders fk_purchase_orders_sc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT fk_purchase_orders_sc FOREIGN KEY (sale_confirmation_id) REFERENCES public.sale_confirmations(id);


--
-- Name: refresh_tokens fk_refresh_tokens_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions fk_role_permissions_permission; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions fk_role_permissions_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: sale_confirmation_versions fk_sc_versions_sc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_confirmation_versions
    ADD CONSTRAINT fk_sc_versions_sc FOREIGN KEY (sale_confirmation_id) REFERENCES public.sale_confirmations(id) ON DELETE CASCADE;


--
-- Name: seller_companies fk_seller_company_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_companies
    ADD CONSTRAINT fk_seller_company_profile FOREIGN KEY (seller_profile_id) REFERENCES public.seller_profiles(id) ON DELETE CASCADE;


--
-- Name: seller_documents fk_seller_document_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_documents
    ADD CONSTRAINT fk_seller_document_profile FOREIGN KEY (seller_profile_id) REFERENCES public.seller_profiles(id) ON DELETE CASCADE;


--
-- Name: seller_profiles fk_seller_profile_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_profiles
    ADD CONSTRAINT fk_seller_profile_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: seller_reviews fk_seller_review_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_reviews
    ADD CONSTRAINT fk_seller_review_profile FOREIGN KEY (seller_profile_id) REFERENCES public.seller_profiles(id) ON DELETE CASCADE;


--
-- Name: seller_reviews fk_seller_review_reviewer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_reviews
    ADD CONSTRAINT fk_seller_review_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: seller_warehouses fk_seller_warehouse_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_warehouses
    ADD CONSTRAINT fk_seller_warehouse_profile FOREIGN KEY (seller_profile_id) REFERENCES public.seller_profiles(id) ON DELETE CASCADE;


--
-- Name: settlement_histories_aud fk_settlement_histories_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_histories_aud
    ADD CONSTRAINT fk_settlement_histories_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: settlement_histories fk_settlement_histories_settlement; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_histories
    ADD CONSTRAINT fk_settlement_histories_settlement FOREIGN KEY (settlement_id) REFERENCES public.settlements(id) ON DELETE CASCADE;


--
-- Name: settlement_reconciliations_aud fk_settlement_recon_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_reconciliations_aud
    ADD CONSTRAINT fk_settlement_recon_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: settlements_aud fk_settlements_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements_aud
    ADD CONSTRAINT fk_settlements_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: settlements fk_settlements_contract; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT fk_settlements_contract FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE RESTRICT;


--
-- Name: bidder_state_history fk_state_history_actor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bidder_state_history
    ADD CONSTRAINT fk_state_history_actor FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: auction_state_history fk_state_history_auction; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auction_state_history
    ADD CONSTRAINT fk_state_history_auction FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;


--
-- Name: bidder_state_history fk_state_history_bidder_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bidder_state_history
    ADD CONSTRAINT fk_state_history_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES public.bidder_profiles(id) ON DELETE CASCADE;


--
-- Name: seller_state_history fk_state_history_seller_actor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_state_history
    ADD CONSTRAINT fk_state_history_seller_actor FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: seller_state_history fk_state_history_seller_profile; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_state_history
    ADD CONSTRAINT fk_state_history_seller_profile FOREIGN KEY (seller_profile_id) REFERENCES public.seller_profiles(id) ON DELETE CASCADE;


--
-- Name: tax_breakups_aud fk_tax_breakups_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_breakups_aud
    ADD CONSTRAINT fk_tax_breakups_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: tax_configurations_aud fk_tax_configurations_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_configurations_aud
    ADD CONSTRAINT fk_tax_configurations_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: payment_transactions fk_transactions_payment; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT fk_transactions_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_user_roles_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_user_roles_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallets_aud fk_wallets_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets_aud
    ADD CONSTRAINT fk_wallets_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: winner_histories_aud fk_winner_histories_aud_revinfo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winner_histories_aud
    ADD CONSTRAINT fk_winner_histories_aud_revinfo FOREIGN KEY (rev) REFERENCES public.revinfo(rev);


--
-- Name: winner_histories fk_winner_histories_winner; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winner_histories
    ADD CONSTRAINT fk_winner_histories_winner FOREIGN KEY (winner_id) REFERENCES public.auction_winners(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict QLgVDUaGrLFrJOO44HafFeUqhz5qTesShPfbSbDgacGYvmMDhYX0p0e7fORbz92

