CREATE TABLE IF NOT EXISTS auction_bidder_authorizations_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    auction_id UUID,
    bidder_id UUID,
    is_authorized BOOLEAN,
    authorization_reason VARCHAR(255),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    version BIGINT,

    PRIMARY KEY (id, rev),

    CONSTRAINT fk_auth_aud_rev
        FOREIGN KEY (rev)
        REFERENCES revinfo(rev)
);