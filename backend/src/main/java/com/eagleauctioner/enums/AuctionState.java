package com.eagleauctioner.enums;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Represents the various states an auction can be in during its lifecycle.
 */
public enum AuctionState {
    DRAFT,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    PUBLISHED,
    LIVE,
    ENDED,
    SETTLED,
    CANCELLED,
    SUSPENDED,
    ARCHIVED;

    /**
     * Determines if a transition from the current state to the target state is valid.
     */
    public boolean canTransitionTo(AuctionState target) {
        return getNextValidStates().contains(target);
    }

    /**
     * Returns the list of valid next states from the current state.
     */
    public List<AuctionState> getNextValidStates() {
        switch (this) {
            case DRAFT:
                return List.of(UNDER_REVIEW);
            case UNDER_REVIEW:
                return List.of(APPROVED, REJECTED);
            case APPROVED:
                return List.of(PUBLISHED, CANCELLED);
            case REJECTED:
                return List.of(DRAFT, UNDER_REVIEW);
            case PUBLISHED:
                return List.of(LIVE, CANCELLED, SUSPENDED);
            case LIVE:
                return List.of(ENDED, CANCELLED, SUSPENDED);
            case ENDED:
                return List.of(SETTLED, CANCELLED);
            case SETTLED:
                return List.of(ARCHIVED);
            case CANCELLED:
                return List.of(ARCHIVED);
            case SUSPENDED:
                return List.of(PUBLISHED, LIVE, CANCELLED);
            case ARCHIVED:
            default:
                return Collections.emptyList();
        }
    }
}
