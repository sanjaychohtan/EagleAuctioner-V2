package com.eagleauctioner.enums;

import java.util.Set;

/**
 * Represents the lifecycle states of a Bidder during the onboarding process.
 * Implements strict state transition validation rules.
 */
public enum BidderState {
    DRAFT {
        @Override
        public Set<BidderState> getNextValidStates() {
            return Set.of(KYC_PENDING);
        }
    },
    KYC_PENDING {
        @Override
        public Set<BidderState> getNextValidStates() {
            return Set.of(UNDER_REVIEW, DRAFT);
        }
    },
    UNDER_REVIEW {
        @Override
        public Set<BidderState> getNextValidStates() {
            return Set.of(APPROVED, REJECTED);
        }
    },
    APPROVED {
        @Override
        public Set<BidderState> getNextValidStates() {
            return Set.of(SUSPENDED);
        }
    },
    REJECTED {
        @Override
        public Set<BidderState> getNextValidStates() {
            return Set.of(DRAFT, KYC_PENDING);
        }
    },
    SUSPENDED {
        @Override
        public Set<BidderState> getNextValidStates() {
            return Set.of(APPROVED, REJECTED);
        }
    };

    /**
     * @return The set of states that this state can transition to.
     */
    public abstract Set<BidderState> getNextValidStates();

    /**
     * Validates if a transition from this state to the target state is allowed.
     *
     * @param targetState The proposed next state
     * @return true if the transition is allowed, false otherwise
     */
    public boolean canTransitionTo(BidderState targetState) {
        if (targetState == this) {
            return true; // Self-transition is always allowed/idempotent
        }
        return getNextValidStates().contains(targetState);
    }
}
