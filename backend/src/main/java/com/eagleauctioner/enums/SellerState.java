package com.eagleauctioner.enums;

import java.util.Set;

/**
 * Represents the lifecycle states of a Seller during the onboarding and operations.
 * Implements strict state transition validation rules supporting approval, suspension,
 * and blacklisting workflows.
 */
public enum SellerState {
    DRAFT {
        @Override
        public Set<SellerState> getNextValidStates() {
            return Set.of(UNDER_REVIEW);
        }
    },
    UNDER_REVIEW {
        @Override
        public Set<SellerState> getNextValidStates() {
            return Set.of(APPROVED, REJECTED);
        }
    },
    APPROVED {
        @Override
        public Set<SellerState> getNextValidStates() {
            return Set.of(UNDER_REVIEW, SUSPENDED, BLACKLISTED);
        }
    },
    REJECTED {
        @Override
        public Set<SellerState> getNextValidStates() {
            return Set.of(DRAFT, UNDER_REVIEW);
        }
    },
    SUSPENDED {
        @Override
        public Set<SellerState> getNextValidStates() {
            return Set.of(APPROVED, BLACKLISTED);
        }
    },
    BLACKLISTED {
        @Override
        public Set<SellerState> getNextValidStates() {
            return Set.of(APPROVED); // Re-instatement through strict admin escalation only
        }
    };

    /**
     * @return The set of states that this state can transition to.
     */
    public abstract Set<SellerState> getNextValidStates();

    /**
     * Validates if a transition from this state to the target state is allowed.
     *
     * @param targetState The proposed next state
     * @return true if the transition is allowed, false otherwise
     */
    public boolean canTransitionTo(SellerState targetState) {
        if (targetState == this) {
            return true; // Self-transition is always allowed/idempotent
        }
        return getNextValidStates().contains(targetState);
    }
}
